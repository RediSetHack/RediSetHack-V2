export class StageNotFoundError extends Error {
  constructor(stageId: number) {
    super(`Stage with id ${stageId} does not exist`);
    this.name = "StageNotFoundError";
  }
}

export class StageLockedError extends Error {
  constructor(stageId: number) {
    super(`Stage with id ${stageId} is locked until its predecessor is completed`);
    this.name = "StageLockedError";
  }
}

export class StageAlreadyCompletedError extends Error {
  constructor(stageId: number) {
    super(`Stage with id ${stageId} is already completed`);
    this.name = "StageAlreadyCompletedError";
  }
}