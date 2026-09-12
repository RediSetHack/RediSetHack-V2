export type TextBlock = { type: "text"; content: string };
export type CodeBlock = { type: "code"; language: string; content: string };
export type ExerciseBlock = { type: "exercise"; prompt: string; language: string; starterCode: string };
export type LessonBlock = TextBlock | CodeBlock | ExerciseBlock;
