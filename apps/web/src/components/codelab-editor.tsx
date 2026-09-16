"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { Language } from "@repo/contracts";
import { Button } from "@/components/ui/button";
import { executeCode, type CodeExecutionResult } from "@/lib/api-client";

const LANGUAGES: readonly { readonly id: Language; readonly label: string }[] = [
  { id: "python", label: "Python" },
  { id: "javascript", label: "JavaScript" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "java", label: "Java" },
];

const LANGUAGE_IDS = LANGUAGES.map((l) => l.id);

const STARTER_EXAMPLES: Record<Language, string> = {
  python: 'print("Hello, world!")',
  javascript: 'console.log("Hello, world!");',
  cpp: '#include <iostream>\nint main() { std::cout << "Hello, world!" << std::endl; return 0; }',
  c: '#include <stdio.h>\nint main(void) { printf("Hello, world!\\n"); return 0; }',
  java: 'public class Main {\n  public static void main(String[] args) {\n    System.out.println("Hello, world!");\n  }\n}',
};

function isLanguage(value: string | undefined): value is Language {
  return value !== undefined && (LANGUAGE_IDS as readonly string[]).includes(value);
}

function OutputPanel({ result }: Readonly<{ result: CodeExecutionResult }>) {
  const hasOutput = result.stdout.length > 0 || result.stderr.length > 0;
  const failed = result.exitCode !== 0;

  return (
    <div className="rounded-md border border-border bg-card font-mono text-sm">
      <div className="border-b border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground">
        {failed
          ? `Program exited with code ${result.exitCode}`
          : `Ran in ${result.executionTimeMs}ms`}
      </div>
      {!hasOutput && (
        <p className="px-4 py-3 text-muted-foreground">
          Program produced no output.
        </p>
      )}
      {result.stdout.length > 0 && (
        <pre className="overflow-x-auto whitespace-pre-wrap p-4">{result.stdout}</pre>
      )}
      {result.stderr.length > 0 && (
        <pre
          role="alert"
          className="overflow-x-auto whitespace-pre-wrap p-4 text-destructive"
        >
          {result.stderr}
        </pre>
      )}
    </div>
  );
}

interface CodelabEditorProps {
  readonly apiUrl: string;
  readonly initialLanguage?: string;
  readonly initialCode?: string;
}

export function CodelabEditor({
  apiUrl,
  initialLanguage,
  initialCode,
}: CodelabEditorProps) {
  const { getToken } = useAuth();
  const [language, setLanguage] = useState<Language>(
    () => (isLanguage(initialLanguage) ? initialLanguage : "python"),
  );
  const [code, setCode] = useState(
    () => initialCode ?? STARTER_EXAMPLES[language],
  );
  const [stdin, setStdin] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeExecutionResult | null>(null);

  function handleLanguageChange(next: Language) {
    setLanguage(next);
    // A fresh or untouched editor follows to the new language's starter
    // example; code the learner actually wrote is never overwritten.
    setCode((current) =>
      current === "" || current === STARTER_EXAMPLES[language]
        ? STARTER_EXAMPLES[next]
        : current,
    );
  }

  async function handleRun() {
    setIsRunning(true);
    setRunError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to obtain authentication session token");
      }
      const execution = await executeCode(apiUrl, token, {
        language,
        code,
        stdin,
      });
      setResult(execution);
    } catch (err) {
      // The editor's inputs are left untouched — a failed run never discards
      // the learner's code.
      setRunError(
        err instanceof Error
          ? err.message
          : "Code execution failed. Your code is still here — try again.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Codelab</h1>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Language</span>
          <select
            value={language}
            onChange={(event) => handleLanguageChange(event.target.value as Language)}
            className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm font-medium"
          >
            {LANGUAGES.map((languageOption) => (
              <option key={languageOption.id} value={languageOption.id}>
                {languageOption.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label htmlFor="code-input" className="mb-1 block text-sm font-medium">
          Code
        </label>
        <textarea
          id="code-input"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          className="min-h-64 w-full rounded-lg border border-input bg-background p-3 font-mono text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div>
        <label htmlFor="stdin-input" className="mb-1 block text-sm font-medium">
          Standard input
          <span className="ml-1 text-xs text-muted-foreground">
            (optional — for programs that read input)
          </span>
        </label>
        <textarea
          id="stdin-input"
          value={stdin}
          onChange={(event) => setStdin(event.target.value)}
          spellCheck={false}
          className="min-h-16 w-full rounded-lg border border-input bg-background p-3 font-mono text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={handleRun} disabled={isRunning}>
          {isRunning ? "Running…" : "Run"}
        </Button>
        <span aria-live="polite" className="sr-only">
          {isRunning ? "Running your code" : ""}
        </span>
        {runError && (
          <p role="alert" className="text-sm text-destructive">
            {runError}
          </p>
        )}
      </div>

      {result && (
        <div aria-live="polite">
          <OutputPanel result={result} />
        </div>
      )}
    </div>
  );
}