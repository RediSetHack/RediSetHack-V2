import { z } from "zod";

/** The languages the Codelab may execute under, mirroring the API's supported set. */
export const LanguageSchema = z.enum(["cpp", "c", "python", "javascript", "java"]);
export type Language = z.infer<typeof LanguageSchema>;

/** One execution result, `POST /v1/api/codelab/execute`. */
export const ExecuteCodeResponseSchema = z.object({
  stdout: z.string(),
  stderr: z.string(),
  exitCode: z.number().int(),
  executionTimeMs: z.number().int().nonnegative(),
});
export type ExecuteCodeResponse = z.infer<typeof ExecuteCodeResponseSchema>;