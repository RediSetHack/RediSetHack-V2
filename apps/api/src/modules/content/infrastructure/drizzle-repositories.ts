import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import {
  badgeDefinitions,
  quests,
  questSessions,
  questXpAwards,
  questQuestions,
  questOptions,
  results,
  regions,
  stages,
  userProgress,
  zones,
  type Database,
} from '@repo/db';

import { DB } from '../../../database/database.module.js';
import {
  BadgeDefinition,
  Quest,
  Region,
  Stage,
  Zone,
} from '../domain/entities.js';
import {
  BadgeDefinitionRepository,
  QuestRepository,
  RegionRepository,
  StageRepository,
  ZoneRepository,
} from '../domain/ports.js';

@Injectable()
export class DrizzleRegionRepository implements RegionRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(id: number): Promise<Region | null> {
    const row = await this.database.query.regions.findFirst({
      where: eq(regions.id, id),
    });
    return row ? toRegion(row) : null;
  }

  async create(input: {
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
  }): Promise<Region> {
    const rows = await this.database.insert(regions).values(input).returning();
    return toRegion(rows[0]!);
  }

  async update(
    id: number,
    input: Partial<{
      name: string;
      slug: string;
      description: string | null;
      sortOrder: number;
    }>,
  ): Promise<Region | null> {
    const rows = await this.database
      .update(regions)
      .set(input)
      .where(eq(regions.id, id))
      .returning();
    const row = rows[0];
    return row ? toRegion(row) : null;
  }

  async delete(id: number): Promise<boolean> {
    return this.database.transaction(async (tx) => {
      const history = await tx.select({ id: userProgress.id }).from(userProgress).innerJoin(stages, eq(userProgress.stageId, stages.id)).innerJoin(zones, eq(stages.zoneId, zones.id)).where(eq(zones.regionId, id)).limit(1);
      const resultHistory = await tx.select({ id: results.id }).from(results).innerJoin(quests, eq(results.questId, quests.id)).innerJoin(stages, eq(quests.stageId, stages.id)).innerJoin(zones, eq(stages.zoneId, zones.id)).where(eq(zones.regionId, id)).limit(1);
      const sessionHistory = await tx.select({ id: questSessions.id }).from(questSessions).innerJoin(quests, eq(questSessions.questId, quests.id)).innerJoin(stages, eq(quests.stageId, stages.id)).innerJoin(zones, eq(stages.zoneId, zones.id)).where(eq(zones.regionId, id)).limit(1);
      const xpHistory = await tx.select({ id: questXpAwards.id }).from(questXpAwards).innerJoin(quests, eq(questXpAwards.questId, quests.id)).innerJoin(stages, eq(quests.stageId, stages.id)).innerJoin(zones, eq(stages.zoneId, zones.id)).where(eq(zones.regionId, id)).limit(1);
      const rows = history.length || resultHistory.length || sessionHistory.length || xpHistory.length
        ? await tx.update(regions).set({ archivedAt: new Date() }).where(and(eq(regions.id, id), isNull(regions.archivedAt))).returning({ id: regions.id })
        : await tx.delete(regions).where(eq(regions.id, id)).returning({ id: regions.id });
      return rows.length > 0;
    });
  }
}

