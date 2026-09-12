import { registerDecorator, ValidationOptions } from "class-validator";

const LESSON_BLOCK_TYPES = ["text", "code", "image"];
const BADGE_TRIGGERS = ["cumulative", "category", "activity"];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isLessonBlock(block: unknown): boolean {
  if (!isPlainObject(block) || !LESSON_BLOCK_TYPES.includes(block.type as string)) return false;
  switch (block.type) {
    case "text":
      return typeof block.content === "string" && block.content.length > 0;
    case "code":
      return typeof block.language === "string" && typeof block.code === "string";
    case "image":
      return typeof block.url === "string" && (block.caption === undefined || typeof block.caption === "string");
    default:
      return false;
  }
}

/** Validates an array of structured lesson blocks ({ type: "text"|"code"|"image", ... }). */
export function IsLessonContent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isLessonContent",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return Array.isArray(value) && value.every(isLessonBlock);
        },
        defaultMessage() {
          return `${propertyName} must be an array of lesson blocks ({ type: "text"|"code"|"image", ... })`;
        },
      },
    });
  };
}

function isQuestQuestion(question: unknown): boolean {
  if (!isPlainObject(question)) return false;
  if (typeof question.id !== "string" || typeof question.prompt !== "string") return false;
  if (!Array.isArray(question.options) || question.options.length < 2) return false;
  const options = question.options as unknown[];
  const optionIds = new Set<string>();
  for (const option of options) {
    if (!isPlainObject(option) || typeof option.id !== "string" || typeof option.text !== "string") return false;
    optionIds.add(option.id);
  }
  return typeof question.correctOptionId === "string" && optionIds.has(question.correctOptionId);
}

/** Validates an array of quest questions with options and a correct-option reference. */
export function IsQuestQuestions(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isQuestQuestions",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return Array.isArray(value) && value.every(isQuestQuestion);
        },
        defaultMessage() {
          return `${propertyName} must be an array of questions with id, prompt, options (>=2), and a matching correctOptionId`;
        },
      },
    });
  };
}

/** Validates badge trigger criteria: { trigger: "cumulative"|"category"|"activity", target, threshold }. */
export function IsBadgeCriteria(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isBadgeCriteria",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!isPlainObject(value)) return false;
          return (
            BADGE_TRIGGERS.includes(value.trigger as string) &&
            typeof value.target === "string" &&
            value.target.length > 0 &&
            typeof value.threshold === "number" &&
            value.threshold > 0
          );
        },
        defaultMessage() {
          return `${propertyName} must be { trigger: "cumulative"|"category"|"activity", target: string, threshold: number > 0 }`;
        },
      },
    });
  };
}
