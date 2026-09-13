import { DailyEvent } from "../../domain/entities/daily-event.entity.js";

export class DailyEventPresenter {
  static toResponse(event: DailyEvent) {
    return {
      id: event.id,
      eventDate: event.eventDate,
      eventType: event.eventType,
      xpMultiplier: event.xpMultiplier,
    };
  }
}
