import { QuestWithStatus } from "../../application/list-quests.use-case.js";
import { QuestSession } from "../../application/start-quest.use-case.js";

export class QuestPresenter {
  static toListItem({ quest, completed }: QuestWithStatus) {
    return {
      id: quest.id,
      stageId: quest.stageId,
      title: quest.title,
      description: quest.description,
      timeLimitSeconds: quest.timeLimitSeconds,
      passingScore: quest.passingScore,
      xpReward: quest.xpReward,
      completed,
    };
  }

  // Correct-answer keys are intentionally withheld while a session is active.
  static toSession({ quest, questions }: QuestSession) {
    return {
      id: quest.id,
      title: quest.title,
      description: quest.description,
      timeLimitSeconds: quest.timeLimitSeconds,
      questions: questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options.map((option) => ({ id: option.id, text: option.text })),
      })),
    };
  }
}
