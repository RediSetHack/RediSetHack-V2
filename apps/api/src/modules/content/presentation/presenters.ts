import { Character } from "../../auth/domain/entities/character.entity.js";
import { BadgeDefinition, Quest, Region, Stage, Zone } from "../domain/entities.js";

export class RegionPresenter {
  static toResponse(entity: Region) {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      sortOrder: entity.sortOrder,
    };
  }
}

export class ZonePresenter {
  static toResponse(entity: Zone) {
    return {
      id: entity.id,
      regionId: entity.regionId,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      sortOrder: entity.sortOrder,
    };
  }
}

export class StagePresenter {
  static toResponse(entity: Stage) {
    return {
      id: entity.id,
      zoneId: entity.zoneId,
      title: entity.title,
      slug: entity.slug,
      lessonContent: entity.lessonContent,
      xpReward: entity.xpReward,
      sortOrder: entity.sortOrder,
    };
  }
}

export class QuestPresenter {
  static toResponse(entity: Quest) {
    return {
      id: entity.id,
      stageId: entity.stageId,
      title: entity.title,
      description: entity.description,
      timeLimitSeconds: entity.timeLimitSeconds,
      passingScore: entity.passingScore,
      xpReward: entity.xpReward,
      questions: entity.questions,
    };
  }
}

export class BadgeDefinitionPresenter {
  static toResponse(entity: BadgeDefinition) {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      criteria: entity.criteria,
      imageUrl: entity.imageUrl,
    };
  }
}

export class CharacterPresenter {
  static toResponse(entity: Character) {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      imageUrl: entity.imageUrl,
    };
  }
}
