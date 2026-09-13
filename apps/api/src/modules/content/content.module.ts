import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module.js';
import { CharacterRepository } from '../auth/domain/ports/character.repository.js';
import {
  BadgeDefinitionRepository,
  QuestRepository,
  RegionRepository,
  StageRepository,
  ZoneRepository,
} from './domain/ports.js';
import {
  DrizzleBadgeDefinitionRepository,
  DrizzleQuestRepository,
  DrizzleRegionRepository,
  DrizzleStageRepository,
  DrizzleZoneRepository,
} from './infrastructure/drizzle-repositories.js';
import { CreateBadgeDefinitionUseCase } from './application/create-badge-definition.use-case.js';
import { CreateCharacterUseCase } from './application/create-character.use-case.js';
import { CreateQuestUseCase } from './application/create-quest.use-case.js';
import { CreateRegionUseCase } from './application/create-region.use-case.js';
import { CreateStageUseCase } from './application/create-stage.use-case.js';
import { CreateZoneUseCase } from './application/create-zone.use-case.js';
import { DeleteBadgeDefinitionUseCase } from './application/delete-badge-definition.use-case.js';
import { DeleteCharacterUseCase } from './application/delete-character.use-case.js';
import { DeleteQuestUseCase } from './application/delete-quest.use-case.js';
import { DeleteRegionUseCase } from './application/delete-region.use-case.js';
import { DeleteStageUseCase } from './application/delete-stage.use-case.js';
import { DeleteZoneUseCase } from './application/delete-zone.use-case.js';
import { GetBadgeDefinitionUseCase } from './application/get-badge-definition.use-case.js';
import { GetCharacterUseCase } from './application/get-character.use-case.js';
import { GetQuestUseCase } from './application/get-quest.use-case.js';
import { GetRegionUseCase } from './application/get-region.use-case.js';
import { GetStageUseCase } from './application/get-stage.use-case.js';
import { GetZoneUseCase } from './application/get-zone.use-case.js';
import { UpdateBadgeDefinitionUseCase } from './application/update-badge-definition.use-case.js';
import { UpdateCharacterUseCase } from './application/update-character.use-case.js';
import { UpdateQuestUseCase } from './application/update-quest.use-case.js';
import { UpdateRegionUseCase } from './application/update-region.use-case.js';
import { UpdateStageUseCase } from './application/update-stage.use-case.js';
import { UpdateZoneUseCase } from './application/update-zone.use-case.js';
import { CreateBadgeDefinitionController } from './presentation/controllers/create-badge-definition.controller.js';
import { CreateCharacterController } from './presentation/controllers/create-character.controller.js';
import { CreateQuestController } from './presentation/controllers/create-quest.controller.js';
import { CreateRegionController } from './presentation/controllers/create-region.controller.js';
import { CreateStageController } from './presentation/controllers/create-stage.controller.js';
import { CreateZoneController } from './presentation/controllers/create-zone.controller.js';
import { DeleteBadgeDefinitionController } from './presentation/controllers/delete-badge-definition.controller.js';
import { DeleteCharacterController } from './presentation/controllers/delete-character.controller.js';
import { DeleteQuestController } from './presentation/controllers/delete-quest.controller.js';
import { DeleteRegionController } from './presentation/controllers/delete-region.controller.js';
import { DeleteStageController } from './presentation/controllers/delete-stage.controller.js';
import { DeleteZoneController } from './presentation/controllers/delete-zone.controller.js';
import { GetBadgeDefinitionController } from './presentation/controllers/get-badge-definition.controller.js';
import { GetCharacterController } from './presentation/controllers/get-character.controller.js';
import { GetQuestController } from './presentation/controllers/get-quest.controller.js';
import { GetRegionController } from './presentation/controllers/get-region.controller.js';
import { GetStageController } from './presentation/controllers/get-stage.controller.js';
import { GetZoneController } from './presentation/controllers/get-zone.controller.js';
import { UpdateBadgeDefinitionController } from './presentation/controllers/update-badge-definition.controller.js';
import { UpdateCharacterController } from './presentation/controllers/update-character.controller.js';
import { UpdateQuestController } from './presentation/controllers/update-quest.controller.js';
import { UpdateRegionController } from './presentation/controllers/update-region.controller.js';
import { UpdateStageController } from './presentation/controllers/update-stage.controller.js';
import { UpdateZoneController } from './presentation/controllers/update-zone.controller.js';

