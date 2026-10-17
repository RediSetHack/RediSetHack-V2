import { Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { deletedUsers, users, type Database } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { User } from "../domain/entities/user.entity.js";
import { UserRepository } from "../domain/ports/user.repository.js";
import { ClerkAuthenticatedUser } from "../domain/ports/clerk-auth.port.js";
import { InvalidUserEmailError, UserDeletedError, UserNotFoundError } from "../domain/errors.js";
import { AccountDeletionRepository } from "../domain/ports/account-deletion.repository.js";

type UserRow = typeof users.$inferSelect;

function toDomain(row: UserRow): User {
  return new User(row.id, row.email, row.name, row.characterId, row.totalXp);
}

@Injectable()
export class DrizzleUserRepository implements UserRepository, AccountDeletionRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async upsert(identity: ClerkAuthenticatedUser): Promise<User> {
    return this.database.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${identity.id}, 0))`);
      const deleted = await tx.query.deletedUsers.findFirst({ where: eq(deletedUsers.id, identity.id) });
      if (deleted) throw new UserDeletedError(identity.id);

      const now = new Date();
      let email = identity.email?.trim() || null;

      if (!email) {
        const existingRow = await tx.query.users.findFirst({ where: eq(users.id, identity.id) });
        const existing = existingRow ? toDomain(existingRow) : null;
        if (existing) {
          email = existing.email;
        } else {
          throw new InvalidUserEmailError(identity.id);
        }
      }

      const rows = await tx
        .insert(users)
        .values({ id: identity.id, email, name: identity.name })
        .onConflictDoUpdate({
          target: users.id,
          set: { email, name: identity.name ?? sql`${users.name}`, updatedAt: now },
        })
        .returning();
      return toDomain(rows[0]!);
    });
  }

  async deleteUser(userId: string): Promise<void> {
    await this.database.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${userId}, 0))`);
      await tx.insert(deletedUsers).values({ id: userId }).onConflictDoNothing();
      await tx.delete(users).where(eq(users.id, userId));
    });
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

  async awardXp(userId: string, amount: number): Promise<User> {
    const rows = await this.database
      .update(users)
      .set({ totalXp: sql`${users.totalXp} + ${amount}`, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    const row = rows[0];
    if (!row) {
      throw new UserNotFoundError(userId);
    }
    return toDomain(row);
  }
}
