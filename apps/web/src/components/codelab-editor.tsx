"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { Language } from "@repo/contracts";
import {
  executeCode,
  getCodingActivity,
  submitCodingAttempt,
  type CodeExecutionResult,
  type CodingActivity,
  type CodingAttempt,
} from "@/lib/api-client";
import {
  ConfirmDialog,
  Y2kAlert,
} from "@/components/y2k-dialog";
import {
  FieldLabel,
  Progress,
  Window,
  Y2kButton,
  Y2kSelect,
  Y2kTextarea,
} from "@/components/y2k";

const LANGUAGES: readonly { readonly id: Language; readonly label: string }[] =
  [
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
  return (
    value !== undefined && (LANGUAGE_IDS as readonly string[]).includes(value)
  );
}

function OutputPanel({
  result,
  learnerElapsedTimeMs,
}: Readonly<{ result: CodeExecutionResult; learnerElapsedTimeMs: number }>) {
  const hasOutput = result.stdout.length > 0 || result.stderr.length > 0;
  const failed = result.failureType !== "none";

  return (
    <Window
      title={
        failed
          ? `Program exited with code ${result.exitCode}`
          : `Ran in ${result.executionTimeMs}ms`
      }
      bodyClassName="space-y-2 font-mono text-sm"
    >
      <div className="text-xs text-muted-foreground">
        Request: {result.requestDurationMs}ms · Total: {learnerElapsedTimeMs}ms
      </div>
      {!hasOutput && (
        <p className="text-muted-foreground">Program produced no output.</p>
      )}
      {result.stdout.length > 0 && (
        <pre className="overflow-x-auto whitespace-pre-wrap">{result.stdout}</pre>
      )}
      {result.stderr.length > 0 && (
        <pre role="alert" className="overflow-x-auto whitespace-pre-wrap text-btn-danger">
          {result.stderr}
        </pre>
      )}
    </Window>
  );
}

interface CodelabEditorProps {
  readonly apiUrl: string;
  readonly initialLanguage?: string;
  readonly initialCode?: string;
  /** When set, the editor opens that graded activity and offers "Submit for grading". */
  readonly activityId?: number;
}

const CATEGORY_MESSAGE: Record<CodingAttempt["errorCategory"], string> = {
  none: "All checks passed.",
  wrong_answer: "Some checks produced the wrong output.",
  compile: "Your code did not compile.",
  runtime: "Your code crashed on a check.",
  timeout: "Your code took too long to run. Try a faster approach.",
};

