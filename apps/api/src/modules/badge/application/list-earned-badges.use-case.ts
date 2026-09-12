import { Injectable } from "@nestjs/common";

import { EarnedBadge } from "../domain/entities/badge.entity.js";
import { BadgeRepository } from "../domain/ports/badge.repository.js";

@Injectable()
export class ListEarnedBadgesUseCase {
  constructor(private readonly badges: BadgeRepository) {}

  execute(userId: string): Promise<EarnedBadge[]> {
    return this.badges.findEarnedByUser(userId);
  }
}
