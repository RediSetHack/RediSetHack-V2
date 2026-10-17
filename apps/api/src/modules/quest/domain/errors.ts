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

export class QuestSessionNotFoundError extends Error {
  constructor(sessionId: number) {
    super(`Quest Session with id ${sessionId} does not exist`);
    this.name = "QuestSessionNotFoundError";
  }
}

export class InvalidQuestResponsesError extends Error {
  constructor(reason: string) {
    super(`Invalid responses: ${reason}`);
    this.name = "InvalidQuestResponsesError";
  }
}

export class QuestSessionAlreadySubmittedError extends Error {
  constructor(sessionId: number) {
    super(
      `Quest Session ${sessionId} was already submitted with different responses`,
    );
    this.name = "QuestSessionAlreadySubmittedError";
  }
}
