import { Module } from "@nestjs/common";

import { ProfileRepository } from "./domain/ports/profile.repository.js";
import { DrizzleProfileRepository } from "./infrastructure/drizzle-profile.repository.js";
import { GetProfileUseCase } from "./application/get-profile.use-case.js";
import { GetLeaderboardUseCase } from "./application/get-leaderboard.use-case.js";
import { GetLearningStreakUseCase } from "./application/get-learning-streak.use-case.js";
import { GetLearningStreakController } from "./presentation/controllers/get-learning-streak.controller.js";
import { GetProfileController } from "./presentation/controllers/get-profile.controller.js";
import { GetLeaderboardController } from "./presentation/controllers/get-leaderboard.controller.js";

@Module({
  controllers: [GetProfileController, GetLearningStreakController, GetLeaderboardController],
  providers: [
    { provide: ProfileRepository, useClass: DrizzleProfileRepository },
    GetProfileUseCase,
    GetLeaderboardUseCase,
    GetLearningStreakUseCase,
  ],
})
export class ProfileModule {}
