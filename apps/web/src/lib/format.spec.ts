import { describe, it, expect } from "vitest";
import {
  formatXp,
  formatMmSs,
  slugify,
  moveItem,
  levelFromXp,
  levelStartXp,
  levelProgress,
} from "./format";

describe("formatXp", () => {
  it("suffixes XP and groups thousands", () => {
    expect(formatXp(0)).toBe("0 XP");
    expect(formatXp(1240)).toBe("1,240 XP");
  });
});

describe("formatMmSs", () => {
  it("pads minutes and seconds", () => {
    expect(formatMmSs(0)).toBe("00:00");
    expect(formatMmSs(42)).toBe("00:42");
    expect(formatMmSs(90)).toBe("01:30");
  });
  it("clamps negative input", () => {
    expect(formatMmSs(-5)).toBe("00:00");
  });
});

describe("slugify", () => {
  it("lowercases to kebab", () => {
    expect(slugify("Getting Started")).toBe("getting-started");
    expect(slugify("  Zone #1: Intro!  ")).toBe("zone-1-intro");
    expect(slugify("A B")).toBe("a-b");
    expect(slugify("--x--")).toBe("x");
  });
});

describe("moveItem", () => {
  it("moves an item and leaves the source array untouched", () => {
    const source = ["a", "b", "c"];
    expect(moveItem(source, 0, 2)).toEqual(["b", "c", "a"]);
    expect(source).toEqual(["a", "b", "c"]);
  });
  it("is a no-op for out-of-range indices", () => {
    expect(moveItem(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });
});

describe("level math (mirrors apps/api)", () => {
  it("derives level from XP quadratically", () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(99)).toBe(1);
    expect(levelFromXp(100)).toBe(2);
    expect(levelFromXp(400)).toBe(3);
    expect(levelFromXp(-10)).toBe(1);
  });
  it("computes level start and progress", () => {
    expect(levelStartXp(1)).toBe(0);
    expect(levelStartXp(3)).toBe(400);
    expect(levelProgress(150)).toEqual({ level: 2, intoLevel: 50, span: 300 });
  });
});
