export type EventType = "normal" | "bonus";

export class DailyEvent {
  constructor(
    public readonly id: number,
    public readonly eventDate: string,
    public readonly eventType: EventType,
    public readonly xpMultiplier: number,
  ) {}
}
