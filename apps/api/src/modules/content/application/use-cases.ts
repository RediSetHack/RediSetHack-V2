// Admin CRUD use-cases for the content catalog (issue #13).
// One create/update/delete/get use-case per entity, delegating to the domain ports.

import { CharacterRepository } from '../../auth/domain/ports/character.repository.js';
import { Character } from '../../auth/domain/entities/character.entity.js';
import {
  BadgeDefinition,
  BadgeCriteria,
  LessonBlock,
  Quest,
  QuestQuestion,
  Region,
  Stage,
  Zone,
} from '../domain/entities.js';
import {
  BadgeDefinitionNotFoundError,
  ParentRegionNotFoundError,
  ParentStageNotFoundError,
  ParentZoneNotFoundError,
  QuestNotFoundError,
  RegionNotFoundError,
  StageNotFoundError,
  ZoneNotFoundError,
} from '../domain/errors.js';
import {
  BadgeDefinitionRepository,
  QuestRepository,
  RegionRepository,
  StageRepository,
  ZoneRepository,
} from '../domain/ports.js';

export class CharacterNotFoundError extends Error {
  constructor(id: number) {
    super(`Character with id ${id} does not exist`);
    this.name = 'CharacterNotFoundError';
  }
}

// --- Regions ---------------------------------------------------------------

export type CreateRegionInput = {
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
};
export type UpdateRegionInput = Partial<CreateRegionInput>;

export class CreateRegionUseCase {
  constructor(private readonly repository: RegionRepository) {}
  execute(input: CreateRegionInput): Promise<Region> {
    return this.repository.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
    });
  }
}

export class GetRegionUseCase {
  constructor(private readonly repository: RegionRepository) {}
  async execute(id: number): Promise<Region> {
    const region = await this.repository.findById(id);
    if (!region) throw new RegionNotFoundError(id);
    return region;
  }
}

export class UpdateRegionUseCase {
  constructor(private readonly repository: RegionRepository) {}
  async execute(id: number, input: UpdateRegionInput): Promise<Region> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new RegionNotFoundError(id);
    return updated;
  }
}

export class DeleteRegionUseCase {
  constructor(private readonly repository: RegionRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new RegionNotFoundError(id);
  }
}

// --- Zones -------------------------------------------------------------

export type CreateZoneInput = {
  regionId: number;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder?: number;
};
export type UpdateZoneInput = Partial<Omit<CreateZoneInput, 'regionId'>>;

export class CreateZoneUseCase {
  constructor(
    private readonly repository: ZoneRepository,
    private readonly regions: RegionRepository,
  ) {}
  async execute(input: CreateZoneInput): Promise<Zone> {
    const region = await this.regions.findById(input.regionId);
    if (!region) throw new ParentRegionNotFoundError(input.regionId);
    return this.repository.create({
      regionId: input.regionId,
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      sortOrder: input.sortOrder ?? 0,
    });
  }
}

export class GetZoneUseCase {
  constructor(private readonly repository: ZoneRepository) {}
  async execute(id: number): Promise<Zone> {
    const zone = await this.repository.findById(id);
    if (!zone) throw new ZoneNotFoundError(id);
    return zone;
  }
}

export class UpdateZoneUseCase {
  constructor(private readonly repository: ZoneRepository) {}
  async execute(id: number, input: UpdateZoneInput): Promise<Zone> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new ZoneNotFoundError(id);
    return updated;
  }
}

export class DeleteZoneUseCase {
  constructor(private readonly repository: ZoneRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new ZoneNotFoundError(id);
  }
}

// --- Stages --------------------------------------------------------------

export type CreateStageInput = {
  zoneId: number;
  title: string;
  slug: string;
  lessonContent?: LessonBlock[] | null;
  xpReward?: number;
  sortOrder?: number;
};
export type UpdateStageInput = Partial<Omit<CreateStageInput, 'zoneId'>>;

export class CreateStageUseCase {
  constructor(
    private readonly repository: StageRepository,
    private readonly zones: ZoneRepository,
  ) {}
  async execute(input: CreateStageInput): Promise<Stage> {
    const zone = await this.zones.findById(input.zoneId);
    if (!zone) throw new ParentZoneNotFoundError(input.zoneId);
    return this.repository.create({
      zoneId: input.zoneId,
      title: input.title,
      slug: input.slug,
      lessonContent: input.lessonContent ?? null,
      xpReward: input.xpReward ?? 0,
      sortOrder: input.sortOrder ?? 0,
    });
  }
}

