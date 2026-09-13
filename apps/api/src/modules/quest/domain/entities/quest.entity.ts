export class Quest {
  constructor(
    public readonly id: number,
    public readonly stageId: number,
    public readonly title: string,
    public readonly description: string | null,
    public readonly timeLimitSeconds: number,
    public readonly passingScore: number,
    public readonly xpReward: number,
  ) {}
}

export class QuestOption {
  constructor(
    public readonly id: number,
    public readonly text: string,
    public readonly isCorrect: boolean,
  ) {}
}

export class QuestQuestion {
  constructor(
    public readonly id: number,
    public readonly prompt: string,
    public readonly options: QuestOption[],
  ) {}
}
