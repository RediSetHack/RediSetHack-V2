import type { Language } from "@repo/contracts";

/** The five languages the Codelab offers, in PAGES.md §12 order. */
export const CODELAB_LANGUAGES: readonly {
  readonly id: Language;
  readonly label: string;
}[] = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "java", label: "Java" },
];

/** The "Hello, world!" starter each language opens with. */
export const STARTER_EXAMPLES: Record<Language, string> = {
  python: 'print("Hello, world!")',
  javascript: 'console.log("Hello, world!");',
  cpp: '#include <iostream>\nint main() { std::cout << "Hello, world!" << std::endl; return 0; }',
  c: '#include <stdio.h>\nint main(void) { printf("Hello, world!\\n"); return 0; }',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}',
};

export function isLanguage(value: string | undefined): value is Language {
  return (
    value !== undefined &&
    (CODELAB_LANGUAGES.map((l) => l.id) as readonly string[]).includes(value)
  );
}

export function starterCodeFor(language: Language): string {
  return STARTER_EXAMPLES[language];
}

/**
 * True while the editor still holds the language's starter code — an empty
 * field counts as untouched, since there is nothing to lose.
 */
export function isUntouchedCode(code: string, language: Language): boolean {
  return code === "" || code === starterCodeFor(language);
}

/**
 * Switching language swaps in the new language's starter only while the code
 * is untouched. Anything the learner actually wrote survives the switch.
 */
export function codeAfterLanguageChange(
  code: string,
  currentLanguage: Language,
  nextLanguage: Language,
): string {
  return isUntouchedCode(code, currentLanguage)
    ? starterCodeFor(nextLanguage)
    : code;
}

/** The shape the status label needs — the full execution result satisfies it. */
export type ExecutionStatus = {
  readonly failureType: string;
  readonly exitCode: number;
  readonly executionTimeMs: number;
};

/**
 * The output window's header: how long the program ran, or how it exited.
 * The API only reports `failureType: "none"` for a run that finished cleanly.
 */
export function executionStatusLabel(result: ExecutionStatus): string {
  return result.failureType === "none"
    ? `Ran in ${result.executionTimeMs}ms`
    : `Program exited with code ${result.exitCode}`;
}

/** True when the run produced neither stdout nor stderr. */
export function hasExecutionOutput(result: {
  readonly stdout: string;
  readonly stderr: string;
}): boolean {
  return result.stdout.length > 0 || result.stderr.length > 0;
}

/**
 * True when a failed request means the learner's session is no longer valid,
 * so the Codelab asks them to sign in again instead of showing a raw error.
 */
export function isSessionExpired(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { status?: unknown }).status === 401
  );
}
