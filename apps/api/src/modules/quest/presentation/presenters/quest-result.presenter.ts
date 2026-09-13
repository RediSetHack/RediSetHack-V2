import { SubmitQuestOutput } from "../../application/submit-quest.use-case.js";
import { QuestResultReview } from "../../application/view-quest-result.use-case.js";

export class QuestResultPresenter {
  static toSubmitResponse({ result, xpAwarded }: SubmitQuestOutput) {
    return {
      resultId: result.id,
      score: result.score,
      passed: result.passed,
      xpAwarded,
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
