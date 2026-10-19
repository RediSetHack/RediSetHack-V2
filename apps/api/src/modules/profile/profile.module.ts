import { Module } from "@nestjs/common";

import { ProfileRepository } from "./domain/ports/profile.repository.js";
import { DrizzleProfileRepository } from "./infrastructure/drizzle-profile.repository.js";
import { GetProfileUseCase } from "./application/get-profile.use-case.js";
import { GetLeaderboardUseCase } from "./application/get-leaderboard.use-case.js";
import { GetLearningStreakUseCase } from "./application/get-learning-streak.use-case.js";
import { GetLearningStreakController } from "./presentation/controllers/get-learning-streak.controller.js";
import { SetProfileSharingUseCase } from "./application/set-profile-sharing.use-case.js";
import { GetSharedProfileUseCase } from "./application/get-shared-profile.use-case.js";
import { ProfileSharingController } from "./presentation/controllers/profile-sharing.controller.js";
import { GetProfileController } from "./presentation/controllers/get-profile.controller.js";
import { GetLeaderboardController } from "./presentation/controllers/get-leaderboard.controller.js";

@Module({
  controllers: [GetProfileController, ProfileSharingController, GetLearningStreakController, GetLeaderboardController],
  providers: [
    { provide: ProfileRepository, useClass: DrizzleProfileRepository },
    GetProfileUseCase,
    GetLeaderboardUseCase,
    GetLearningStreakUseCase,
    SetProfileSharingUseCase,
    GetSharedProfileUseCase,
  ],
})
export class ProfileModule {}
