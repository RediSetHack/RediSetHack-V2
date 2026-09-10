import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { users, type Database } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { User } from "../domain/entities/user.entity.js";
import { UserRepository } from "../domain/ports/user.repository.js";
import { ClerkAuthenticatedUser } from "../domain/ports/clerk-auth.port.js";
import { UserNotFoundError } from "../domain/errors.js";

type UserRow = typeof users.$inferSelect;

function toDomain(row: UserRow): User {
  return new User(row.id, row.email, row.name, row.characterId, row.totalXp);
}

@Injectable()
export class DrizzleUserRepository implements UserRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async upsert(identity: ClerkAuthenticatedUser): Promise<User> {
    const now = new Date();
    const email = identity.email ?? `${identity.id}@users.local`;
    const rows = await this.database
      .insert(users)
      .values({ id: identity.id, email, name: identity.name })
      .onConflictDoUpdate({
        target: users.id,
        set: { email, name: identity.name, updatedAt: now },
      })
      .returning();
    return toDomain(rows[0]!);
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.database.query.users.findFirst({
      where: eq(users.id, id),
    });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.database.query.users.findFirst({
      where: eq(users.email, email),
    });
    return row ? toDomain(row) : null;
  }

  async updateCharacter(userId: string, characterId: number): Promise<User> {
    const rows = await this.database
      .update(users)
      .set({ characterId, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    const row = rows[0];
    if (!row) {
      throw new UserNotFoundError(userId);
    }
    return toDomain(row);
  }
}