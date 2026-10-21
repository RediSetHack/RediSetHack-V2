"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
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
  CODELAB_LANGUAGES,
  codeAfterLanguageChange,
  executionStatusLabel,
  hasExecutionOutput,
  isLanguage,
  isSessionExpired,
  isUntouchedCode,
  languageLabel,
  starterFor,
  type SessionStarter,
} from "@/lib/codelab";
import { ConfirmDialog, ErrorAlert, Y2kAlert } from "@/components/y2k-dialog";
import {
  FieldLabel,
  Progress,
  Window,
  XPChip,
  Y2kButton,
  Y2kSelect,
  Y2kTextarea,
  buttonClasses,
} from "@/components/y2k";

/** The editor's line box — the gutter and the textarea share it so the
 *  numbers stay aligned with the code. */
const LINE_HEIGHT_PX = 24;
/** Textarea padding (8px top + 8px bottom). */
const EDITOR_PADDING_PX = 16;
/** PAGES.md §12: the code editor is at least 256px high. */
const MIN_EDITOR_HEIGHT_PX = 256;
/** Past this the editor scrolls instead of growing further. */
const MAX_EDITOR_HEIGHT_PX = 640;

const CATEGORY_MESSAGE: Record<CodingAttempt["errorCategory"], string> = {
  none: "All checks passed.",
  wrong_answer: "Some checks produced the wrong output.",
  compile: "Your code did not compile.",
  runtime: "Your code crashed on a check.",
  timeout: "Your code took too long to run. Try a faster approach.",
};

/**
 * The code field: a monospace textarea with a line-number gutter. The gutter
 * is decorative (`aria-hidden`) — the textarea carries the value — and it
 * scrolls with the code so the numbers stay beside their lines.
 *
 * The gutter is given the same definite height as the textarea: left to size
 * itself it would inflate the row and stop scrolling, leaving the numbers
 * stuck at 1..n while the code scrolled on. `wrap="off"` keeps one logical
 * line on one visual row, which is what the gutter counts.
 */
export function CodeEditor({
  id,
  value,
  onChange,
  label,
}: Readonly<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
}>) {
  const gutterRef = useRef<HTMLDivElement>(null);
  const lineCount = useMemo(
    () => Math.max(1, value.split("\n").length),
    [value],
  );
  const height = Math.min(
    MAX_EDITOR_HEIGHT_PX,
    Math.max(MIN_EDITOR_HEIGHT_PX, lineCount * LINE_HEIGHT_PX + EDITOR_PADDING_PX),
  );

  return (
    <div className="flex border-2 border-border bg-white shadow-[2px_2px_0_var(--border)] focus-within:shadow-[2px_2px_0_var(--sparkle)]">
      <div
        ref={gutterRef}
        aria-hidden="true"
        data-testid="code-gutter"
        style={{ height: `${height}px` }}
        className="w-12 shrink-0 overflow-hidden border-r-2 border-border bg-title-bar py-2 pr-2 text-right font-mono text-sm leading-6 text-muted-foreground select-none"
      >
        {Array.from({ length: lineCount }, (_, index) => (
          <div key={index} className="leading-6">
            {index + 1}
          </div>
        ))}
      </div>
      <textarea
        id={id}
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onScroll={(event) => {
          if (gutterRef.current) {
            gutterRef.current.scrollTop = event.currentTarget.scrollTop;
          }
        }}
        spellCheck={false}
        wrap="off"
        style={{ height: `${height}px` }}
        className="min-h-64 w-full resize-none bg-white px-3 py-2 font-mono text-sm leading-6 text-foreground outline-none"
      />
    </div>
  );
}

/**
 * The output window: its header says how the run went, its body carries
 * stdout and stderr. stderr carries the danger colour.
 */
