import { describe, expect, it } from "vitest";
import { normalizeLessonBlocks } from "./lesson-blocks.js";

describe("normalizeLessonBlocks", () => {
  it("normalizes a text block", () => {
    expect(normalizeLessonBlocks([{ type: "text", content: "Loops repeat code." }])).toEqual([
      { kind: "text", content: "Loops repeat code." },
    ]);
  });

  it("normalizes a code block", () => {
    expect(
      normalizeLessonBlocks([{ type: "code", language: "javascript", content: "console.log(1)" }]),
    ).toEqual([{ kind: "code", language: "javascript", content: "console.log(1)" }]);
  });

  it("normalizes an exercise block", () => {
    expect(
      normalizeLessonBlocks([
        {
          type: "exercise",
          prompt: "Write a for loop.",
          language: "javascript",
          starterCode: "for (let i = 0; i < 10; i++) {}",
        },
      ]),
    ).toEqual([
      {
        kind: "exercise",
        prompt: "Write a for loop.",
        language: "javascript",
        starterCode: "for (let i = 0; i < 10; i++) {}",
      },
    ]);
  });

  it("normalizes an unrecognized block type to 'unsupported' instead of throwing", () => {
    expect(normalizeLessonBlocks([{ type: "video", url: "https://example.com/clip.mp4" }])).toEqual(
      [{ kind: "unsupported", type: "video" }],
    );
  });

  it("preserves block order across mixed types", () => {
    const result = normalizeLessonBlocks([
      { type: "text", content: "Intro" },
      { type: "code", language: "js", content: "1+1" },
      { type: "quiz", question: "?" },
    ]);
    expect(result.map((b) => b.kind)).toEqual(["text", "code", "unsupported"]);
  });

  it("returns an empty array for an empty Lesson", () => {
    expect(normalizeLessonBlocks([])).toEqual([]);
  });
});