@Injectable()
export class DrizzleZoneRepository implements ZoneRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(id: number): Promise<Zone | null> {
    const row = await this.database.query.zones.findFirst({
      where: eq(zones.id, id),
    });
    return row ? toZone(row) : null;
  }

  async create(input: {
    regionId: number;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
  }): Promise<Zone> {
    const rows = await this.database.insert(zones).values(input).returning();
    return toZone(rows[0]!);
  }

  async update(
    id: number,
    input: Partial<{
      name: string;
      slug: string;
      description: string | null;
      sortOrder: number;
    }>,
  ): Promise<Zone | null> {
    const rows = await this.database
      .update(zones)
      .set(input)
      .where(eq(zones.id, id))
      .returning();
    const row = rows[0];
    return row ? toZone(row) : null;
  }

  async delete(id: number): Promise<boolean> {
    return this.database.transaction(async (tx) => {
      const history = await tx.select({ id: userProgress.id }).from(userProgress).innerJoin(stages, eq(userProgress.stageId, stages.id)).where(eq(stages.zoneId, id)).limit(1);
      const resultHistory = await tx.select({ id: results.id }).from(results).innerJoin(quests, eq(results.questId, quests.id)).innerJoin(stages, eq(quests.stageId, stages.id)).where(eq(stages.zoneId, id)).limit(1);
      const sessionHistory = await tx.select({ id: questSessions.id }).from(questSessions).innerJoin(quests, eq(questSessions.questId, quests.id)).innerJoin(stages, eq(quests.stageId, stages.id)).where(eq(stages.zoneId, id)).limit(1);
      const xpHistory = await tx.select({ id: questXpAwards.id }).from(questXpAwards).innerJoin(quests, eq(questXpAwards.questId, quests.id)).innerJoin(stages, eq(quests.stageId, stages.id)).where(eq(stages.zoneId, id)).limit(1);
      const rows = history.length || resultHistory.length || sessionHistory.length || xpHistory.length
        ? await tx.update(zones).set({ archivedAt: new Date() }).where(and(eq(zones.id, id), isNull(zones.archivedAt))).returning({ id: zones.id })
        : await tx.delete(zones).where(eq(zones.id, id)).returning({ id: zones.id });
      return rows.length > 0;
    });
  }
}

@Injectable()
export class DrizzleStageRepository implements StageRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(id: number): Promise<Stage | null> {
    const row = await this.database.query.stages.findFirst({
      where: eq(stages.id, id),
    });
    return row ? toStage(row) : null;
  }

  async create(input: {
    zoneId: number;
    title: string;
    slug: string;
    lessonContent: Stage['lessonContent'];
    xpReward: number;
    sortOrder: number;
  }): Promise<Stage> {
    const rows = await this.database.insert(stages).values(input).returning();
    return toStage(rows[0]!);
  }

  async update(
    id: number,
    input: Partial<{
      title: string;
      slug: string;
      lessonContent: Stage['lessonContent'];
      xpReward: number;
      sortOrder: number;
    }>,
  ): Promise<Stage | null> {
    const rows = await this.database
      .update(stages)
      .set(input)
      .where(eq(stages.id, id))
      .returning();
    const row = rows[0];
    return row ? toStage(row) : null;
  }

  async delete(id: number): Promise<boolean> {
    return this.database.transaction(async (tx) => {
      const progress = await tx.query.userProgress.findFirst({ where: eq(userProgress.stageId, id) });
      const pastResults = await tx.select({ id: results.id }).from(results).innerJoin(quests, eq(results.questId, quests.id)).where(eq(quests.stageId, id)).limit(1);
      const sessions = await tx.select({ id: questSessions.id }).from(questSessions).innerJoin(quests, eq(questSessions.questId, quests.id)).where(eq(quests.stageId, id)).limit(1);
      const claims = await tx.select({ id: questXpAwards.id }).from(questXpAwards).innerJoin(quests, eq(questXpAwards.questId, quests.id)).where(eq(quests.stageId, id)).limit(1);
      const rows = progress || pastResults.length || sessions.length || claims.length
        ? await tx.update(stages).set({ archivedAt: new Date() }).where(and(eq(stages.id, id), isNull(stages.archivedAt))).returning({ id: stages.id })
        : await tx.delete(stages).where(eq(stages.id, id)).returning({ id: stages.id });
      return rows.length > 0;
    });
  }
}

