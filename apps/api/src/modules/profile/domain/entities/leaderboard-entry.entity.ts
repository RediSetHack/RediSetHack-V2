export class LeaderboardEntry {
  constructor(
    public readonly rank: number,
    public readonly userId: string,
    public readonly name: string | null,
    public readonly totalXp: number,
    public readonly level: number,
  ) {}
}
