import { z } from "zod";

export const COMPETENCIES = [
  { id: "programming.fundamentals", title: "Programming fundamentals", objective: "Understand and apply core programming concepts." },
  { id: "programming.control-flow", title: "Control flow", objective: "Use conditions and loops to control program behavior." },
  { id: "programming.data-structures", title: "Data structures", objective: "Choose and use data structures to organize information." },
  { id: "programming.debugging", title: "Debugging", objective: "Inspect program behavior and identify causes of errors." },
  { id: "security.input-validation", title: "Input validation", objective: "Validate untrusted input before using it." },
  { id: "security.authentication", title: "Authentication", objective: "Explain how identity and authentication protect access." },
  { id: "security.secure-coding", title: "Secure coding", objective: "Apply coding practices that reduce common security risks." },
] as const;

export const CompetencyIdSchema = z.enum(
  COMPETENCIES.map(({ id }) => id) as [
    (typeof COMPETENCIES)[number]["id"],
    ...(typeof COMPETENCIES)[number]["id"][],
  ],
);
export type CompetencyId = z.infer<typeof CompetencyIdSchema>;
export const CompetencySchema = z.object({
  id: CompetencyIdSchema,
  title: z.string(),
  objective: z.string(),
});
export type Competency = z.infer<typeof CompetencySchema>;
export const DifficultySchema = z.enum(["beginner", "intermediate", "advanced"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export function resolveCompetencies(ids: readonly string[]): Competency[] {
  return COMPETENCIES.filter(({ id }) => ids.includes(id));
}
