import { LessonBlock, Stage } from '../domain/entities.js';
import { ParentZoneNotFoundError } from '../domain/errors.js';
import { StageRepository, ZoneRepository } from '../domain/ports.js';

export type CreateStageInput = {
  zoneId: number;
  title: string;
  slug: string;
  lessonContent?: LessonBlock[] | null;
  xpReward?: number;
  sortOrder?: number;
};

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
