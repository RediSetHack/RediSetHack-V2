import { Inject, Injectable } from "@nestjs/common";
import { eq, sql } from "drizzle-orm";
import { type Database, userProgress, users } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { ProgressRepository } from "../domain/ports/progress.repository.js";

@Injectable()
export class DrizzleProgressRepository implements ProgressRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async markCompleted(userId: string, stageId: number, xpEarned: number): Promise<boolean> {
    return this.database.transaction(async (tx) => {
      const inserted = await tx
        .insert(userProgress)
        .values({ userId, stageId, completed: true, completedAt: new Date() })
        .onConflictDoNothing()
        .returning({ id: userProgress.id });
      if (inserted.length === 0) return false;

      await tx
        .update(users)
        .set({ totalXp: sql`${users.totalXp} + ${xpEarned}`, updatedAt: new Date() })
        .where(eq(users.id, userId));
      return true;
    });
  }
}