// Public content-browsing feature (issue #7): read-only, aliased to avoid
// colliding with the admin CRUD tokens above.
import { RegionRepository as ListRegionRepository } from './domain/ports/region.repository.js';
import { ZoneRepository as ListZoneRepository } from './domain/ports/zone.repository.js';
import { StageRepository as ListStageRepository } from './domain/ports/stage.repository.js';
import { DrizzleRegionRepository as ListDrizzleRegionRepository } from './infrastructure/drizzle-region.repository.js';
import { DrizzleZoneRepository as ListDrizzleZoneRepository } from './infrastructure/drizzle-zone.repository.js';
import { DrizzleStageRepository as ListDrizzleStageRepository } from './infrastructure/drizzle-stage.repository.js';
import { ListRegionsUseCase } from './application/list-regions.use-case.js';
import { ListZonesUseCase } from './application/list-zones.use-case.js';
import { ListStagesUseCase } from './application/list-stages.use-case.js';
import { ListRegionsController } from './presentation/controllers/list-regions.controller.js';
import { ListZonesController } from './presentation/controllers/list-zones.controller.js';
import { ListStagesController } from './presentation/controllers/list-stages.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [
    CreateRegionController,
    GetRegionController,
    UpdateRegionController,
    DeleteRegionController,
    CreateZoneController,
    GetZoneController,
    UpdateZoneController,
    DeleteZoneController,
    CreateStageController,
    GetStageController,
    UpdateStageController,
    DeleteStageController,
    CreateQuestController,
    GetQuestController,
    UpdateQuestController,
    DeleteQuestController,
    CreateBadgeDefinitionController,
    GetBadgeDefinitionController,
    UpdateBadgeDefinitionController,
    DeleteBadgeDefinitionController,
    CreateCharacterController,
    GetCharacterController,
    UpdateCharacterController,
    DeleteCharacterController,
    ListRegionsController,
    ListZonesController,
    ListStagesController,
  ],
  providers: [
    { provide: RegionRepository, useClass: DrizzleRegionRepository },
    { provide: ZoneRepository, useClass: DrizzleZoneRepository },
    { provide: StageRepository, useClass: DrizzleStageRepository },
    { provide: QuestRepository, useClass: DrizzleQuestRepository },
    {
      provide: BadgeDefinitionRepository,
      useClass: DrizzleBadgeDefinitionRepository,
    },
    {
      provide: CreateRegionUseCase,
      useFactory: (repo: RegionRepository) => new CreateRegionUseCase(repo),
      inject: [RegionRepository],
    },
    {
      provide: GetRegionUseCase,
      useFactory: (repo: RegionRepository) => new GetRegionUseCase(repo),
      inject: [RegionRepository],
    },
    {
      provide: UpdateRegionUseCase,
      useFactory: (repo: RegionRepository) => new UpdateRegionUseCase(repo),
      inject: [RegionRepository],
    },
    {
      provide: DeleteRegionUseCase,
      useFactory: (repo: RegionRepository) => new DeleteRegionUseCase(repo),
      inject: [RegionRepository],
    },
    {
      provide: CreateZoneUseCase,
      useFactory: (repo: ZoneRepository, regions: RegionRepository) =>
        new CreateZoneUseCase(repo, regions),
      inject: [ZoneRepository, RegionRepository],
    },
    {
      provide: GetZoneUseCase,
      useFactory: (repo: ZoneRepository) => new GetZoneUseCase(repo),
      inject: [ZoneRepository],
    },
    {
      provide: UpdateZoneUseCase,
      useFactory: (repo: ZoneRepository) => new UpdateZoneUseCase(repo),
      inject: [ZoneRepository],
    },
    {
      provide: DeleteZoneUseCase,
      useFactory: (repo: ZoneRepository) => new DeleteZoneUseCase(repo),
      inject: [ZoneRepository],
    },
    {
      provide: CreateStageUseCase,
      useFactory: (repo: StageRepository, zones: ZoneRepository) =>
        new CreateStageUseCase(repo, zones),
      inject: [StageRepository, ZoneRepository],
    },
    {
      provide: GetStageUseCase,
      useFactory: (repo: StageRepository) => new GetStageUseCase(repo),
      inject: [StageRepository],
    },
    {
      provide: UpdateStageUseCase,
      useFactory: (repo: StageRepository) => new UpdateStageUseCase(repo),
      inject: [StageRepository],
    },
    {
      provide: DeleteStageUseCase,
      useFactory: (repo: StageRepository) => new DeleteStageUseCase(repo),
      inject: [StageRepository],
    },
    {
      provide: CreateQuestUseCase,
      useFactory: (repo: QuestRepository, stages: StageRepository) =>
        new CreateQuestUseCase(repo, stages),
      inject: [QuestRepository, StageRepository],
    },
    {
      provide: GetQuestUseCase,
      useFactory: (repo: QuestRepository) => new GetQuestUseCase(repo),
      inject: [QuestRepository],
    },
    {
      provide: UpdateQuestUseCase,
      useFactory: (repo: QuestRepository) => new UpdateQuestUseCase(repo),
      inject: [QuestRepository],
    },
    {
      provide: DeleteQuestUseCase,
      useFactory: (repo: QuestRepository) => new DeleteQuestUseCase(repo),
      inject: [QuestRepository],
    },
    {
      provide: CreateBadgeDefinitionUseCase,
      useFactory: (repo: BadgeDefinitionRepository) =>
        new CreateBadgeDefinitionUseCase(repo),
      inject: [BadgeDefinitionRepository],
    },
    {
      provide: GetBadgeDefinitionUseCase,
      useFactory: (repo: BadgeDefinitionRepository) =>
        new GetBadgeDefinitionUseCase(repo),
      inject: [BadgeDefinitionRepository],
    },
    {
      provide: UpdateBadgeDefinitionUseCase,
      useFactory: (repo: BadgeDefinitionRepository) =>
        new UpdateBadgeDefinitionUseCase(repo),
      inject: [BadgeDefinitionRepository],
    },
    {
      provide: DeleteBadgeDefinitionUseCase,
      useFactory: (repo: BadgeDefinitionRepository) =>
        new DeleteBadgeDefinitionUseCase(repo),
      inject: [BadgeDefinitionRepository],
    },
    {
      provide: CreateCharacterUseCase,
      useFactory: (repo: CharacterRepository) =>
        new CreateCharacterUseCase(repo),
      inject: [CharacterRepository],
    },
    {
      provide: GetCharacterUseCase,
      useFactory: (repo: CharacterRepository) => new GetCharacterUseCase(repo),
      inject: [CharacterRepository],
    },
    {
      provide: UpdateCharacterUseCase,
      useFactory: (repo: CharacterRepository) =>
        new UpdateCharacterUseCase(repo),
      inject: [CharacterRepository],
    },
    {
      provide: DeleteCharacterUseCase,
      useFactory: (repo: CharacterRepository) =>
        new DeleteCharacterUseCase(repo),
      inject: [CharacterRepository],
    },
    { provide: ListRegionRepository, useClass: ListDrizzleRegionRepository },
    { provide: ListZoneRepository, useClass: ListDrizzleZoneRepository },
    { provide: ListStageRepository, useClass: ListDrizzleStageRepository },
    ListRegionsUseCase,
    ListZonesUseCase,
    ListStagesUseCase,
  ],
  exports: [ListStageRepository],
})
export class ContentModule {}
