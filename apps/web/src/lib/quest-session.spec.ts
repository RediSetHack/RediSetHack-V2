import { describe, expect, it } from "vitest";
import {
  accumulateAnswer,
  clockSkewMs,
  countdownAnnouncement,
  formatCountdown,
  isCountdownDanger,
  isExpired,
  questResultSummary,
  secondsRemaining,
  shouldAutoSubmit,
  submitErrorDetail,
  SUBMIT_ERROR_MESSAGE,
  toSubmission,
  unansweredSubmitMessage,
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
    expect(
      isExpired(
        "2026-09-15T12:05:00.000Z",
        Date.parse("2026-09-15T12:04:00.000Z"),
      ),
    ).toBe(false);
  });

  it("is true exactly at the deadline", () => {
    expect(
      isExpired(
        "2026-09-15T12:05:00.000Z",
        Date.parse("2026-09-15T12:05:00.000Z"),
      ),
    ).toBe(true);
  });

  it("is true after the deadline", () => {
    expect(
      isExpired(
        "2026-09-15T12:05:00.000Z",
        Date.parse("2026-09-15T12:06:00.000Z"),
      ),
    ).toBe(true);
  });
});

describe("secondsRemaining", () => {
  it("counts down toward the deadline", () => {
    expect(
      secondsRemaining(
        "2026-09-15T12:05:00.000Z",
        Date.parse("2026-09-15T12:04:30.000Z"),
      ),
    ).toBe(30);
  });

  it("never goes negative once expired", () => {
    expect(
      secondsRemaining(
        "2026-09-15T12:05:00.000Z",
        Date.parse("2026-09-15T12:10:00.000Z"),
      ),
    ).toBe(0);
  });
});

describe("quest session submission copy", () => {
  it("uses the danger state at ten seconds and below", () => {
    expect(isCountdownDanger(11)).toBe(false);
    expect(isCountdownDanger(10)).toBe(true);
    expect(isCountdownDanger(0)).toBe(true);
  });

  it("includes the unanswered count with correct singular grammar", () => {
    expect(unansweredSubmitMessage(1)).toBe(
      "You have 1 unanswered question. Submit anyway?",
    );
    expect(unansweredSubmitMessage(3)).toBe(
      "You have 3 unanswered questions. Submit anyway?",
    );
  });
});

describe("countdownAnnouncement", () => {
  it("stays quiet between checkpoints so a screen reader is not read every second", () => {
    expect(countdownAnnouncement(59)).toBeNull();
    expect(countdownAnnouncement(45)).toBeNull();
    expect(countdownAnnouncement(31)).toBeNull();
  });

  it("announces the minute and half-minute checkpoints", () => {
    expect(countdownAnnouncement(60)).toBe("60 seconds remaining");
    expect(countdownAnnouncement(30)).toBe("30 seconds remaining");
  });

  it("announces the danger window one second at a time", () => {
    expect(countdownAnnouncement(10)).toBe(
      "10 seconds remaining. Time is running out",
    );
    expect(countdownAnnouncement(1)).toBe(
      "1 second remaining. Time is running out",
    );
  });

  it("stops announcing once the deadline has passed", () => {
    expect(countdownAnnouncement(0)).toBeNull();
  });
});

describe("shouldAutoSubmit", () => {
  it("fires once when the deadline has passed", () => {
    expect(shouldAutoSubmit(true, false)).toBe(true);
  });

  it("does not fire again after the automatic submission was triggered", () => {
    expect(shouldAutoSubmit(true, true)).toBe(false);
  });

  it("does not fire before the deadline", () => {
    expect(shouldAutoSubmit(false, false)).toBe(false);
  });
});

describe("submitErrorDetail", () => {
  it("keeps the server detail when it adds something", () => {
    expect(submitErrorDetail("Quest session not found")).toBe(
      "Quest session not found",
    );
  });

  it("drops a blank detail", () => {
    expect(submitErrorDetail("   ")).toBeNull();
    expect(submitErrorDetail(undefined)).toBeNull();
    expect(submitErrorDetail(null)).toBeNull();
  });

  it("drops a detail that repeats the fixed copy", () => {
    expect(submitErrorDetail(SUBMIT_ERROR_MESSAGE)).toBeNull();
  });
});

describe("questResultSummary", () => {
  it("announces a passed Quest with its score", () => {
    expect(
      questResultSummary({ passed: true, score: 80, outcome: "submitted" }),
    ).toEqual({
      headline: "QUEST PASSED!",
      score: "Score: 80%",
      note: null,
    });
  });

  it("announces a failed Quest with its score", () => {
    expect(
      questResultSummary({ passed: false, score: 40, outcome: "submitted" }),
    ).toEqual({
      headline: "QUEST NOT PASSED",
      score: "Score: 40%",
      note: null,
    });
  });

  it("keeps the expired Quest a failure and explains why", () => {
    const summary = questResultSummary({
      passed: false,
      score: 0,
      outcome: "expired",
    });
    expect(summary.headline).toBe("QUEST NOT PASSED");
    expect(summary.score).toBe("Score: 0%");
    expect(summary.note).toContain("TIME EXPIRED");
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

describe("clockSkewMs", () => {
  it("is the server clock minus the local clock", () => {
    expect(
      clockSkewMs(
        "2026-09-15T12:00:10.000Z",
        Date.parse("2026-09-15T12:00:00.000Z"),
      ),
    ).toBe(10_000);
  });

  it("keeps the countdown on the server deadline when the device clock is fast", () => {
    // Device is 30s ahead of the server; the server says 60s remain.
    const deviceNow = Date.parse("2026-09-15T12:00:30.000Z");
    const skew = clockSkewMs("2026-09-15T12:00:00.000Z", deviceNow);
    expect(secondsRemaining("2026-09-15T12:01:00.000Z", deviceNow, skew)).toBe(
      60,
    );
    expect(isExpired("2026-09-15T12:01:00.000Z", deviceNow, skew)).toBe(false);
  });

  it("expires on the server deadline when the device clock is slow", () => {
    const deviceNow = Date.parse("2026-09-15T11:59:30.000Z");
    const skew = clockSkewMs("2026-09-15T12:01:00.000Z", deviceNow);
    expect(isExpired("2026-09-15T12:01:00.000Z", deviceNow, skew)).toBe(true);
  });
});
