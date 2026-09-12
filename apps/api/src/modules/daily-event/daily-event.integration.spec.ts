import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DailyEvent } from "./domain/entities/daily-event.entity.js";
import { DailyEventRepository } from "./domain/ports/daily-event.repository.js";
import { GetTodayEventUseCase } from "./application/get-today-event.use-case.js";
import { GetTodayEventController } from "./presentation/controllers/get-today-event.controller.js";

describe("daily-event integration", () => {
  let app: INestApplication;
  const store = new Map<string, DailyEvent>();
  let nextId = 1;

  const fakeRepo: DailyEventRepository = {
    async findByDate(date) {
      return store.get(date) ?? null;
    },
    async create(date, eventType, xpMultiplier) {
      const event = new DailyEvent(nextId++, date, eventType, xpMultiplier);
      store.set(date, event);
      return event;
    },
  };

  beforeEach(async () => {
    store.clear();
    nextId = 1;
    const moduleRef = await Test.createTestingModule({
      controllers: [GetTodayEventController],
      providers: [
        { provide: DailyEventRepository, useValue: fakeRepo },
        GetTodayEventUseCase,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns today's event with 200", async () => {
    const res = await request(app.getHttpServer()).get("/v1/api/events/today");

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      id: expect.any(Number),
      eventDate: expect.any(String),
      eventType: expect.stringMatching(/^(normal|bonus)$/),
      xpMultiplier: expect.any(Number),
    });
  });

  it("returns the same event on repeated requests (same-day caching)", async () => {
    const first = await request(app.getHttpServer()).get("/v1/api/events/today");
    const second = await request(app.getHttpServer()).get("/v1/api/events/today");

    expect(first.body).toEqual(second.body);
    expect(store.size).toBe(1);
  });

  it("creates a new event after day rollover", async () => {
    await request(app.getHttpServer()).get("/v1/api/events/today");
    expect(store.size).toBe(1);

    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    store.clear();

    const res = await request(app.getHttpServer()).get("/v1/api/events/today");
    expect(res.status).toBe(200);
    expect(store.size).toBe(1);
  });

  it("does not require authentication", async () => {
    const res = await request(app.getHttpServer()).get("/v1/api/events/today");

    expect(res.status).toBe(200);
  });
});
