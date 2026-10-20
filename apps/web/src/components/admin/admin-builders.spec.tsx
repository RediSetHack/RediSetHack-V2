import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { QuestionBuilder } from "./question-builder";
import { toDraftBlocks, toLessonPayload, LessonBuilder } from "./lesson-builder";
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
    const payload = toLessonPayload(toDraftBlocks([{ type: "text", content: "hi" }, { type: "image", url: "u", alt: "a", caption: "  " }]));
    expect(payload).toEqual([
      { type: "text", content: "hi" },
      { type: "image", url: "u", alt: "a" },
    ]);
  });
});
