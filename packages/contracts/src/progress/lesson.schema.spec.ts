import { describe, expect, it } from "vitest";
import { LessonBlockSchema, LessonResponseSchema } from "./lesson.schema.js";

describe("LessonBlockSchema", () => {
  it("parses a text block", () => {
    const block = { type: "text", content: "Loops repeat code." };
    expect(LessonBlockSchema.parse(block)).toEqual(block);
  });

  it("parses a code block", () => {
    const block = {
      type: "code",
      language: "javascript",
      content: "console.log(1)",
    };
    expect(LessonBlockSchema.parse(block)).toEqual(block);
  });

  it("parses an exercise block", () => {
    const block = {
      type: "exercise",
      prompt: "Write a for loop.",
      language: "javascript",
      starterCode: "for (let i = 0; i < 10; i++) {}",
    };
    expect(LessonBlockSchema.parse(block)).toEqual(block);
  });

  it("parses images and rejects malformed known blocks", () => {
    const block = {
      type: "image",
      url: "https://example.com/loop.png",
      alt: "A loop diagram",
      caption: "Loop",
    };
    expect(LessonBlockSchema.parse(block)).toEqual(block);
    expect(() =>
      LessonBlockSchema.parse({ type: "image", url: "/loop.png" }),
    ).toThrow();
    expect(() =>
      LessonBlockSchema.parse({ type: "exercise", prompt: "Start" }),
    ).toThrow();
  });

  it("does not treat malformed known types as future blocks", () => {
    expect(() =>
      LessonBlockSchema.parse({ type: "code", language: "js", code: "old" }),
    ).toThrow();
  });

  it("parses a block of an unrecognised type instead of throwing", () => {
    const block = { type: "video", url: "https://example.com/clip.mp4" };
    expect(LessonBlockSchema.parse(block)).toEqual(block);
    expect(LessonBlockSchema.parse({ type: "page-break" })).toEqual({
      type: "page-break",
    });
  });

  it("throws on a block with no type", () => {
    expect(() => LessonBlockSchema.parse({ content: "no type" })).toThrow();
  });
});

describe("LessonResponseSchema", () => {
  it("parses a valid Lesson payload", () => {
    const payload = {
      id: 1,
      zoneId: 1,
      title: "For loops",
      slug: "for-loops",
      xpReward: 50,
      sortOrder: 1,
      status: "available" as const,
      blocks: [{ type: "text", content: "Loops repeat code." }],
    };

    expect(LessonResponseSchema.parse(payload)).toEqual(payload);
  });

  it("rejects a locked status, which the endpoint never returns", () => {
    expect(() =>
      LessonResponseSchema.parse({
        id: 1,
        zoneId: 1,
        title: "For loops",
        slug: "for-loops",
        xpReward: 50,
        sortOrder: 1,
        status: "locked",
        blocks: [],
      }),
    ).toThrow();
  });

  it("parses an empty block list", () => {
    const payload = {
      id: 1,
      zoneId: 1,
      title: "Advanced",
      slug: "advanced",
      xpReward: 30,
      sortOrder: 2,
      status: "completed" as const,
      blocks: [],
    };

    expect(LessonResponseSchema.parse(payload)).toEqual(payload);
  });
});