function AttemptPanel({ attempt }: Readonly<{ attempt: CodingAttempt }>) {
  return (
    <Window title="Graded Result" bodyClassName="space-y-2 text-sm">
      <p role="status" className="font-body font-bold">
        {attempt.passed ? "Passed" : "Not yet"} — {attempt.checksPassed}/
        {attempt.checksTotal} checks ({attempt.score}%).{" "}
        {CATEGORY_MESSAGE[attempt.errorCategory]}
      </p>
      {attempt.xpAwarded > 0 && (
        <p className="font-body font-bold text-foreground">+{attempt.xpAwarded} XP earned</p>
      )}
      <ul className="font-mono">
        {attempt.visibleResults.map((r) => (
          <li key={r.input}>
            {r.passed ? "OK" : "FAIL"} input {JSON.stringify(r.input)}: expected{" "}
            {JSON.stringify(r.expected)}, got {JSON.stringify(r.actual.trim())}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">
        Hidden checks are not shown. Sandbox time: {attempt.elapsedMs}ms.
      </p>
    </Window>
  );
}

export function CodelabEditor({
  apiUrl,
  initialLanguage,
  initialCode,
  activityId,
}: CodelabEditorProps) {
  const { getToken } = useAuth();
  const [language, setLanguage] = useState<Language>(() =>
    isLanguage(initialLanguage) ? initialLanguage : "python",
  );
  const [code, setCode] = useState(
    () => initialCode ?? STARTER_EXAMPLES[language],
  );
  const [stdin, setStdin] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [result, setResult] = useState<CodeExecutionResult | null>(null);
  const [learnerElapsedTimeMs, setLearnerElapsedTimeMs] = useState(0);
  const [activity, setActivity] = useState<CodingActivity | null>(null);
  const [attempt, setAttempt] = useState<CodingAttempt | null>(null);

  useEffect(() => {
    if (activityId === undefined) return;
    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken();
        if (!token) throw new Error("Unable to obtain authentication session token");
        const loaded = await getCodingActivity(apiUrl, token, activityId);
        if (cancelled) return;
        setActivity(loaded);
        setLanguage(loaded.language);
        setCode(loaded.starterCode);
      } catch (err) {
        if (!cancelled)
          setRunError(err instanceof Error ? err.message : "Could not open this activity.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId, apiUrl, getToken]);

  async function handleSubmit() {
    if (activityId === undefined) return;
    setIsRunning(true);
    setRunError(null);
    setAttempt(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Unable to obtain authentication session token");
      setAttempt(await submitCodingAttempt(apiUrl, token, activityId, code));
    } catch (err) {
      setRunError(
        err instanceof Error
          ? err.message
          : "Grading failed. Your code is still here — try again.",
      );
    } finally {
      setIsRunning(false);
    }
  }

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
    const startedAt = performance.now();
    setIsRunning(true);
    setRunError(null);
    setResult(null);
    setLearnerElapsedTimeMs(0);
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
      setLearnerElapsedTimeMs(Math.round(performance.now() - startedAt));
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

  const [resetOpen, setResetOpen] = useState(false);

  const starterForLang = STARTER_EXAMPLES[language];

  function handleReset() {
    setCode(starterForLang);
  }

  return (
    <div className="space-y-6">
      <Window title="CODELAB.EXE">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <FieldLabel htmlFor="language-select">Language</FieldLabel>
          <Y2kSelect
            id="language-select"
            value={language}
            onChange={(event) =>
              handleLanguageChange(event.target.value as Language)
            }
          >
            {LANGUAGES.map((languageOption) => (
              <option key={languageOption.id} value={languageOption.id}>
                {languageOption.label}
              </option>
            ))}
          </Y2kSelect>
        </div>
      </Window>

      {activity && (
        <Window title="Side Quest" bodyClassName="space-y-2">
          <h2 className="font-pixel text-[11px] leading-relaxed">{activity.title}</h2>
          <p className="font-body text-sm font-bold">{activity.prompt}</p>
          {[...activity.objectives.programming, ...activity.objectives.security].length > 0 && (
            <ul className="list-disc pl-5 font-body text-sm font-bold">
              {activity.objectives.programming.map((o) => (
                <li key={o}>Programming: {o}</li>
              ))}
              {activity.objectives.security.map((o) => (
                <li key={o}>Security: {o}</li>
              ))}
            </ul>
          )}
          {activity.provenance && (
            <p className="text-xs text-muted-foreground">
              Source: {activity.provenance.source}. Reviewed {activity.provenance.reviewedAt}.
            </p>
          )}
          <ul className="font-mono text-sm">
            {activity.visibleExamples.map((example) => (
              <li key={example.input}>
                Example: input {JSON.stringify(example.input)} → output{" "}
                {JSON.stringify(example.expected)}
              </li>
            ))}
          </ul>
        </Window>
      )}

      <Window title="Code" bodyClassName="space-y-2">
        <Y2kTextarea
          id="code-input"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          spellCheck={false}
          className="min-h-64 font-mono text-sm"
        />
      </Window>

      <Window title="Standard input (optional — for programs that read input)" bodyClassName="space-y-2">
        <Y2kTextarea
          id="stdin-input"
          value={stdin}
          onChange={(event) => setStdin(event.target.value)}
          spellCheck={false}
          className="min-h-16 font-mono text-sm"
        />
      </Window>

      <div className="flex flex-wrap items-center gap-3">
        <Y2kButton onClick={handleRun} disabled={isRunning}>
          {isRunning ? "RUNNING…" : "RUN"}
        </Y2kButton>
        {activityId !== undefined && (
          <Y2kButton onClick={handleSubmit} disabled={isRunning || !activity}>
            Submit for grading
          </Y2kButton>
        )}
        <Y2kButton variant="secondary" onClick={() => setResetOpen(true)}>
          RESET
        </Y2kButton>
        <span aria-live="polite" className="sr-only">
          {isRunning ? "Running your code" : ""}
        </span>
      </div>

      {isRunning && <Progress value={60} label="Running" />}

      {runError && (
        <Y2kAlert
          open
          onOpenChange={() => setRunError(null)}
          title="Error"
          icon="alert"
          actions={
            <Y2kButton variant="primary" onClick={() => setRunError(null)}>
              OK
            </Y2kButton>
          }
        >
          {runError}
        </Y2kAlert>
      )}

      {attempt && <AttemptPanel attempt={attempt} />}

      {result && (
        <div aria-live="polite">
          <OutputPanel
            result={result}
            learnerElapsedTimeMs={learnerElapsedTimeMs}
          />
        </div>
      )}

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset"
        message="Restore starter code?"
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={handleReset}
      />
    </div>
  );
}
