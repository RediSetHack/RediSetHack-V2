import { BadgeDefinition, EarnedBadge } from "../../domain/entities/badge.entity.js";

export class BadgePresenter {
  static toResponse(badge: BadgeDefinition) {
    return {
      id: badge.id,
      name: badge.name,
      slug: badge.slug,
      description: badge.description,
      criteria: badge.criteria,
      imageUrl: badge.imageUrl,
    };
  }

  static toEarnedResponse(earned: EarnedBadge) {
    return {
      ...BadgePresenter.toResponse(earned.badge),
      count: earned.count,
      awardedAt: earned.awardedAt.map((date) => date.toISOString()),
    };
  }
}
