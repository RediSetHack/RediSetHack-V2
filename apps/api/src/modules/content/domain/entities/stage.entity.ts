export type StageStatus = 'locked' | 'available' | 'completed';

export class Stage {
  constructor(
    public readonly id: number,
    public readonly zoneId: number,
    public readonly title: string,
    public readonly slug: string,
    // jsonb column: already-parsed lesson blocks, not a JSON string.
    public readonly lessonContent: unknown,
    public readonly xpReward: number,
    public readonly sortOrder: number,
  ) {}
}