@Injectable()
export class DrizzleQuestRepository implements QuestRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(id: number): Promise<Quest | null> {
    const row = await this.database.query.quests.findFirst({
      where: eq(quests.id, id),
    });
    return row ? toQuest(row, await this.findQuestions(id)) : null;
  }

  private async findQuestions(questId: number): Promise<Quest['questions']> {
    const questions = await this.database.query.questQuestions.findMany({
      where: eq(questQuestions.questId, questId),
      orderBy: [asc(questQuestions.sortOrder), asc(questQuestions.id)],
    });
    const options = questions.length ? await this.database.query.questOptions.findMany({
      where: inArray(questOptions.questionId, questions.map(({ id }) => id)),
      orderBy: [asc(questOptions.sortOrder), asc(questOptions.id)],
    }) : [];
    return questions.map((question) => {
      const questionOptions = options.filter((option) => option.questionId === question.id);
      const correct = questionOptions.find((option) => option.isCorrect);
      return {
        id: question.authoringId ?? String(question.id),
        prompt: question.prompt,
        options: questionOptions.map((option) => ({ id: option.authoringId ?? String(option.id), text: option.text })),
        correctOptionId: correct?.authoringId ?? String(correct?.id ?? ''),
      };
    });
  }

  async create(input: {
    stageId: number;
    title: string;
    description: string | null;
    timeLimitSeconds: number;
    passingScore: number;
    xpReward: number;
    questions: Quest['questions'];
  }): Promise<Quest> {
    return this.database.transaction(async (tx) => {
      const rows = await tx.insert(quests).values(input).returning();
      await this.syncQuestions(tx, rows[0]!.id, input.questions);
      return toQuest(rows[0]!, input.questions);
    });
  }

  async update(
    id: number,
    input: Partial<{
      title: string;
      description: string | null;
      timeLimitSeconds: number;
      passingScore: number;
      xpReward: number;
      questions: Quest['questions'];
    }>,
  ): Promise<Quest | null> {
    return this.database.transaction(async (tx) => {
      const { questions, ...rest } = input;
      const row = Object.keys(rest).length
        ? (await tx.update(quests).set(rest).where(eq(quests.id, id)).returning())[0]
        : await tx.query.quests.findFirst({ where: eq(quests.id, id) });
      if (!row) return null;
      if (questions !== undefined) await this.syncQuestions(tx, id, questions);
      return toQuest(row, questions ?? await this.findQuestions(id));
    });
  }

  private async syncQuestions(tx: Parameters<Parameters<Database['transaction']>[0]>[0], questId: number, definitions: Quest['questions']) {
    const existingQuestions = await tx.query.questQuestions.findMany({ where: eq(questQuestions.questId, questId) });
    const usedQuestionIds = new Set<number>();
    for (const [index, definition] of definitions.entries()) {
      const question = existingQuestions.find((item) => !usedQuestionIds.has(item.id) && (item.authoringId === definition.id || String(item.id) === definition.id));
      let questionId: number;
      if (question) {
        questionId = question.id;
        usedQuestionIds.add(question.id);
        await tx.update(questQuestions).set({ prompt: definition.prompt, sortOrder: index, authoringId: definition.id }).where(eq(questQuestions.id, questionId));
      } else {
        const [inserted] = await tx.insert(questQuestions).values({ questId, prompt: definition.prompt, sortOrder: index, authoringId: definition.id }).returning({ id: questQuestions.id });
        questionId = inserted!.id;
        usedQuestionIds.add(questionId);
      }
      const existingOptions = await tx.query.questOptions.findMany({ where: eq(questOptions.questionId, questionId) });
      const usedOptionIds = new Set<number>();
      for (const [optionIndex, option] of definition.options.entries()) {
        const existing = existingOptions.find((item) => !usedOptionIds.has(item.id) && (item.authoringId === option.id || String(item.id) === option.id));
        if (existing) {
          usedOptionIds.add(existing.id);
          await tx.update(questOptions).set({ text: option.text, isCorrect: option.id === definition.correctOptionId, sortOrder: optionIndex, authoringId: option.id }).where(eq(questOptions.id, existing.id));
        } else {
          await tx.insert(questOptions).values({ questionId, text: option.text, isCorrect: option.id === definition.correctOptionId, sortOrder: optionIndex, authoringId: option.id });
        }
      }
      const removedOptions = existingOptions.filter(({ id: optionId }) => !usedOptionIds.has(optionId));
      if (removedOptions.length) await tx.delete(questOptions).where(inArray(questOptions.id, removedOptions.map(({ id: optionId }) => optionId)));
    }
    const removedQuestions = existingQuestions.filter(({ id: questionId }) => !usedQuestionIds.has(questionId));
    if (removedQuestions.length) await tx.delete(questQuestions).where(inArray(questQuestions.id, removedQuestions.map(({ id: questionId }) => questionId)));
  }

  async delete(id: number): Promise<boolean> {
    return this.database.transaction(async (tx) => {
      const history = await tx.query.results.findFirst({ where: eq(results.questId, id) });
      const session = await tx.query.questSessions.findFirst({ where: eq(questSessions.questId, id) });
      const claim = await tx.query.questXpAwards.findFirst({ where: eq(questXpAwards.questId, id) });
      const rows = history || session || claim
        ? await tx.update(quests).set({ archivedAt: new Date() }).where(and(eq(quests.id, id), isNull(quests.archivedAt))).returning({ id: quests.id })
        : await tx.delete(quests).where(eq(quests.id, id)).returning({ id: quests.id });
      return rows.length > 0;
    });
  }
}

