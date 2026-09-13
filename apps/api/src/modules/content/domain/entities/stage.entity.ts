export type StageStatus = "locked" | "available" | "completed";

export class Stage {
  constructor(
    public readonly id: number,
    public readonly zoneId: number,
    public readonly title: string,
    public readonly slug: string,
    public readonly lessonContent: string | null,
    public readonly xpReward: number,
    public readonly sortOrder: number,
  ) {}
}
