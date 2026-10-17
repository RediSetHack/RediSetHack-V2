import { QuestWithStatus } from '../../application/list-quests.use-case.js';
import { StartedQuestSession } from '../../application/start-quest.use-case.js';

export class QuestPresenter {
  static toListItem({ quest, completed, lockReason }: QuestWithStatus) {
    return {
      id: quest.id,
      stageId: quest.stageId,
      title: quest.title,
      description: quest.description,
      timeLimitSeconds: quest.timeLimitSeconds,
      passingScore: quest.passingScore,
      xpReward: quest.xpReward,
      completed,
      lockReason,
    };
  }

  // Correct-answer keys are intentionally withheld while a session is active.
  static toSession({ quest, session }: StartedQuestSession) {
    return {
      id: session.id,
      questId: quest.id,
      title: quest.title,
      description: quest.description,
      timeLimitSeconds: quest.timeLimitSeconds,
      expiresAt: session.expiresAt.toISOString(),
      serverTime: new Date().toISOString(),
      questions: session.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
        })),
      })),
    };
  }
}
