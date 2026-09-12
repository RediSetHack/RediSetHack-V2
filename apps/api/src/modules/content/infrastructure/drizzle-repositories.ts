import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  badgeDefinitions,
  quests,
  regions,
  stages,
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
    const rows = await this.database
      .delete(regions)
      .where(eq(regions.id, id))
      .returning({ id: regions.id });
    return rows.length > 0;
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
    const rows = await this.database
      .delete(zones)
      .where(eq(zones.id, id))
      .returning({ id: zones.id });
    return rows.length > 0;
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
    const rows = await this.database
      .delete(stages)
      .where(eq(stages.id, id))
      .returning({ id: stages.id });
    return rows.length > 0;
  }
}

@Injectable()
export class DrizzleQuestRepository implements QuestRepository {
  constructor(@Inject(DB) private readonly database: Database) {}

  async findById(id: number): Promise<Quest | null> {
    const row = await this.database.query.quests.findFirst({
      where: eq(quests.id, id),
    });
    return row ? toQuest(row) : null;
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
    const rows = await this.database
      .insert(quests)
      .values({ ...input, questionsJson: input.questions })
      .returning();
    return toQuest(rows[0]!);
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
    const { questions, ...rest } = input;
    const set =
      questions !== undefined ? { ...rest, questionsJson: questions } : rest;
    const rows = await this.database
      .update(quests)
      .set(set)
      .where(eq(quests.id, id))
      .returning();
    const row = rows[0];
    return row ? toQuest(row) : null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await this.database
      .delete(quests)
      .where(eq(quests.id, id))
      .returning({ id: quests.id });
    return rows.length > 0;
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
  return new Region(row.id, row.name, row.slug, row.description, row.sortOrder);
}

function toZone(row: typeof zones.$inferSelect): Zone {
  return new Zone(
    row.id,
    row.regionId,
    row.name,
    row.slug,
    row.description,
    row.sortOrder,
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
  );
}

function toQuest(row: typeof quests.$inferSelect): Quest {
  return new Quest(
    row.id,
    row.stageId,
    row.title,
    row.description,
    row.timeLimitSeconds,
    row.passingScore,
    row.xpReward,
    row.questionsJson as Quest['questions'],
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