export class GetStageUseCase {
  constructor(private readonly repository: StageRepository) {}
  async execute(id: number): Promise<Stage> {
    const stage = await this.repository.findById(id);
    if (!stage) throw new StageNotFoundError(id);
    return stage;
  }
}

export class UpdateStageUseCase {
  constructor(private readonly repository: StageRepository) {}
  async execute(id: number, input: UpdateStageInput): Promise<Stage> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new StageNotFoundError(id);
    return updated;
  }
}

export class DeleteStageUseCase {
  constructor(private readonly repository: StageRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new StageNotFoundError(id);
  }
}

// --- Quests ----------------------------------------------------------------

export type CreateQuestInput = {
  stageId: number;
  title: string;
  description?: string | null;
  timeLimitSeconds?: number;
  passingScore?: number;
  xpReward?: number;
  questions?: QuestQuestion[];
};
export type UpdateQuestInput = Partial<Omit<CreateQuestInput, 'stageId'>>;

export class CreateQuestUseCase {
  constructor(
    private readonly repository: QuestRepository,
    private readonly stages: StageRepository,
  ) {}
  async execute(input: CreateQuestInput): Promise<Quest> {
    const stage = await this.stages.findById(input.stageId);
    if (!stage) throw new ParentStageNotFoundError(input.stageId);
    return this.repository.create({
      stageId: input.stageId,
      title: input.title,
      description: input.description ?? null,
      timeLimitSeconds: input.timeLimitSeconds ?? 60,
      passingScore: input.passingScore ?? 70,
      xpReward: input.xpReward ?? 0,
      questions: input.questions ?? [],
    });
  }
}

export class GetQuestUseCase {
  constructor(private readonly repository: QuestRepository) {}
  async execute(id: number): Promise<Quest> {
    const quest = await this.repository.findById(id);
    if (!quest) throw new QuestNotFoundError(id);
    return quest;
  }
}

export class UpdateQuestUseCase {
  constructor(private readonly repository: QuestRepository) {}
  async execute(id: number, input: UpdateQuestInput): Promise<Quest> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new QuestNotFoundError(id);
    return updated;
  }
}

export class DeleteQuestUseCase {
  constructor(private readonly repository: QuestRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new QuestNotFoundError(id);
  }
}

// --- Badge definitions -------------------------------------------------

export type CreateBadgeDefinitionInput = {
  name: string;
  slug: string;
  description?: string | null;
  criteria: BadgeCriteria;
  imageUrl?: string | null;
};
export type UpdateBadgeDefinitionInput = Partial<CreateBadgeDefinitionInput>;

export class CreateBadgeDefinitionUseCase {
  constructor(private readonly repository: BadgeDefinitionRepository) {}
  execute(input: CreateBadgeDefinitionInput): Promise<BadgeDefinition> {
    return this.repository.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      criteria: input.criteria,
      imageUrl: input.imageUrl ?? null,
    });
  }
}

export class GetBadgeDefinitionUseCase {
  constructor(private readonly repository: BadgeDefinitionRepository) {}
  async execute(id: number): Promise<BadgeDefinition> {
    const badge = await this.repository.findById(id);
    if (!badge) throw new BadgeDefinitionNotFoundError(id);
    return badge;
  }
}

export class UpdateBadgeDefinitionUseCase {
  constructor(private readonly repository: BadgeDefinitionRepository) {}
  async execute(
    id: number,
    input: UpdateBadgeDefinitionInput,
  ): Promise<BadgeDefinition> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new BadgeDefinitionNotFoundError(id);
    return updated;
  }
}

export class DeleteBadgeDefinitionUseCase {
  constructor(private readonly repository: BadgeDefinitionRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new BadgeDefinitionNotFoundError(id);
  }
}

// --- Characters --------------------------------------------------------

export type CreateCharacterInput = {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
};
export type UpdateCharacterInput = Partial<CreateCharacterInput>;

export class CreateCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}
  execute(input: CreateCharacterInput): Promise<Character> {
    return this.repository.create({
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
    });
  }
}

export class GetCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}
  async execute(id: number): Promise<Character> {
    const character = await this.repository.findById(id);
    if (!character) throw new CharacterNotFoundError(id);
    return character;
  }
}

export class UpdateCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}
  async execute(id: number, input: UpdateCharacterInput): Promise<Character> {
    const updated = await this.repository.update(id, input);
    if (!updated) throw new CharacterNotFoundError(id);
    return updated;
  }
}

export class DeleteCharacterUseCase {
  constructor(private readonly repository: CharacterRepository) {}
  async execute(id: number): Promise<void> {
    const deleted = await this.repository.delete(id);
    if (!deleted) throw new CharacterNotFoundError(id);
  }
}