export function OutputWindow({
  result,
  learnerElapsedTimeMs,
}: Readonly<{ result: CodeExecutionResult; learnerElapsedTimeMs: number }>) {
  const empty = !hasExecutionOutput(result);

  return (
    <Window
      title={executionStatusLabel(result)}
      bodyClassName="space-y-2 font-mono text-sm"
    >
      <div className="font-body text-xs font-bold text-muted-foreground">
        Request: {result.requestDurationMs}ms · Total: {learnerElapsedTimeMs}ms
      </div>
      {empty && (
        <p className="font-body text-sm font-bold text-muted-foreground">
          Program produced no output.
        </p>
      )}
      {result.stdout.length > 0 && (
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-foreground">
          {result.stdout}
        </pre>
      )}
      {result.stderr.length > 0 && (
        <pre
          role="alert"
          className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-btn-danger"
        >
          {result.stderr}
        </pre>
      )}
    </Window>
  );
}

/**
 * RUN / SUBMIT / RESET and the marching bar. Split out from the editor so
 * the busy state can be rendered — and asserted — on its own.
 */
export function RunControls({
  isRunning,
  canSubmit = false,
  onRun,
  onSubmit,
  onReset,
}: Readonly<{
  isRunning: boolean;
  canSubmit?: boolean;
  onRun: () => void;
  onSubmit?: () => void;
  onReset: () => void;
}>) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Y2kButton onClick={onRun} disabled={isRunning}>
          {isRunning ? "RUNNING…" : "RUN"}
        </Y2kButton>
        {canSubmit && (
          <Y2kButton onClick={onSubmit} disabled={isRunning}>
            SUBMIT FOR GRADING
          </Y2kButton>
        )}
        {/* Reset is blocked while a run is in flight: swapping the code under a
            running program would leave the output describing code that is no
            longer on screen. */}
        <Y2kButton variant="secondary" onClick={onReset} disabled={isRunning}>
          RESET
        </Y2kButton>
      </div>
      {/* The live region stays mounted so the change to "running" is announced. */}
      <div aria-live="polite" className="space-y-1">
        {isRunning && (
          <>
            <Progress indeterminate label="Running your code" />
            <p className="font-body text-xs font-bold text-muted-foreground">
              Running your code…
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** The graded outcome of a coding activity, in the same window style. */
export function AttemptPanel({
  attempt,
}: Readonly<{ attempt: CodingAttempt }>) {
  return (
    <Window title="GRADED RESULT" bodyClassName="space-y-2 text-sm">
      <p className="block font-body font-bold">
        {attempt.passed ? "Passed" : "Not yet"} — {attempt.checksPassed}/
        {attempt.checksTotal} checks ({attempt.score}%).{" "}
        {CATEGORY_MESSAGE[attempt.errorCategory]}
      </p>
      {attempt.xpAwarded > 0 && (
        <div className="flex items-center gap-2">
          <XPChip xp={attempt.xpAwarded} />
          <span className="font-body font-bold text-foreground">earned</span>
        </div>
      )}
      <ul className="font-mono">
        {attempt.visibleResults.map((r) => (
          <li key={r.input}>
            {r.passed ? "OK" : "FAIL"} input {JSON.stringify(r.input)}: expected{" "}
            {JSON.stringify(r.expected)}, got {JSON.stringify(r.actual.trim())}
          </li>
        ))}
      </ul>
      <p className="font-body text-xs font-bold text-muted-foreground">
        Hidden checks are not shown. Sandbox time: {attempt.elapsedMs}ms.
      </p>
    </Window>
  );
}

/** The coding activity's prompt, in the same window style as the result. */
export function ActivityPanel({
  activity,
}: Readonly<{ activity: CodingActivity }>) {
  const objectives = [
    ...activity.objectives.programming,
    ...activity.objectives.security,
  ];

  return (
    <Window title="CODING ACTIVITY" bodyClassName="space-y-2">
      <h2 className="font-pixel text-[11px] leading-relaxed text-foreground">
        {activity.title}
      </h2>
      <p className="font-body text-sm font-bold text-foreground">
        {activity.prompt}
      </p>
      {objectives.length > 0 && (
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
        <p className="font-body text-xs font-bold text-muted-foreground">
          Source: {activity.provenance.source}. Reviewed{" "}
          {activity.provenance.reviewedAt}.
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
  );
}

interface CodelabEditorProps {
  readonly apiUrl: string;
  readonly initialLanguage?: string;
  readonly initialCode?: string;
  /** When set, the editor opens that graded activity and offers "Submit for grading". */
  readonly activityId?: number;
}

export function CodelabEditor({
  apiUrl,
  initialLanguage,
  initialCode,
  activityId,
}: CodelabEditorProps) {
  const { getToken } = useAuth();
  const startingLanguage: Language = isLanguage(initialLanguage)
    ? initialLanguage
    : "python";
  const initialStarter: SessionStarter | null =
    initialCode !== undefined
      ? { language: startingLanguage, code: initialCode }
      : null;

  // The language the code on screen is written in. It only follows the
  // select while the code is untouched — edited code keeps the language it
  // was written in, so RUN never executes it under the wrong one.
  const [codeLanguage, setCodeLanguage] = useState<Language>(startingLanguage);
  const [code, setCode] = useState(() =>
    starterFor(startingLanguage, initialStarter),
  );
  const [sessionStarter, setSessionStarter] =
    useState<SessionStarter | null>(initialStarter);
  const [languageNote, setLanguageNote] = useState<string | null>(null);
  const [stdin, setStdin] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<{
    title: string;
    message: string;
    detail?: string;
  } | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [result, setResult] = useState<CodeExecutionResult | null>(null);
  const [learnerElapsedTimeMs, setLearnerElapsedTimeMs] = useState(0);
  const [activity, setActivity] = useState<CodingActivity | null>(null);
  const [attempt, setAttempt] = useState<CodingAttempt | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

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
        setCodeLanguage(loaded.language);
        setCode(loaded.starterCode);
        setSessionStarter({ language: loaded.language, code: loaded.starterCode });
      } catch (err) {
        if (cancelled) return;
        if (isSessionExpired(err)) {
          setSessionExpired(true);
          return;
        }
        setError({
          title: "COULD NOT OPEN ACTIVITY",
          message:
            err instanceof Error
              ? err.message
              : "Could not open this activity.",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId, apiUrl, getToken]);

  function handleLanguageChange(next: Language) {
    const untouched = isUntouchedCode(code, codeLanguage, sessionStarter);
    setCode(codeAfterLanguageChange(code, codeLanguage, next, sessionStarter));
    if (untouched) {
      // A fresh or untouched editor follows to the new language's starter.
      setCodeLanguage(next);
      setLanguageNote(null);
    } else {
      // The learner's code stays — and it stays in the language it was
      // written in, so RUN never executes it under the wrong one.
      const label = languageLabel(codeLanguage);
      setLanguageNote(
        `Your code is still ${label}, so the language stayed ${label}. RESET starts over with the ${label} starter.`,
      );
    }
    // The output and the grade described the previous code.
    setResult(null);
    setAttempt(null);
  }

  function handleReset() {
    setCode(starterFor(codeLanguage, sessionStarter));
    setLanguageNote(null);
    setResult(null);
    setAttempt(null);
  }

  async function handleSubmit() {
    if (activityId === undefined) return;
    setIsRunning(true);
    setError(null);
    setAttempt(null);
    try {
      const token = await getToken();
      if (!token) {
        setSessionExpired(true);
        return;
      }
      setAttempt(await submitCodingAttempt(apiUrl, token, activityId, code));
    } catch (err) {
      if (isSessionExpired(err)) {
        setSessionExpired(true);
        return;
      }
      setError({
        title: "GRADING FAILED",
        message:
          err instanceof Error
            ? err.message
            : "Grading failed. Your code is still here — try again.",
      });
    } finally {
      setIsRunning(false);
    }
  }

  async function handleRun() {
    const startedAt = performance.now();
    setIsRunning(true);
    setError(null);
    setResult(null);
    setLearnerElapsedTimeMs(0);
    try {
      const token = await getToken();
      if (!token) {
        setSessionExpired(true);
        return;
      }
      const execution = await executeCode(apiUrl, token, {
        language: codeLanguage,
        code,
        stdin,
      });
      setResult(execution);
      setLearnerElapsedTimeMs(Math.round(performance.now() - startedAt));
    } catch (err) {
      // The editor's inputs are left untouched — a failed run never discards
      // the learner's code.
      if (isSessionExpired(err)) {
        setSessionExpired(true);
        return;
      }
      setError({
        title: "EXECUTION FAILED",
        message: "Code execution failed. Your code is still here — try again.",
        detail: err instanceof Error ? err.message : "Unknown execution error.",
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="space-y-6">
      <Window title="CODELAB.EXE">
        <h1 className="font-pixel text-lg leading-relaxed text-foreground">
          Codelab
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <FieldLabel htmlFor="language-select">Language</FieldLabel>
          <div className="w-full max-w-xs sm:w-64">
            <Y2kSelect
              id="language-select"
              value={codeLanguage}
              // A graded activity fixes its own language — switching would
              // submit code in a language the checks were never written for.
              disabled={activity !== null}
              onChange={(event) => {
                const next = event.target.value;
                if (isLanguage(next)) handleLanguageChange(next);
              }}
            >
              {CODELAB_LANGUAGES.map((languageOption) => (
                <option key={languageOption.id} value={languageOption.id}>
                  {languageOption.label}
                </option>
              ))}
            </Y2kSelect>
          </div>
        </div>
        {languageNote && (
          <p
            role="status"
            className="mt-2 font-body text-xs font-bold text-muted-foreground"
          >
            {languageNote}
          </p>
        )}
      </Window>

      {activity && <ActivityPanel activity={activity} />}

      <Window title="CODE" bodyClassName="space-y-2">
        <FieldLabel htmlFor="code-input">Code</FieldLabel>
        <CodeEditor
          id="code-input"
          label="Code"
          value={code}
          onChange={setCode}
        />
      </Window>

      <Window title="STDIN" bodyClassName="space-y-2">
        <FieldLabel htmlFor="stdin-input">
          Standard input (optional — for programs that read input)
        </FieldLabel>
        <Y2kTextarea
          id="stdin-input"
          value={stdin}
          onChange={(event) => setStdin(event.target.value)}
          spellCheck={false}
          className="min-h-20 font-mono text-sm leading-6"
        />
      </Window>

      <RunControls
        isRunning={isRunning}
        canSubmit={activityId !== undefined}
        onRun={() => void handleRun()}
        onSubmit={() => void handleSubmit()}
        onReset={() => setResetOpen(true)}
      />

      {error && (
        <ErrorAlert
          title={error.title}
          message={error.message}
          detail={error.detail}
          onRetry={activityId !== undefined ? undefined : () => void handleRun()}
          retryLabel="TRY AGAIN"
        />
      )}

      {/* The live region stays mounted so the result is announced when it lands. */}
      <div aria-live="polite" className="space-y-6">
        {attempt && <AttemptPanel attempt={attempt} />}
        {result && (
          <OutputWindow
            result={result}
            learnerElapsedTimeMs={learnerElapsedTimeMs}
          />
        )}
      </div>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset"
        message="Restore starter code? Your edits will be lost."
        confirmLabel="Reset"
        cancelLabel="Cancel"
        onConfirm={handleReset}
      />

      <Y2kAlert
        open={sessionExpired}
        onOpenChange={setSessionExpired}
        title="SESSION EXPIRED"
        icon="alert"
        actions={
          <Link href="/sign-in" className={buttonClasses("primary")}>
            SIGN IN
          </Link>
        }
      >
        Your session expired. Sign in again to keep running code — your code is
        still here.
      </Y2kAlert>
    </div>
  );
}
