import { UserProfile } from '../../domain/entities/user-profile.entity.js';

export class ProfilePresenter {
  static toResponse(profile: UserProfile) {
    return {
      userId: profile.userId,
      character: profile.character,
      totalXp: profile.totalXp,
      level: profile.level,
      adventurerRank: profile.level,
      accomplishments: profile.accomplishments,
      sharing: { shareId: profile.shareId },
      badges: profile.badges.map((badge) => ({
        badgeDefinitionId: badge.badgeDefinitionId,
        name: badge.name,
        slug: badge.slug,
        imageUrl: badge.imageUrl,
        count: badge.count,
        latestAwardedAt: badge.latestAwardedAt,
      })),
      activity: profile.activity.map((event) => ({
        ...event,
        occurredAt: event.occurredAt.toISOString(),
      })),
      initialCompetencyBaseline: profile.initialCompetencyBaseline,
    };
  }
}
