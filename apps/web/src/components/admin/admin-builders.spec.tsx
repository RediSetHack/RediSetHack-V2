import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { toCriteria, toCriteriaValue } from "./criteria-builder";
import type { BadgeCriteria } from "@repo/contracts";
import { QuestionBuilder } from "./question-builder";
import { blockErrorKey, moveLessonBlock, toDraftBlocks, toLessonPayload, LessonBuilder, validateLessonBlocks } from "./lesson-builder";
import { newQuestion, type AdminQuestion } from "@/lib/admin-helpers";

describe("QuestionBuilder", () => {
  it("labels each question and exposes the option letters", () => {
    const questions: AdminQuestion[] = [newQuestion(), newQuestion()];
    const markup = renderToStaticMarkup(<QuestionBuilder questions={questions} onChange={() => {}} />);
    expect(markup).toContain("Question 1 of 2");
    expect(markup).toContain("Question 2 of 2");
    expect(markup).toContain("ADD QUESTION");
    expect(markup).toContain("ADD OPTION");
    expect(markup).toContain("Mark option A correct");
  });

  it("shows the validation alert when a question has no prompt", () => {
    const markup = renderToStaticMarkup(<QuestionBuilder questions={[newQuestion()]} onChange={() => {}} />);
    expect(markup).toContain('role="alert"');
    expect(markup).toContain("Question 1: prompt is required.");
  });

  it("welcomes an empty set with the add-first prompt", () => {
    expect(renderToStaticMarkup(<QuestionBuilder questions={[]} onChange={() => {}} />)).toContain(
      "No questions yet — add the first one.",
    );
  });
});

describe("LessonBuilder", () => {
  it("reorders blocks and leaves boundary moves unchanged", () => {
    const blocks = toDraftBlocks([{ type: "text", content: "one" }, { type: "text", content: "two" }]);
    expect(moveLessonBlock(blocks, 0, 1).map(({ block }) => block.content)).toEqual(["two", "one"]);
    expect(moveLessonBlock(blocks, 0, -1)).toEqual(blocks);
  });

  it("validates required fields for each supported block", () => {
    const blocks = toDraftBlocks([
      { type: "text", content: " " },
      { type: "code", language: "", content: "" },
      { type: "exercise", prompt: "", language: "", starterCode: "" },
      { type: "image", url: "", alt: " " },
    ]);
    expect(validateLessonBlocks(blocks)).toEqual({
      [blockErrorKey(blocks[0]!.key, "content")]: "Text blocks need content",
      [blockErrorKey(blocks[1]!.key, "language")]: "Code blocks need a language",
      [blockErrorKey(blocks[1]!.key, "content")]: "This field is required.",
      [blockErrorKey(blocks[2]!.key, "prompt")]: "Exercises need a prompt",
      [blockErrorKey(blocks[2]!.key, "language")]: "This field is required.",
      [blockErrorKey(blocks[3]!.key, "alt")]: "Images need alternative text",
      [blockErrorKey(blocks[3]!.key, "url")]: "This field is required.",
    });
  });

  it("ignores unsupported types with inherited object property names", () => {
    expect(validateLessonBlocks(toDraftBlocks([{ type: "constructor" }]))).toEqual({});
  });

  it("renders each block type and the ADD BLOCK menu", () => {
    const blocks = toDraftBlocks([
      { type: "text", content: "hello" },
      { type: "code", language: "python", content: "print(1)" },
      { type: "image", url: "https://example.test/a.png", alt: "diagram" },
    ]);
    const markup = renderToStaticMarkup(<LessonBuilder blocks={blocks} onChange={() => {}} />);
    expect(markup).toContain("text block");
    expect(markup).toContain("code block");
    expect(markup).toContain("image block");
    expect(markup).toContain("ADD BLOCK");
    expect(markup).toContain("Lesson content (3 blocks)");
  });

  it("welcomes an empty list with the add-first prompt", () => {
    expect(renderToStaticMarkup(<LessonBuilder blocks={[]} onChange={() => {}} />)).toContain(
      "No blocks yet — add the first one.",
    );
  });

  it("round-trips draft blocks through the API payload shape", () => {
    const payload = toLessonPayload(toDraftBlocks([
      { type: "text", content: "hi" },
      { type: "image", url: "u", alt: "a", caption: "  " },
      { type: "exercise", prompt: "graded", language: "cpp", starterCode: "", activityId: 27 },
    ]));
    expect(payload).toEqual([
      { type: "text", content: "hi" },
      { type: "image", url: "u", alt: "a" },
      { type: "exercise", prompt: "graded", language: "cpp", starterCode: "", activityId: 27 },
    ]);
  });
});


describe("Badge criteria editing", () => {
  it.each<BadgeCriteria>([
    { trigger: "cumulative", target: "stage_completions", threshold: 20 },
    { trigger: "activity", target: "quest_passes", threshold: 7 },
    { trigger: "category", target: "zone_completion", zoneId: 42 },
  ])("preserves saved $trigger criteria", (criteria) => {
    expect(toCriteria(toCriteriaValue(criteria))).toEqual(criteria);
  });
});
