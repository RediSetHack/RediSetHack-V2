import { describe, expect, it } from "vitest";
import { getPageInfo, parsePageParam } from "./pagination";

describe("getPageInfo", () => {
  it("computes total pages and neighbours for a middle page", () => {
    expect(getPageInfo(2, 20, 45)).toEqual({
      page: 2,
      totalPages: 3,
      hasPrevious: true,
      hasNext: true,
      previousPage: 1,
      nextPage: 3,
    });
  });

  it("has no previous page on the first page", () => {
    expect(getPageInfo(1, 20, 45)).toMatchObject({
      hasPrevious: false,
      previousPage: null,
      hasNext: true,
      nextPage: 2,
    });
  });

  it("has no next page on the last page", () => {
    expect(getPageInfo(3, 20, 45)).toMatchObject({
      hasNext: false,
      nextPage: null,
      hasPrevious: true,
    });
  });

  it("treats an empty leaderboard as a single, un-paged page", () => {
    expect(getPageInfo(1, 20, 0)).toEqual({
      page: 1,
      totalPages: 1,
      hasPrevious: false,
      hasNext: false,
      previousPage: null,
      nextPage: null,
    });
  });

  it("clamps a page requested past the end back onto the last page", () => {
    expect(getPageInfo(99, 20, 45)).toMatchObject({
      page: 3,
      hasNext: false,
    });
  });

  it("clamps a page below 1 up to the first page", () => {
    expect(getPageInfo(0, 20, 45)).toMatchObject({ page: 1 });
    expect(getPageInfo(-5, 20, 45)).toMatchObject({ page: 1 });
  });
});

describe("parsePageParam", () => {
  it("defaults to page 1 when absent", () => {
    expect(parsePageParam(undefined)).toBe(1);
  });

  it("parses a numeric string", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("takes the first value of an array param", () => {
    expect(parsePageParam(["4", "5"])).toBe(4);
  });

  it("falls back to 1 for garbage input", () => {
    expect(parsePageParam("not-a-number")).toBe(1);
    expect(parsePageParam("-3")).toBe(1);
    expect(parsePageParam("0")).toBe(1);
  });
});
