export class BadgeAwardSummary {
  constructor(
    public readonly badgeDefinitionId: number,
    public readonly name: string,
    public readonly slug: string,
    public readonly imageUrl: string | null,
    public readonly count: number,
    public readonly latestAwardedAt: Date,
  ) {}
}
