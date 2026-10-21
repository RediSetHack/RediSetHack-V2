import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn() }),
}));

import {
  ActivityPanel,
  AttemptPanel,
  CodeEditor,
  CodelabEditor,
  OutputWindow,
  RunControls,
} from "./codelab-editor";

const cleanRun = {
  stdout: "Hello, world!\n",
  stderr: "",
  exitCode: 0,
  executionTimeMs: 42,
  requestDurationMs: 120,
  failureType: "none" as const,
};

describe("OutputWindow", () => {
  it("shows the run time and stdout for a clean exit", () => {
    const markup = renderToStaticMarkup(<OutputWindow result={cleanRun} />);

    expect(markup).toContain("Ran in 42ms");
    expect(markup).toContain("Hello, world!");
    expect(markup).not.toContain("Program produced no output.");
  });

  it("shows the exit code and colours stderr as danger", () => {
    const markup = renderToStaticMarkup(
      <OutputWindow
        result={{
          ...cleanRun,
          stdout: "",
          stderr: "Traceback: boom",
          exitCode: 1,
          failureType: "runtime",
        }}
      />,
    );

    expect(markup).toContain("Program exited with code 1");
    expect(markup).toContain("Traceback: boom");
    expect(markup).toContain("text-btn-danger");
    expect(markup).not.toContain("Program produced no output.");
  });

  it("shows the empty-output copy when nothing was printed", () => {
    const markup = renderToStaticMarkup(
      <OutputWindow
        result={{ ...cleanRun, stdout: "", stderr: "" }}
      />,
    );

    expect(markup).toContain("Ran in 42ms");
    expect(markup).toContain("Program produced no output.");
  });
});

describe("CodeEditor", () => {
  it("renders a line-number gutter beside the editable code", () => {
    const markup = renderToStaticMarkup(
      <CodeEditor
        id="code-input"
        label="Code"
        value={'print("a")\nprint("b")'}
        onChange={() => {}}
      />,
    );

    expect(markup).toContain('data-testid="code-gutter"');
    // Two lines of code, numbered 1 and 2.
    expect(markup).toContain(">1</div>");
    expect(markup).toContain(">2</div>");
    expect(markup).toContain('aria-label="Code"');
    expect(markup).toContain("print(&quot;a&quot;)");
  });

  it("keeps the editor at least 256px high", () => {
    const markup = renderToStaticMarkup(
      <CodeEditor id="code-input" label="Code" value="x" onChange={() => {}} />,
    );

    expect(markup).toContain("min-h-64");
    expect(markup).toContain("height:256px");
  });
});

describe("RunControls", () => {
  it("enables RUN and shows no progress bar while idle", () => {
    const markup = renderToStaticMarkup(
      <RunControls isRunning={false} onRun={() => {}} onReset={() => {}} />,
    );

    expect(markup).toContain("RUN");
    expect(markup).not.toContain("RUNNING");
    expect(markup).not.toContain('role="progressbar"');
    // The button classes mention "disabled:" — match the attribute itself.
    expect(markup).not.toMatch(/<button[^>]*\sdisabled=""/);
  });

  it("disables RUN and shows the marching bar while running", () => {
    const markup = renderToStaticMarkup(
      <RunControls isRunning onRun={() => {}} onReset={() => {}} />,
    );

    expect(markup).toContain("RUNNING…");
    expect(markup).toMatch(/<button[^>]*\sdisabled=""/);
    expect(markup).toContain('role="progressbar"');
    expect(markup).toContain("y2k-progress-indeterminate");
    expect(markup).toContain("Running your code");
  });

  it("offers the grading button only for a coding activity", () => {
    const withActivity = renderToStaticMarkup(
      <RunControls
        isRunning={false}
        canSubmit
        onRun={() => {}}
        onSubmit={() => {}}
        onReset={() => {}}
      />,
    );
    const withoutActivity = renderToStaticMarkup(
      <RunControls isRunning={false} onRun={() => {}} onReset={() => {}} />,
    );

    expect(withActivity).toContain("SUBMIT FOR GRADING");
    expect(withoutActivity).not.toContain("SUBMIT FOR GRADING");
  });
});

describe("ActivityPanel and AttemptPanel", () => {
  it("shows the activity prompt and the graded result in the same window style", () => {
    const activity = renderToStaticMarkup(
      <ActivityPanel
        activity={{
          id: 4,
          stageId: 2,
          title: "Reverse a string",
          prompt: "Return the reversed input.",
          language: "python",
          starterCode: "def reverse(s):\n    pass",
          difficulty: "beginner",
          objectives: { programming: ["Loops"], security: [] },
          provenance: null,
          visibleExamples: [{ input: "abc", expected: "cba" }],
          passingScore: 80,
          xpReward: 40,
        }}
      />,
    );
    const attempt = renderToStaticMarkup(
      <AttemptPanel
        attempt={{
          id: "8f0f5a2c-0f5a-4c2b-9c1a-2b3c4d5e6f70",
          activityId: 4,
          score: 100,
          passed: true,
          errorCategory: "none",
          checksPassed: 2,
          checksTotal: 2,
          visibleResults: [
            { input: "abc", expected: "cba", actual: "cba", passed: true },
          ],
          elapsedMs: 120,
          xpAwarded: 40,
          code: "def reverse(s):\n    return s[::-1]",
          submittedAt: "2026-10-21T00:00:00.000Z",
        }}
      />,
    );

    expect(activity).toContain("CODING ACTIVITY");
    expect(activity).toContain("Return the reversed input.");
    expect(attempt).toContain("GRADED RESULT");
    expect(attempt).toContain("Passed");
    expect(attempt).toContain("40 XP");
  });
});

describe("CodelabEditor", () => {
  it("renders the Codelab window with every language and the code field", () => {
    const markup = renderToStaticMarkup(
      <CodelabEditor apiUrl="http://localhost:3001" />,
    );

    expect(markup).toContain("CODELAB.EXE");
    expect(markup).toContain("Codelab");
    expect(markup).toContain("Python");
    expect(markup).toContain("JavaScript");
    expect(markup).toContain("C++");
    expect(markup).toContain("Java");
    expect(markup).toContain("Standard input (optional — for programs that read input)");
    expect(markup).toContain('aria-label="Code"');
    expect(markup).toContain("RUN");
    expect(markup).toContain("RESET");
  });
});
