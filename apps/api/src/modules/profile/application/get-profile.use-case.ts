import { Injectable } from "@nestjs/common";

import { ProfileRepository } from "../domain/ports/profile.repository.js";
import { UserProfile } from "../domain/entities/user-profile.entity.js";
import { calculateLevel } from "../domain/level-calculator.js";
import { UserNotFoundError } from "../../auth/domain/errors.js";

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(userId: string): Promise<UserProfile> {
    const data = await this.profiles.findProfileByUserId(userId);
    if (!data) {
      throw new UserNotFoundError(userId);
    }
    return new UserProfile(
      data.userId,
      data.character,
      data.totalXp,
      calculateLevel(data.totalXp),
      data.badges,
    );
  }
}
