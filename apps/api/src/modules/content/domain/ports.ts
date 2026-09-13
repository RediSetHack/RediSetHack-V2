import { BadgeDefinition, Quest, Region, Stage, Zone } from './entities.js';

export abstract class RegionRepository {
  abstract findById(id: number): Promise<Region | null>;
  abstract create(input: {
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
  }): Promise<Region>;
  abstract update(
    id: number,
    input: Partial<{
      name: string;
      slug: string;
      description: string | null;
      sortOrder: number;
    }>,
  ): Promise<Region | null>;
  abstract delete(id: number): Promise<boolean>;
}

export abstract class ZoneRepository {
  abstract findById(id: number): Promise<Zone | null>;
  abstract create(input: {
    regionId: number;
    name: string;
    slug: string;
    description: string | null;
    sortOrder: number;
  }): Promise<Zone>;
  abstract update(
    id: number,
    input: Partial<{
      name: string;
      slug: string;
      description: string | null;
      sortOrder: number;
    }>,
  ): Promise<Zone | null>;
  abstract delete(id: number): Promise<boolean>;
}

export abstract class StageRepository {
  abstract findById(id: number): Promise<Stage | null>;
  abstract create(input: {
    zoneId: number;
    title: string;
    slug: string;
    lessonContent: Stage['lessonContent'];
    xpReward: number;
    sortOrder: number;
  }): Promise<Stage>;
  abstract update(
    id: number,
    input: Partial<{
      title: string;
      slug: string;
      lessonContent: Stage['lessonContent'];
      xpReward: number;
      sortOrder: number;
    }>,
  ): Promise<Stage | null>;
  abstract delete(id: number): Promise<boolean>;
}

export abstract class QuestRepository {
  abstract findById(id: number): Promise<Quest | null>;
  abstract create(input: {
    stageId: number;
    title: string;
    description: string | null;
    timeLimitSeconds: number;
    passingScore: number;
    xpReward: number;
    questions: Quest['questions'];
  }): Promise<Quest>;
  abstract update(
    id: number,
    input: Partial<{
      title: string;
      description: string | null;
      timeLimitSeconds: number;
      passingScore: number;
      xpReward: number;
      questions: Quest['questions'];
    }>,
  ): Promise<Quest | null>;
  abstract delete(id: number): Promise<boolean>;
}

export abstract class BadgeDefinitionRepository {
  abstract findById(id: number): Promise<BadgeDefinition | null>;
  abstract create(input: {
    name: string;
    slug: string;
    description: string | null;
    criteria: BadgeDefinition['criteria'];
    imageUrl: string | null;
  }): Promise<BadgeDefinition>;
  abstract update(
    id: number,
    input: Partial<{
      name: string;
      slug: string;
      description: string | null;
      criteria: BadgeDefinition['criteria'];
      imageUrl: string | null;
    }>,
  ): Promise<BadgeDefinition | null>;
  abstract delete(id: number): Promise<boolean>;
}
