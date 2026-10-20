import { describe, expect, it } from "vitest";
import type { BadgeCriteria } from "@repo/contracts";

import {
  buildLessonPayload,
  fieldText,
  criteriaSummary,
  criteriaToSentence,
  defaultSlug,
  newOption,
  newQuestion,
  parseFieldIssues,
  slugError,
  validateQuestionSet,
} from "./admin-helpers";
import { slugify } from "./format";

describe("slug helpers", () => {
  it("builds an API-acceptable slug from a display name", () => {
    expect(defaultSlug("Loops & Variables!")).toBe("loops-variables");
    expect(slugError(defaultSlug("Loops & Variables!"))).toBeNull();
    expect(slugError(defaultSlug("Getting   Started"))).toBeNull();
  });

  it("rejects empty and non-kebab slugs", () => {
    expect(slugError("")).toMatch(/required/);
    expect(slugError("Getting Started")).toMatch(/lowercase/);
    expect(slugError("-leading")).toMatch(/lowercase/);
    expect(slugError("already-valid-1")).toBeNull();
  });

  it("mirrors slugify for the auto-fill path", () => {
    expect(defaultSlug("  Ada Lovelace ")).toBe(slugify("Ada Lovelace"));
  });
});

describe("newQuestion / newOption", () => {
  it("generates unique ids and a question the API shape accepts", () => {
    const a = newQuestion();
    const b = newQuestion();
    expect(a.id).not.toBe(b.id);
    expect(a.options).toHaveLength(2);
    expect(a.options.map((o) => o.id)).not.toEqual(b.options.map((o) => o.id));
    expect(a.options.some((o) => o.id === a.correctOptionId)).toBe(true);
    expect(newOption().id).not.toBe(newOption().id);
  });
});

describe("validateQuestionSet", () => {
  const question = (overrides: Partial<ReturnType<typeof newQuestion>> = {}) => ({
    ...newQuestion(),
    prompt: "Which keyword declares a constant?",
    ...overrides,
  });

  it("requires at least one question", () => {
    expect(validateQuestionSet([])).toEqual(["Add at least one question."]);
  });

  it("accepts a well-formed set", () => {
    const valid = question();
    valid.options = [
      { id: "a", text: "let" },
      { id: "b", text: "const" },
    ];
    valid.correctOptionId = "b";
    expect(validateQuestionSet([valid])).toEqual([]);
  });

  it("flags a missing prompt", () => {
    const errors = validateQuestionSet([question({ prompt: "   " })]);
    expect(errors).toContain("Question 1: prompt is required.");
  });

  it("flags option counts outside 2–6", () => {
    const one = question();
    one.options = [{ id: "a", text: "only" }];
    one.correctOptionId = "a";
    expect(validateQuestionSet([one])).toContain("Question 1: needs between 2 and 6 options.");

    const seven = question();
    seven.options = Array.from({ length: 7 }, (_, i) => ({ id: `o${i}`, text: `option ${i}` }));
    seven.correctOptionId = "o0";
    expect(validateQuestionSet([seven])).toContain("Question 1: needs between 2 and 6 options.");
  });

  it("flags empty option text with its letter", () => {
    const q = question();
    q.options = [
      { id: "a", text: "let" },
      { id: "b", text: "  " },
    ];
    q.correctOptionId = "a";
    expect(validateQuestionSet([q])).toContain("Question 1: option B needs text.");
  });

  it("requires exactly one correct option that exists", () => {
    const q = question();
    q.options = [
      { id: "a", text: "let" },
      { id: "b", text: "const" },
    ];
    q.correctOptionId = "missing";
    expect(validateQuestionSet([q])).toContain("Question 1: mark exactly one correct answer.");
  });

  it("reports every failing question by number", () => {
    const first = question({ prompt: "" });
    const second = question();
    second.options = [{ id: "x", text: "" }];
    second.correctOptionId = "x";
    const errors = validateQuestionSet([first, second]);
    expect(errors).toContain("Question 1: prompt is required.");
    expect(errors.some((e) => e.startsWith("Question 2:"))).toBe(true);
  });
});

describe("criteriaToSentence / criteriaSummary", () => {
  const cumulative: BadgeCriteria = { trigger: "cumulative", target: "stage_completions", threshold: 5 };
  const activity: BadgeCriteria = { trigger: "activity", target: "quest_passes", threshold: 1 };
  const category: BadgeCriteria = { trigger: "category", target: "zone_completion", zoneId: 3 };

  it("spells out each accepted trigger", () => {
    expect(criteriaToSentence(cumulative)).toBe("Awarded each time a learner reaches 5 stage completions.");
    expect(criteriaToSentence(activity)).toBe("Awarded each time a learner passes 1 quest.");
    expect(criteriaToSentence(category)).toBe("Awarded when a learner completes Zone 3.");
  });

  it("summarises for the list column", () => {
    expect(criteriaSummary(cumulative)).toBe("5 stage completions");
    expect(criteriaSummary(activity)).toBe("1 quest pass");
    expect(criteriaSummary(category)).toBe("Zone 3 completion");
  });
});

describe("parseFieldIssues", () => {
  it("keys contributor-style `path: message` segments", () => {
    const { fields, alert } = parseFieldIssues("name: Title is required; lessonContent.0: Text blocks need content");
    expect(fields).toEqual({
      name: "Title is required",
      "lessonContent.0": "Text blocks need content",
    });
    expect(alert).toBeNull();
  });

  it("handles long whitespace after a colon without backtracking", () => {
    const whitespace = " ".repeat(20000);
    expect(parseFieldIssues(`name:${whitespace}required`)).toEqual({ fields: { name: "required" }, alert: null });
    expect(parseFieldIssues(`name:${whitespace}`)).toEqual({ fields: {}, alert: "name:" });
  });

  it("keys class-validator style `field must …` segments", () => {
    const { fields } = parseFieldIssues("slug must match /^[a-z0-9-]+$/; sortOrder must be an integer number");
    expect(fields.slug).toMatch(/must match/);
    expect(fields.sortOrder).toMatch(/integer/);
  });

  it("keeps unattributable text as one alert", () => {
    const { fields, alert } = parseFieldIssues("Request failed with status 400");
    expect(fields).toEqual({});
    expect(alert).toBe("Request failed with status 400");
  });
});

describe("buildLessonPayload", () => {
  it("emits only the API's own fields and drops an empty caption", () => {
    const payload = buildLessonPayload([
      { type: "text", content: "Hello" },
      { type: "code", language: "python", content: "print(1)" },
      { type: "image", url: "https://x/y.png", alt: "diagram", caption: "  " },
      { type: "exercise", prompt: "Write a loop", language: "python", starterCode: "" },
    ]);
    expect(payload).toEqual([
      { type: "text", content: "Hello" },
      { type: "code", language: "python", content: "print(1)" },
      { type: "image", url: "https://x/y.png", alt: "diagram" },
      { type: "exercise", prompt: "Write a loop", language: "python", starterCode: "" },
    ]);
  });

  it("keeps a real caption", () => {
    expect(buildLessonPayload([{ type: "image", url: "u", alt: "a", caption: "Fig 1" }])).toEqual([
      { type: "image", url: "u", alt: "a", caption: "Fig 1" },
    ]);
  });
});


describe("fieldText", () => {
  it("keeps strings and numeric select values without stringifying objects", () => {
    expect(fieldText("hello")).toBe("hello");
    expect(fieldText(12)).toBe("12");
    for (const value of [undefined, null, {}, [], true]) {
      expect(fieldText(value)).toBe("");
      expect(fieldText(value, "python")).toBe("python");
    }
  });
});
