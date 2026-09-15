import { SubmitQuestOutput } from '../../application/submit-quest.use-case.js';
import { QuestResultReview } from '../../application/view-quest-result.use-case.js';

export class QuestResultPresenter {
  static toSubmitResponse({
    result,
    xpAwarded,
    badgesEarned,
  }: SubmitQuestOutput) {
    return {
      resultId: result.id,
      score: result.score,
      passed: result.passed,
      xpAwarded,
      badgesEarned: badgesEarned.map((award) => ({
        id: award.badge.id,
        name: award.badge.name,
        description: award.badge.description,
        imageUrl: award.badge.imageUrl,
        awardCount: award.awardCount,
      })),
    };
  }

  static toReviewResponse({ result, breakdown }: QuestResultReview) {
    return {
      resultId: result.id,
      questId: result.questId,
      score: result.score,
      passed: result.passed,
      submittedAt: result.submittedAt,
      breakdown,
    };
  }
}
