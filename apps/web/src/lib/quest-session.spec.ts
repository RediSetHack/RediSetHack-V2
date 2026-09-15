import { describe, expect, it } from "vitest";
import {
  accumulateAnswer,
  formatCountdown,
  isExpired,
  secondsRemaining,
  toSubmission,
} from "./quest-session.js";

describe("accumulateAnswer", () => {
  it("records a new answer without touching existing ones", () => {
    const answers = accumulateAnswer({ 1: 10 }, 2, 20);
    expect(answers).toEqual({ 1: 10, 2: 20 });
  });

  it("overwrites a changed answer for the same question", () => {
    const answers = accumulateAnswer({ 1: 10 }, 1, 99);
    expect(answers).toEqual({ 1: 99 });
  });

  it("does not mutate the original map", () => {
    const original = { 1: 10 };
    accumulateAnswer(original, 2, 20);
    expect(original).toEqual({ 1: 10 });
  });
});

describe("toSubmission", () => {
  it("turns accumulated answers into the responses payload", () => {
    expect(toSubmission({ 1: 10, 2: 20 })).toEqual([
      { questionId: 1, optionId: 10 },
      { questionId: 2, optionId: 20 },
    ]);
  });

  it("submits an empty array when nothing was answered", () => {
    expect(toSubmission({})).toEqual([]);
  });
});

describe("isExpired", () => {
  it("is false before the deadline", () => {
    expect(isExpired("2026-09-15T12:05:00.000Z", Date.parse("2026-09-15T12:04:00.000Z"))).toBe(
      false,
    );
  });

  it("is true exactly at the deadline", () => {
    expect(isExpired("2026-09-15T12:05:00.000Z", Date.parse("2026-09-15T12:05:00.000Z"))).toBe(
      true,
    );
  });

  it("is true after the deadline", () => {
    expect(isExpired("2026-09-15T12:05:00.000Z", Date.parse("2026-09-15T12:06:00.000Z"))).toBe(
      true,
    );
  });
});

describe("secondsRemaining", () => {
  it("counts down toward the deadline", () => {
    expect(
      secondsRemaining("2026-09-15T12:05:00.000Z", Date.parse("2026-09-15T12:04:30.000Z")),
    ).toBe(30);
  });

  it("never goes negative once expired", () => {
    expect(
      secondsRemaining("2026-09-15T12:05:00.000Z", Date.parse("2026-09-15T12:10:00.000Z")),
    ).toBe(0);
  });
});

describe("formatCountdown", () => {
  it("formats minutes and seconds with a zero-padded seconds field", () => {
    expect(formatCountdown(65)).toBe("1:05");
  });

  it("formats zero as 0:00", () => {
    expect(formatCountdown(0)).toBe("0:00");
  });

  it("formats a duration under a minute", () => {
    expect(formatCountdown(9)).toBe("0:09");
  });
});
