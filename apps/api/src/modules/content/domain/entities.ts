// Content-catalog domain entities for the admin CRUD API (issue #13).
// Mirrors the Drizzle tables in packages/db/src/schema.ts.

export type LessonBlock =
  | { type: 'text'; content: string }
  | { type: 'code'; language: string; code: string }
  | { type: 'image'; url: string; caption?: string };

export type QuestionOption = { id: string; text: string };

export type QuestQuestion = {
  id: string;
  prompt: string;
  options: QuestionOption[];
  correctOptionId: string;
};

export type BadgeTrigger = 'cumulative' | 'category' | 'activity';

export type BadgeCriteria = {
  trigger: BadgeTrigger;
  target: string;
  threshold: number;
};

export class Region {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly sortOrder: number,
  ) {}
}

export class Zone {
  constructor(
    public readonly id: number,
    public readonly regionId: number,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly sortOrder: number,
  ) {}
}

export class Stage {
  constructor(
    public readonly id: number,
    public readonly zoneId: number,
    public readonly title: string,
    public readonly slug: string,
    public readonly lessonContent: LessonBlock[] | null,
    public readonly xpReward: number,
    public readonly sortOrder: number,
  ) {}
}

export class Quest {
  constructor(
    public readonly id: number,
    public readonly stageId: number,
    public readonly title: string,
    public readonly description: string | null,
    public readonly timeLimitSeconds: number,
    public readonly passingScore: number,
    public readonly xpReward: number,
    public readonly questions: QuestQuestion[],
  ) {}
}

export class BadgeDefinition {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly slug: string,
    public readonly description: string | null,
    public readonly criteria: BadgeCriteria,
    public readonly imageUrl: string | null,
  ) {}
}
