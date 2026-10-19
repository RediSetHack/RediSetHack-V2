import { Module } from "@nestjs/common";

import { ContributorDraftsUseCase } from "./application/contributor-drafts.use-case.js";
import { DraftRepository } from "./domain/ports/draft.repository.js";
import { DrizzleDraftRepository } from "./infrastructure/drizzle-draft.repository.js";
import { ContributorDraftsController } from "./presentation/controllers/contributor-drafts.controller.js";
import { ContributorGuard } from "./presentation/guards/contributor.guard.js";

@Module({
  controllers: [ContributorDraftsController],
  providers: [{ provide: DraftRepository, useClass: DrizzleDraftRepository }, ContributorDraftsUseCase, ContributorGuard],
})
export class ContributorModule {}
