import type { BadgeCriteria, LessonBlock, QuestQuestionAuthoring } from "@repo/contracts";
import { slugify } from "@/lib/format";

/** A Quest question as the admin form edits it; matches the API's authoring shape. */
export type AdminQuestion = QuestQuestionAuthoring;
export type AdminOption = AdminQuestion["options"][number];

/* ── Id generators ─────────────────────────────────────────────── */

let fallbackCounter = 0;

/** `crypto.randomUUID` when available, a prefixed monotonic counter otherwise. */
export function newId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  fallbackCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${fallbackCounter}`;
}

export function newOption(): AdminOption {
  return { id: newId("opt"), text: "" };
}

/** Two blank options, with the first already marked correct — the admin moves the marker before saving. */
export function newQuestion(): AdminQuestion {
  const first = newOption();
  const second = newOption();
  return { id: newId("q"), prompt: "", options: [first, second], correctOptionId: first.id };
}

/* ── Slug ──────────────────────────────────────────────────────── */

/** Lowercase kebab, unambiguous so the matcher stays linear (no backtracking). */
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9]|-(?=[a-z0-9]))*$/;

/** Auto-fill source for the Slug field: `slugify(name)`. */
export function defaultSlug(name: string): string {
  return slugify(name);
}

/** `null` when the slug is acceptable, otherwise the inline field message. */
export function slugError(value: string): string | null {
  const slug = value.trim();
  if (slug.length === 0) return "Slug is required.";
  if (!SLUG_PATTERN.test(slug)) {
    return "Use lowercase letters, numbers and hyphens, e.g. getting-started.";
  }
  return null;
}

/* ── Question set validation ───────────────────────────────────── */

const optionLetter = (index: number) => String.fromCodePoint(65 + index);

/**
 * Blocks a Quest save until every rule the API enforces holds:
 * at least one question, 2–6 options each, no empty option text, and
 * exactly one correct option per question.
 */
export function validateQuestionSet(questions: readonly AdminQuestion[]): string[] {
  if (questions.length === 0) return ["Add at least one question."];

  const errors: string[] = [];
  questions.forEach((question, index) => {
    const n = index + 1;
    if (question.prompt.trim().length === 0) {
      errors.push(`Question ${n}: prompt is required.`);
    }
    if (question.options.length < 2 || question.options.length > 6) {
      errors.push(`Question ${n}: needs between 2 and 6 options.`);
    }
    question.options.forEach((option, optionIndex) => {
      if (option.text.trim().length === 0) {
        errors.push(`Question ${n}: option ${optionLetter(optionIndex)} needs text.`);
      }
    });
    if (!question.options.some((option) => option.id === question.correctOptionId)) {
      errors.push(`Question ${n}: mark exactly one correct answer.`);
    }
    if (new Set(question.options.map((option) => option.id)).size !== question.options.length) {
      errors.push(`Question ${n}: option ids must be unique.`);
    }
  });
  if (new Set(questions.map((question) => question.id)).size !== questions.length) {
    errors.push("Question ids must be unique.");
  }
  return errors;
}

/* ── Badge criteria ────────────────────────────────────────────── */

/** The live sentence under the criteria builder. */
export function criteriaToSentence(criteria: BadgeCriteria): string {
  switch (criteria.trigger) {
    case "cumulative":
      return `Awarded each time a learner reaches ${criteria.threshold} stage completion${criteria.threshold === 1 ? "" : "s"}.`;
    case "activity":
      return `Awarded each time a learner passes ${criteria.threshold} quest${criteria.threshold === 1 ? "" : "s"}.`;
    case "category":
      return `Awarded when a learner completes Zone ${criteria.zoneId}.`;
  }
}

/** The list column's short summary, e.g. "5 stage completions". */
export function criteriaSummary(criteria: BadgeCriteria): string {
  switch (criteria.trigger) {
    case "cumulative":
      return `${criteria.threshold} stage completion${criteria.threshold === 1 ? "" : "s"}`;
    case "activity":
      return `${criteria.threshold} quest pass${criteria.threshold === 1 ? "" : "s"}`;
    case "category":
      return `Zone ${criteria.zoneId} completion`;
  }
}

/* ── API validation-message triage ─────────────────────────────── */

export type FieldIssues = {
  /** Field-keyed messages, ready to drop under each input. */
  fields: Record<string, string>;
  /** The leftover, unattributable message — render it as an alert. */
  alert: string | null;
};

/**
 * Splits an `ApiError` message built from `path: message; path: message`
 * (contributor-style `issues`) or `field must …` segments (class-validator
 * arrays) into per-field errors plus one catch-all alert.
 */
export function parseFieldIssues(message: string): FieldIssues {
  const fields: Record<string, string> = {};
  const leftovers: string[] = [];

  for (const segment of message.split(";").map((part) => part.trim()).filter(Boolean)) {
    const pathMatch = /^([\w.[\]]+):\s*(\S.*)$/.exec(segment);
    if (pathMatch) {
      fields[pathMatch[1]!] = pathMatch[2]!;
      continue;
    }
    const propertyMatch = /^(\w+)\s+(?:must|should|cannot|has|is|does)\b/.exec(segment);
    if (propertyMatch) {
      fields[propertyMatch[1]!] = segment;
      continue;
    }
    leftovers.push(segment);
  }

  return { fields, alert: leftovers.length > 0 ? leftovers.join("; ") : null };
}

/* ── Lesson payload ────────────────────────────────────────────── */

/**
 * Normalizes the lesson builder's blocks into the exact API shape: known
 * fields only, empty optional caption dropped, unknown blocks passed through
 * untouched.
 */
export function buildLessonPayload(blocks: readonly LessonBlock[]): LessonBlock[] {
  return blocks.map((block) => {
    switch (block.type) {
      case "text":
        return { type: "text", content: block.content };
      case "code":
        return { type: "code", language: block.language, content: block.content };
      case "image": {
        const caption = typeof block.caption === "string" ? block.caption.trim() : "";
        return caption.length > 0
          ? { type: "image", url: block.url, alt: block.alt, caption }
          : { type: "image", url: block.url, alt: block.alt };
      }
      case "exercise":
        return { type: "exercise", prompt: block.prompt, language: block.language, starterCode: block.starterCode };
      default:
        return block;
    }
  });
}

/** Text controls accept scalar values, never an object’s default stringification. */
export function fieldText(value: unknown, fallback = ""): string {
  return typeof value === "string" || typeof value === "number" ? String(value) : fallback;
}
