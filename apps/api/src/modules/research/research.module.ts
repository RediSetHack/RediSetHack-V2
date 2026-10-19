import { Module } from "@nestjs/common";

import { ExportDatasetUseCase, RESEARCH_PSEUDONYM_KEY } from "./application/export-dataset.use-case.js";
import { InteractionSourceRepository } from "./domain/ports/interaction-source.repository.js";
import { DrizzleInteractionSourceRepository } from "./infrastructure/drizzle-interaction-source.repository.js";
import { ResearchDatasetController } from "./presentation/controllers/research-dataset.controller.js";

@Module({
  controllers: [ResearchDatasetController],
  providers: [
    { provide: InteractionSourceRepository, useClass: DrizzleInteractionSourceRepository },
    { provide: RESEARCH_PSEUDONYM_KEY, useFactory: () => process.env.RESEARCH_PSEUDONYM_KEY },
    ExportDatasetUseCase,
  ],
})
export class ResearchModule {}
