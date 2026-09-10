import { Module } from "@nestjs/common";

import { RegionRepository } from "./domain/ports/region.repository.js";
import { ZoneRepository } from "./domain/ports/zone.repository.js";
import { StageRepository } from "./domain/ports/stage.repository.js";
import { DrizzleRegionRepository } from "./infrastructure/drizzle-region.repository.js";
import { DrizzleZoneRepository } from "./infrastructure/drizzle-zone.repository.js";
import { DrizzleStageRepository } from "./infrastructure/drizzle-stage.repository.js";
import { ListRegionsUseCase } from "./application/list-regions.use-case.js";
import { ListZonesUseCase } from "./application/list-zones.use-case.js";
import { ListStagesUseCase } from "./application/list-stages.use-case.js";
import { ListRegionsController } from "./presentation/controllers/list-regions.controller.js";
import { ListZonesController } from "./presentation/controllers/list-zones.controller.js";
import { ListStagesController } from "./presentation/controllers/list-stages.controller.js";

@Module({
  controllers: [ListRegionsController, ListZonesController, ListStagesController],
  providers: [
    { provide: RegionRepository, useClass: DrizzleRegionRepository },
    { provide: ZoneRepository, useClass: DrizzleZoneRepository },
    { provide: StageRepository, useClass: DrizzleStageRepository },
    ListRegionsUseCase,
    ListZonesUseCase,
    ListStagesUseCase,
  ],
})
export class ContentModule {}
