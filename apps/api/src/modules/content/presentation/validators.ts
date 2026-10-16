import { registerDecorator, ValidationOptions } from 'class-validator';

const LESSON_BLOCK_TYPES = new Set(['text', 'code', 'image']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isLessonBlock(block: unknown): boolean {
  if (!isPlainObject(block) || !LESSON_BLOCK_TYPES.has(block.type as string))
    return false;
  switch (block.type) {
    case 'text':
      return typeof block.content === 'string' && block.content.length > 0;
    case 'code':
      return (
        typeof block.language === 'string' && typeof block.code === 'string'
      );
    case 'image':
      return (
        typeof block.url === 'string' &&
        (block.caption === undefined || typeof block.caption === 'string')
      );
    default:
      return false;
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

function isQuestQuestion(question: unknown): boolean {
  if (!isPlainObject(question)) return false;
  if (typeof question.id !== 'string' || typeof question.prompt !== 'string')
    return false;
  if (!Array.isArray(question.options) || question.options.length < 2)
    return false;
  const options = question.options as unknown[];
  const optionIds = new Set<string>();
  for (const option of options) {
    if (
      !isPlainObject(option) ||
      typeof option.id !== 'string' ||
      typeof option.text !== 'string' ||
      optionIds.has(option.id)
    )
      return false;
    optionIds.add(option.id);
  }
  return (
    typeof question.correctOptionId === 'string' &&
    optionIds.has(question.correctOptionId)
  );
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
          return Array.isArray(value) && value.every(isQuestQuestion);
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
