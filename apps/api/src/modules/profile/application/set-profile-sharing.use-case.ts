import { Injectable } from "@nestjs/common";

import { ProfileRepository } from "../domain/ports/profile.repository.js";

@Injectable()
export class SetProfileSharingUseCase {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(userId: string, enabled: boolean) {
    return { shareId: await this.profiles.setSharing(userId, enabled) };
  }
}
