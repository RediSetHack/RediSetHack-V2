import { registerDecorator, ValidationOptions } from 'class-validator';
import { QuestAuthoringQuestionsSchema } from '@repo/contracts';

const LESSON_BLOCK_TYPES = new Set(['text', 'code', 'image', 'exercise']);
const BADGE_TRIGGERS = new Set(['cumulative', 'category', 'activity']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLessonBlock(block: unknown): boolean {
  if (
    !isPlainObject(block) ||
    typeof block.type !== 'string' ||
    block.type.length === 0
  )
    return false;
  switch (block.type) {
    case 'text':
      return typeof block.content === 'string';
    case 'code':
      return (
        typeof block.language === 'string' &&
        (typeof block.content === 'string' || typeof block.code === 'string')
      );
    case 'image':
      return (
        typeof block.url === 'string' &&
        block.url.length > 0 &&
        typeof block.alt === 'string' &&
        (block.caption === undefined || typeof block.caption === 'string')
      );
    case 'exercise':
      return (
        typeof block.prompt === 'string' &&
        typeof block.language === 'string' &&
        typeof block.starterCode === 'string'
      );
    default:
      return !LESSON_BLOCK_TYPES.has(block.type);
  }
}

/** Validates an array of structured lesson blocks ({ type: "text"|"code"|"image", ... }). */
export function IsLessonContent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isLessonContent',
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

/** Validates an array of quest questions with options and a correct-option reference. */
export function IsQuestQuestions(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isQuestQuestions',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return QuestAuthoringQuestionsSchema.safeParse(value).success;
        },
        defaultMessage() {
          return `${propertyName} must be an array of questions with id, prompt, options (>=2), and a matching correctOptionId`;
        },
      },
    });
  };
}

/** Validates exact badge trigger criteria: cumulative, activity, or category. */
export function IsBadgeCriteria(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBadgeCriteria',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!isPlainObject(value)) return false;
          if (value.trigger === 'cumulative') {
            return (
              value.target === 'stage_completions' &&
              typeof value.threshold === 'number' &&
              Number.isInteger(value.threshold) &&
              value.threshold > 0
            );
          }
          if (value.trigger === 'activity') {
            return (
              value.target === 'quest_passes' &&
              typeof value.threshold === 'number' &&
              Number.isInteger(value.threshold) &&
              value.threshold > 0
            );
          }
          if (value.trigger === 'category') {
            return (
              value.target === 'zone_completion' &&
              typeof value.zoneId === 'number' &&
              Number.isInteger(value.zoneId) &&
              value.zoneId > 0
            );
          }
          return false;
        },
        defaultMessage() {
          return `${propertyName} must be valid criteria: { trigger: 'cumulative', target: 'stage_completions', threshold: integer > 0 } | { trigger: 'activity', target: 'quest_passes', threshold: integer > 0 } | { trigger: 'category', target: 'zone_completion', zoneId: integer > 0 }`;
        },
      },
    });
  };
}