@Injectable()
export class DrizzleBadgeDefinitionRepository implements BadgeDefinitionRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(id: number): Promise<BadgeDefinition | null> {
    const row = await this.database.query.badgeDefinitions.findFirst({
      where: eq(badgeDefinitions.id, id),
    });
    return row ? toBadgeDefinition(row) : null;
  }

  async create(input: {
    name: string;
    slug: string;
    description: string | null;
    criteria: BadgeDefinition['criteria'];
    imageUrl: string | null;
  }): Promise<BadgeDefinition> {
    const rows = await this.database
      .insert(badgeDefinitions)
      .values({ ...input, criteriaJson: input.criteria })
      .returning();
    return toBadgeDefinition(rows[0]!);
  }

  async update(
    id: number,
    input: Partial<{
      name: string;
      slug: string;
      description: string | null;
      criteria: BadgeDefinition['criteria'];
      imageUrl: string | null;
    }>,
  ): Promise<BadgeDefinition | null> {
    const { criteria, ...rest } = input;
    const set =
      criteria !== undefined ? { ...rest, criteriaJson: criteria } : rest;
    const rows = await this.database
      .update(badgeDefinitions)
      .set(set)
      .where(eq(badgeDefinitions.id, id))
      .returning();
    const row = rows[0];
    return row ? toBadgeDefinition(row) : null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.database
      .delete(badgeDefinitions)
      .where(eq(badgeDefinitions.id, id))
      .returning({ id: badgeDefinitions.id });
    return rows.length > 0;
  }
}

// --- row -> domain mappers ---------------------------------------------

function toRegion(row: typeof regions.$inferSelect): Region {
  return new Region(row.id, row.name, row.slug, row.description, row.sortOrder, row.archivedAt);
}

function toZone(row: typeof zones.$inferSelect): Zone {
  return new Zone(
    row.id,
    row.regionId,
    row.name,
    row.slug,
    row.description,
    row.sortOrder,
    row.archivedAt,
  );
}

function toStage(row: typeof stages.$inferSelect): Stage {
  return new Stage(
    row.id,
    row.zoneId,
    row.title,
    row.slug,
    row.lessonContent as Stage['lessonContent'],
    row.xpReward,
    row.sortOrder,
    row.archivedAt,
  );
}

function toQuest(row: typeof quests.$inferSelect, questions: Quest['questions']): Quest {
  return new Quest(
    row.id,
    row.stageId,
    row.title,
    row.description,
    row.timeLimitSeconds,
    row.passingScore,
    row.xpReward,
    questions,
    row.archivedAt,
  );
}

function toBadgeDefinition(
  row: typeof badgeDefinitions.$inferSelect,
): BadgeDefinition {
  return new BadgeDefinition(
    row.id,
    row.name,
    row.slug,
    row.description,
    row.criteriaJson as BadgeDefinition['criteria'],
    row.imageUrl,
  );
}
