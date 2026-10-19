import { Inject, Injectable } from "@nestjs/common";
import { asc, count, eq, inArray, notInArray, sql } from "drizzle-orm";
import { type Database, deletedUsers, learningInteractions, users } from "@repo/db";

import { DB } from "../../../database/database.module.js";
import { InteractionSourceRepository, type InteractionRecord } from "../domain/ports/interaction-source.repository.js";

@Injectable()
export class DrizzleInteractionSourceRepository implements InteractionSourceRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async listEligible(limit: number): Promise<InteractionRecord[]> {
    const i = learningInteractions;
    // Inner join drops orphaned learners; the marker anti-join is a second guard if a deletion ever races a cascade.
    const rows = await this.database
      .select({ id: i.id, learnerId: i.learnerId, activityType: i.activityType, activityId: i.activityId, occurredAt: i.occurredAt, elapsedMs: i.elapsedMs, elapsedDefinition: i.elapsedDefinition, contentVersion: i.contentVersion, skills: i.skills, difficulty: i.difficulty, correctness: i.correctness, outcome: i.outcome, errors: i.errors, hints: i.hints })
      .from(i)
      .innerJoin(users, eq(users.id, i.learnerId))
      .where(notInArray(i.learnerId, this.database.select({ id: deletedUsers.id }).from(deletedUsers)))
      .orderBy(asc(i.occurredAt), asc(i.id))
      .limit(limit + 1);
    return rows;
  }

  async countDeletedLearnerRows(): Promise<number> {
    const [row] = await this.database.select({ n: count() }).from(learningInteractions).where(inArray(learningInteractions.learnerId, this.database.select({ id: deletedUsers.id }).from(deletedUsers)));
    return row?.n ?? 0;
  }
}
