import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import {
  quests,
  questQuestions,
  questOptions,
  questXpAwards,
  results,
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
  QuestRepository,
  type CreateResultInput,
} from '../domain/ports/quest.repository.js';

type QuestRow = typeof quests.$inferSelect;
type ResultRow = typeof results.$inferSelect;

function toQuest(row: QuestRow): Quest {
  return new Quest(
    row.id,
    row.stageId,
    row.title,
    row.description,
    row.timeLimitSeconds,
    row.passingScore,
    row.xpReward,
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
  );
}

@Injectable()
export class DrizzleQuestRepository implements QuestRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findAll(): Promise<Quest[]> {
    const rows = await this.database.query.quests.findMany({
      orderBy: asc(quests.id),
    });
    return rows.map(toQuest);
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

  async createResult(input: CreateResultInput): Promise<QuestResult> {
    const rows = await this.database
      .insert(results)
      .values({
        userId: input.userId,
        questId: input.questId,
        score: input.score,
        passed: input.passed,
        responsesJson: input.responses,
      })
      .returning();
    return toResult(rows[0]!);
  }

  async findResultById(resultId: number): Promise<QuestResult | null> {
    const row = await this.database.query.results.findFirst({
      where: eq(results.id, resultId),
    });
    return row ? toResult(row) : null;
  }

  async claimXpAward(userId: string, questId: number): Promise<boolean> {
    const inserted = await this.database
      .insert(questXpAwards)
      .values({ userId, questId })
      .onConflictDoNothing()
      .returning({ id: questXpAwards.id });
    return inserted.length > 0;
  }
}
