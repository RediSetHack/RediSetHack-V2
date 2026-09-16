import { BadgeDefinition } from '../../domain/entities/badge.entity.js';

export interface BadgeAwardView {
  badge: BadgeDefinition;
  awardCount: number;
}

/** The wire shape of a badge award, shared by every module that reports one. */
export function toBadgeAwardsPresenter(awards: readonly BadgeAwardView[]) {
  return awards.map((award) => ({
    id: award.badge.id,
    name: award.badge.name,
    description: award.badge.description,
    imageUrl: award.badge.imageUrl,
    awardCount: award.awardCount,
  }));
}