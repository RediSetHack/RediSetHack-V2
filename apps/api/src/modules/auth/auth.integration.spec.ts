import { Controller, Get, INestApplication, UseGuards, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { IncomingMessage } from "node:http";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { Character } from "./domain/entities/character.entity.js";
import { User } from "./domain/entities/user.entity.js";
import { CharacterRepository } from "./domain/ports/character.repository.js";
import { ClerkAuthPort, type ClerkAuthenticatedUser } from "./domain/ports/clerk-auth.port.js";
import { UserRepository } from "./domain/ports/user.repository.js";
import { EnsureUserUseCase } from "./application/ensure-user.use-case.js";
import { SelectCharacterUseCase } from "./application/select-character.use-case.js";
import { AdminGuard } from "./presentation/guards/admin.guard.js";
import { ClerkAuthGuard } from "./presentation/guards/clerk-auth.guard.js";
import { SelectCharacterController } from "./presentation/controllers/select-character.controller.js";
import { GetUserMeController } from "./presentation/controllers/get-user-me.controller.js";
import { SyncUserController } from "./presentation/controllers/sync-user.controller.js";
import { GetUserUseCase } from "./application/get-user.use-case.js";

@Controller("v1/api/test")
class AdminProbeController {
  @Get("admin")
  @UseGuards(ClerkAuthGuard, AdminGuard)
  admin() {
    return { ok: true };
  }
}

describe("auth integration", () => {
  let app: INestApplication;
  const userStore = new Map<string, User>();
  const character = new Character(1, "Knight", "knight", null, null);

  const fakeClerk: ClerkAuthPort = {
    async authenticate(request: IncomingMessage) {
      if (request.headers["authorization"] !== "Bearer valid-token") {
        return null;
      }
      const isAdmin = request.headers["x-probe-role"] === "admin";
      return {
        id: isAdmin ? "user_admin" : "user_learner",
        email: isAdmin ? "admin@example.com" : "learner@example.com",
        name: isAdmin ? "Admin" : "Learner",
        role: isAdmin ? "admin" : "user",
      } satisfies ClerkAuthenticatedUser;
    },
  };

  const fakeUsers: UserRepository = {
    async upsert(identity) {
      const user = new User(identity.id, identity.email ?? "", identity.name, null, 0);
      userStore.set(user.id, user);
      return user;
    },
    async findById(id) {
      return userStore.get(id) ?? null;
    },
    async findByEmail(email) {
      for (const u of userStore.values()) {
        if (u.email === email) return u;
      }
      return null;
    },
    async updateCharacter(userId, characterId) {
      const existing = userStore.get(userId);
      if (!existing) {
        throw new Error(`user ${userId} not found`);
      }
      const updated = new User(existing.id, existing.email, existing.name, characterId, existing.totalXp);
      userStore.set(userId, updated);
      return updated;
    },
    async awardXp(userId, amount) {
      const existing = userStore.get(userId);
      if (!existing) {
        throw new Error(`user ${userId} not found`);
      }
      const updated = new User(
        existing.id,
        existing.email,
        existing.name,
        existing.characterId,
        existing.totalXp + amount,
      );
      userStore.set(userId, updated);
      return updated;
    },
  };

  const fakeCharacters: CharacterRepository = {
    async findById(id) {
      return id === character.id ? character : null;
    },
  };

  beforeEach(async () => {
    userStore.clear();
    const moduleRef = await Test.createTestingModule({
      controllers: [
        SelectCharacterController,
        GetUserMeController,
        SyncUserController,
        AdminProbeController,
      ],
      providers: [
        { provide: ClerkAuthPort, useValue: fakeClerk },
        { provide: UserRepository, useValue: fakeUsers },
        { provide: CharacterRepository, useValue: fakeCharacters },
        ClerkAuthGuard,
        AdminGuard,
        EnsureUserUseCase,
        GetUserUseCase,
        SelectCharacterUseCase,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app.getHttpServer())
      .patch("/v1/api/user/character")
      .send({ characterId: 1 });

    expect(res.status).toBe(401);
  });

  it("rejects non-admin users on admin-guarded routes with 403", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/api/test/admin")
      .set("authorization", "Bearer valid-token")
      .set("x-probe-role", "user");

    expect(res.status).toBe(403);
  });

  it("allows admin users on admin-guarded routes", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/api/test/admin")
      .set("authorization", "Bearer valid-token")
      .set("x-probe-role", "admin");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("selects a character and persists the authenticated user", async () => {
    const res = await request(app.getHttpServer())
      .patch("/v1/api/user/character")
      .set("authorization", "Bearer valid-token")
      .send({ characterId: 1 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: "user_learner",
      email: "learner@example.com",
      characterId: 1,
    });

    const persisted = userStore.get("user_learner");
    expect(persisted).not.toBeUndefined();
    expect(persisted?.characterId).toBe(1);
  });

  it("returns 404 for an unknown character", async () => {
    const res = await request(app.getHttpServer())
      .patch("/v1/api/user/character")
      .set("authorization", "Bearer valid-token")
      .send({ characterId: 999 });

    expect(res.status).toBe(404);
    expect(userStore.get("user_learner")?.characterId).toBeNull();
  });

  it("rejects a request without a characterId body", async () => {
    const res = await request(app.getHttpServer())
      .patch("/v1/api/user/character")
      .set("authorization", "Bearer valid-token")
      .send({});

    expect(res.status).toBe(400);
  });

  it("returns 404 with 'No account associated with this email, please sign up' when user is not in database", async () => {
    const res = await request(app.getHttpServer())
      .get("/v1/api/user/me")
      .set("authorization", "Bearer valid-token");

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("No account associated with this email, please sign up");
  });

  it("stores the user in the database on sync (signup) and allows retrieval on /me", async () => {
    // 1. Initially no user in database
    expect(userStore.size).toBe(0);

    // 2. User syncs after signup
    const syncRes = await request(app.getHttpServer())
      .post("/v1/api/user/sync")
      .set("authorization", "Bearer valid-token");

    expect(syncRes.status).toBe(201);
    expect(syncRes.body).toMatchObject({
      id: "user_learner",
      email: "learner@example.com",
    });
    expect(userStore.get("user_learner")).not.toBeUndefined();

    // 3. User can now be retrieved via /me
    const meRes = await request(app.getHttpServer())
      .get("/v1/api/user/me")
      .set("authorization", "Bearer valid-token");

    expect(meRes.status).toBe(200);
    expect(meRes.body).toMatchObject({
      id: "user_learner",
      email: "learner@example.com",
    });
  });
});