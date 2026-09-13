import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { createHmac, randomBytes } from "node:crypto";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EnsureUserUseCase } from "./application/ensure-user.use-case.js";
import {
  CLERK_WEBHOOK_SECRET,
  ClerkWebhookController,
} from "./presentation/controllers/clerk-webhook.controller.js";

const SECRET_KEY = randomBytes(32);
const SIGNING_SECRET = `whsec_${SECRET_KEY.toString("base64")}`;

function sign(payload: string): { headers: Record<string, string>; body: string } {
  const msgId = "msg_test";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = createHmac("sha256", SECRET_KEY)
    .update(`${msgId}.${timestamp}.${payload}`)
    .digest("base64");
  return {
    body: payload,
    headers: {
      "svix-id": msgId,
      "svix-timestamp": timestamp,
      "svix-signature": `v1,${signature}`,
    },
  };
}

describe("ClerkWebhookController", () => {
  let app: INestApplication;
  const ensureUser = {
    execute: vi.fn().mockResolvedValue({ id: "user_1" }),
  };

  beforeEach(async () => {
    ensureUser.execute.mockClear();
    const moduleRef = await Test.createTestingModule({
      controllers: [ClerkWebhookController],
      providers: [
        { provide: EnsureUserUseCase, useValue: ensureUser },
        { provide: CLERK_WEBHOOK_SECRET, useValue: SIGNING_SECRET },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ rawBody: true });
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("upserts the user on a valid user.created event", async () => {
    const { body, headers } = sign(
      JSON.stringify({
        type: "user.created",
        data: {
          id: "user_123",
          email_addresses: [{ id: "idn_1", email_address: "ada@example.com" }],
          first_name: "Ada",
          last_name: "Lovelace",
          public_metadata: { role: "user" },
        },
      }),
    );

    const res = await request(app.getHttpServer()).post("/v1/api/clerk/webhook").set(headers).send(body);

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ received: true });
    expect(ensureUser.execute).toHaveBeenCalledWith({
      id: "user_123",
      email: "ada@example.com",
      name: "Ada Lovelace",
      role: "user",
    });
  });

  it("defaults role to user and derives name from first_name only", async () => {
    const { body, headers } = sign(
      JSON.stringify({
        type: "user.created",
        data: {
          id: "user_456",
          email_addresses: [{ id: "idn_2", email_address: "bob@example.com" }],
          first_name: "Bob",
          last_name: null,
        },
      }),
    );

    await request(app.getHttpServer()).post("/v1/api/clerk/webhook").set(headers).send(body);

    expect(ensureUser.execute).toHaveBeenCalledWith({
      id: "user_456",
      email: "bob@example.com",
      name: "Bob",
      role: "user",
    });
  });

  it("derives name from last_name only when first_name is missing", async () => {
    const { body, headers } = sign(
      JSON.stringify({
        type: "user.created",
        data: {
          id: "user_789",
          email_addresses: [{ id: "idn_3", email_address: "hopper@example.com" }],
          first_name: null,
          last_name: "Hopper",
        },
      }),
    );

    await request(app.getHttpServer()).post("/v1/api/clerk/webhook").set(headers).send(body);

    expect(ensureUser.execute).toHaveBeenCalledWith({
      id: "user_789",
      email: "hopper@example.com",
      name: "Hopper",
      role: "user",
    });
  });

  it("sets name to null when both first_name and last_name are missing", async () => {
    const { body, headers } = sign(
      JSON.stringify({
        type: "user.created",
        data: {
          id: "user_000",
          email_addresses: [{ id: "idn_4", email_address: "anon@example.com" }],
        },
      }),
    );

    await request(app.getHttpServer()).post("/v1/api/clerk/webhook").set(headers).send(body);

    expect(ensureUser.execute).toHaveBeenCalledWith({
      id: "user_000",
      email: "anon@example.com",
      name: null,
      role: "user",
    });
  });

  it("rejects requests with an invalid signature", async () => {
    const { headers } = sign(JSON.stringify({ type: "user.created", data: { id: "user_1" } }));

    const res = await request(app.getHttpServer())
      .post("/v1/api/clerk/webhook")
      .set({ ...headers, "svix-signature": "v1,bad" })
      .send(JSON.stringify({ type: "user.created", data: { id: "user_1" } }));

    expect(res.status).toBe(401);
    expect(ensureUser.execute).not.toHaveBeenCalled();
  });

  it("ignores unrelated webhook event types", async () => {
    const { body, headers } = sign(JSON.stringify({ type: "session.ended", data: { id: "sess_1" } }));

    const res = await request(app.getHttpServer()).post("/v1/api/clerk/webhook").set(headers).send(body);

    expect(res.status).toBe(201);
    expect(ensureUser.execute).not.toHaveBeenCalled();
  });

  it("returns 503 when CLERK_WEBHOOK_SECRET is not configured", async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ClerkWebhookController],
      providers: [
        { provide: EnsureUserUseCase, useValue: ensureUser },
        { provide: CLERK_WEBHOOK_SECRET, useValue: "" },
      ],
    }).compile();
    const noSecretApp = moduleRef.createNestApplication({ rawBody: true });
    await noSecretApp.init();

    try {
      const res = await request(noSecretApp.getHttpServer())
        .post("/v1/api/clerk/webhook")
        .send(JSON.stringify({ type: "user.created", data: { id: "user_1" } }));

      expect(res.status).toBe(503);
      expect(ensureUser.execute).not.toHaveBeenCalled();
    } finally {
      await noSecretApp.close();
    }
  });
});