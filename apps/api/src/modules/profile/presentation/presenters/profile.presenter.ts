import { UserProfile } from "../../domain/entities/user-profile.entity.js";

export class ProfilePresenter {
  static toResponse(profile: UserProfile) {
    return {
      userId: profile.userId,
      character: profile.character,
      totalXp: profile.totalXp,
      level: profile.level,
      badges: profile.badges.map((badge) => ({
        badgeDefinitionId: badge.badgeDefinitionId,
        name: badge.name,
        slug: badge.slug,
        imageUrl: badge.imageUrl,
        count: badge.count,
        latestAwardedAt: badge.latestAwardedAt,
      })),
    };
  }
}
