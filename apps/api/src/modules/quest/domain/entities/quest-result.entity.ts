export type QuestResponse = {
  questionId: number;
  optionId: number;
};

export class QuestResult {
  constructor(
    public readonly id: number,
    public readonly userId: string,
    public readonly questId: number,
    public readonly score: number,
    public readonly passed: boolean,
    public readonly responses: QuestResponse[],
    public readonly submittedAt: Date,
  ) {}
}
