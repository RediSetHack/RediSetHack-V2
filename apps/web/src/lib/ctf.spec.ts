import { describe, expect, it } from "vitest";

import { artifactFileName, CTF_DIFFICULTY_LABELS, flagVerdict } from "./ctf";

describe("flagVerdict", () => {
  it("tells the learner the flag was wrong", () => {
    expect(
      flagVerdict({ correct: false, alreadySolved: false, xpAwarded: 0 }),
    ).toEqual({
      message: "Not the flag. Check the artifact and try again.",
      tone: "error",
    });
  });

  it("pays XP for a first correct flag", () => {
    expect(
      flagVerdict({ correct: true, alreadySolved: false, xpAwarded: 100 }),
    ).toEqual({ message: "Correct! +100 XP earned.", tone: "success" });
  });

  it("never promises XP twice for a replayed flag", () => {
    expect(
      flagVerdict({ correct: true, alreadySolved: true, xpAwarded: 0 }),
    ).toEqual({
      message: "Correct — you already solved this one.",
      tone: "success",
    });
  });
});

describe("artifactFileName", () => {
  it("keeps a safe file name as it is", () => {
    expect(artifactFileName("notes.txt")).toBe("notes.txt");
  });

  it("replaces characters a file system would refuse", () => {
    expect(artifactFileName("../etc/passwd")).toBe("etc-passwd");
  });

  it("falls back to a name when nothing is left", () => {
    expect(artifactFileName("   ")).toBe("artifact.txt");
  });
});

describe("CTF_DIFFICULTY_LABELS", () => {
  it("spells out every difficulty", () => {
    expect(CTF_DIFFICULTY_LABELS).toEqual({
      beginner: "Beginner",
      intermediate: "Intermediate",
      advanced: "Advanced",
    });
  });
});
