import { Module } from "@nestjs/common";

import { ProfileRepository } from "./domain/ports/profile.repository.js";
import { DrizzleProfileRepository } from "./infrastructure/drizzle-profile.repository.js";
import { GetProfileUseCase } from "./application/get-profile.use-case.js";
import { GetLeaderboardUseCase } from "./application/get-leaderboard.use-case.js";
import { GetProfileController } from "./presentation/controllers/get-profile.controller.js";
import { GetLeaderboardController } from "./presentation/controllers/get-leaderboard.controller.js";

@Module({
  controllers: [GetProfileController, GetLeaderboardController],
  providers: [
    { provide: ProfileRepository, useClass: DrizzleProfileRepository },
    GetProfileUseCase,
    GetLeaderboardUseCase,
  ],
})
export class ProfileModule {}
