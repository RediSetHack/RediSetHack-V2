import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, isNull, sql } from 'drizzle-orm';
import {
  quests,
  questQuestions,
  questOptions,
  questSessions,
  questXpAwards,
  stages,
  zones,
  regions,
  results,
  users,
  type Database,
} from '@repo/db';

import { DB } from '../../../database/database.module.js';
import {
  Quest,
  QuestOption,
  QuestQuestion,
} from '../domain/entities/quest.entity.js';
import {
  QuestResult,
  type QuestResponse,
} from '../domain/entities/quest-result.entity.js';
import {
  QuestSession,
  type QuestSessionStatus,
} from '../domain/entities/quest-session.entity.js';
import {
  QuestRepository,
  type CreateSessionInput,
  type FinalizeSessionInput,
} from '../domain/ports/quest.repository.js';

type QuestRow = typeof quests.$inferSelect;
type ResultRow = typeof results.$inferSelect;
type SessionRow = typeof questSessions.$inferSelect;

function toQuest(row: QuestRow): Quest {
  return new Quest(
    row.id,
    row.stageId,
    row.title,
    row.description,
    row.timeLimitSeconds,
    row.passingScore,
    row.xpReward,
    row.archivedAt,
  );
}

function toResult(row: ResultRow): QuestResult {
  return new QuestResult(
    row.id,
    row.userId,
    row.questId,
    row.score,
    row.passed,
    (row.responsesJson as QuestResponse[] | null) ?? [],
    row.submittedAt,
    (row.questionsJson as QuestQuestion[] | null) ?? null,
  );
}

function toSession(row: SessionRow): QuestSession {
  return new QuestSession(
    row.id,
    row.userId,
    row.questId,
    row.questionsJson as QuestQuestion[],
    row.passingScore,
    row.startedAt,
    row.expiresAt,
    row.status as QuestSessionStatus,
    row.resultId,
    row.xpAwarded,
  );
}

@Injectable()
export class DrizzleQuestRepository implements QuestRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findAll(): Promise<Quest[]> {
    const rows = await this.database.select({ quest: quests }).from(quests)
      .innerJoin(stages, eq(quests.stageId, stages.id))
      .innerJoin(zones, eq(stages.zoneId, zones.id)).innerJoin(regions, eq(zones.regionId, regions.id))
      .where(and(isNull(quests.archivedAt), isNull(stages.archivedAt), isNull(zones.archivedAt), isNull(regions.archivedAt)))
      .orderBy(asc(quests.id));
    return rows.map(({ quest }) => toQuest(quest));
  }

  async findById(questId: number): Promise<Quest | null> {
    const row = await this.database.query.quests.findFirst({
      where: eq(quests.id, questId),
    });
    return row ? toQuest(row) : null;
  }

  async findQuestions(questId: number): Promise<QuestQuestion[]> {
    const questionRows = await this.database.query.questQuestions.findMany({
      where: eq(questQuestions.questId, questId),
      orderBy: [asc(questQuestions.sortOrder), asc(questQuestions.id)],
    });
    if (questionRows.length === 0) return [];

    const optionRows = await this.database.query.questOptions.findMany({
      where: inArray(
        questOptions.questionId,
        questionRows.map((row) => row.id),
      ),
      orderBy: [asc(questOptions.sortOrder), asc(questOptions.id)],
    });

    const optionsByQuestion = new Map<number, QuestOption[]>();
    for (const row of optionRows) {
      const list = optionsByQuestion.get(row.questionId) ?? [];
      list.push(new QuestOption(row.id, row.text, row.isCorrect));
      optionsByQuestion.set(row.questionId, list);
    }

    return questionRows.map(
      (row) =>
        new QuestQuestion(
          row.id,
          row.prompt,
          optionsByQuestion.get(row.id) ?? [],
          row.competencyIds,
          row.difficulty as QuestQuestion['difficulty'],
        ),
    );
  }

  async findPassedQuestIds(userId: string): Promise<Set<number>> {
    const rows = await this.database.query.results.findMany({
      where: and(eq(results.userId, userId), eq(results.passed, true)),
      columns: { questId: true },
    });
    return new Set(rows.map((row) => row.questId));
  }

  async findActiveSession(
    userId: string,
    questId: number,
  ): Promise<QuestSession | null> {
    const row = await this.database.query.questSessions.findFirst({
      where: and(
        eq(questSessions.userId, userId),
        eq(questSessions.questId, questId),
        eq(questSessions.status, 'active'),
      ),
    });
    return row ? toSession(row) : null;
  }

  async findSessionById(sessionId: number): Promise<QuestSession | null> {
    const row = await this.database.query.questSessions.findFirst({
      where: eq(questSessions.id, sessionId),
    });
    return row ? toSession(row) : null;
  }

  async createSession(input: CreateSessionInput): Promise<QuestSession> {
    // The partial unique index allows one active session per (user, quest);
    // losing that race falls through to returning the winner's session.
    const rows = await this.database
      .insert(questSessions)
      .values({
        userId: input.userId,
        questId: input.questId,
        questionsJson: input.questions,
        passingScore: input.passingScore,
        expiresAt: input.expiresAt,
      })
      .onConflictDoNothing()
      .returning();
    if (rows[0]) return toSession(rows[0]);
    const existing = await this.findActiveSession(input.userId, input.questId);
    return existing!;
  }

  async finalizeSession(
    input: FinalizeSessionInput,
  ): Promise<{ result: QuestResult; xpAwarded: number } | null> {
    return this.database.transaction(async (tx) => {
      // The conditional UPDATE is the single-submission gate: only one
      // caller can move the session out of 'active'.
      const [claimed] = await tx
        .update(questSessions)
        .set({ status: input.status })
        .where(
          and(
            eq(questSessions.id, input.sessionId),
            eq(questSessions.status, 'active'),
          ),
        )
        .returning();
      if (!claimed) return null;

      const [row] = await tx
        .insert(results)
        .values({
          userId: claimed.userId,
          questId: claimed.questId,
          score: input.score,
          passed: input.passed,
          responsesJson: input.responses,
          questionsJson: claimed.questionsJson,
        })
        .returning();
      let xpAwarded = 0;
      if (
        input.passed &&
        input.status === 'submitted' &&
        (input.xpToAward ?? 0) > 0
      ) {
        const inserted = await tx
          .insert(questXpAwards)
          .values({ userId: claimed.userId, questId: claimed.questId })
          .onConflictDoNothing()
          .returning({ id: questXpAwards.id });
        if (inserted.length > 0) {
          xpAwarded = input.xpToAward!;
          const updated = await tx
            .update(users)
            .set({
              totalXp: sql`${users.totalXp} + ${xpAwarded}`,
              updatedAt: new Date(),
            })
            .where(eq(users.id, claimed.userId))
            .returning({ id: users.id });
          if (updated.length !== 1)
            throw new Error('Quest XP recipient not found');
        }
      }
      await tx
        .update(questSessions)
        .set({ resultId: row!.id, xpAwarded })
        .where(eq(questSessions.id, input.sessionId));
      return { result: toResult(row!), xpAwarded };
    });
  }

  async findResultById(resultId: number): Promise<QuestResult | null> {
    const row = await this.database.query.results.findFirst({
      where: eq(results.id, resultId),
    });
    return row ? toResult(row) : null;
  }
}
