export class QuestNotFoundError extends Error {
  constructor(questId: number) {
    super(`Quest with id ${questId} does not exist`);
    this.name = "QuestNotFoundError";
  }
}

export class QuestResultNotFoundError extends Error {
  constructor(resultId: number) {
    super(`Result with id ${resultId} does not exist`);
    this.name = "QuestResultNotFoundError";
  }
}
