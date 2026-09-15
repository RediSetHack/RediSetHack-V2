import type { CodeBlock, ExerciseBlock, LessonBlock, TextBlock } from "@repo/contracts";

/**
 * The Lesson renderer's view model, one variant per component it dispatches
 * to. A block whose `type` the API might one day add before the renderer
 * knows about it normalizes to `unsupported` instead of throwing, so the
 * page degrades legibly rather than breaking.
 */
export type RenderableBlock =
  | { kind: "text"; content: string }
  | { kind: "code"; language: string; content: string }
  | { kind: "exercise"; prompt: string; language: string; starterCode: string }
  | { kind: "unsupported"; type: string };

// `LessonBlock` is a plain z.union (not a discriminatedUnion) so an
// unrecognised future block type still parses instead of failing the
// contract — see lesson.schema.ts. That looseness means TS can't narrow
// the union purely from `block.type`, hence the casts below.
function normalizeBlock(block: LessonBlock): RenderableBlock {
  switch (block.type) {
    case "text": {
      const { content } = block as TextBlock;
      return { kind: "text", content };
    }
    case "code": {
      const { language, content } = block as CodeBlock;
      return { kind: "code", language, content };
    }
    case "exercise": {
      const { prompt, language, starterCode } = block as ExerciseBlock;
      return { kind: "exercise", prompt, language, starterCode };
    }
    default:
      return { kind: "unsupported", type: block.type };
  }
}

/** Turns a Lesson's raw structured blocks into the renderer's view model. */
export function normalizeLessonBlocks(blocks: readonly LessonBlock[]): RenderableBlock[] {
  return blocks.map(normalizeBlock);
}
