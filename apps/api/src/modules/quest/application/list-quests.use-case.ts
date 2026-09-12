import { Injectable } from "@nestjs/common";

import { Quest } from "../domain/entities/quest.entity.js";
import { QuestRepository } from "../domain/ports/quest.repository.js";

export type QuestWithStatus = { quest: Quest; completed: boolean };

@Injectable()
export class ListQuestsUseCase {
  constructor(private readonly quests: QuestRepository) {}

  async execute(userId: string): Promise<QuestWithStatus[]> {
    const [all, passedIds] = await Promise.all([
      this.quests.findAll(),
      this.quests.findPassedQuestIds(userId),
    ]);
    return all.map((quest) => ({ quest, completed: passedIds.has(quest.id) }));
  }
}
