import { describe, expect, it } from "vitest";
import {
  CODELAB_LANGUAGES,
  codeAfterLanguageChange,
  executionStatusLabel,
  hasExecutionOutput,
  isLanguage,
  isSessionExpired,
  isUntouchedCode,
  languageLabel,
  starterCodeFor,
  starterFor,
  type SessionStarter,
} from "./codelab";

describe("CODELAB_LANGUAGES", () => {
  it("offers the five languages PAGES.md §12 lists, in order", () => {
    expect(CODELAB_LANGUAGES.map((l) => l.label)).toEqual([
      "Python",
      "JavaScript",
      "C++",
      "C",
      "Java",
    ]);
  });
});

describe("isLanguage", () => {
  it("accepts the supported languages and rejects anything else", () => {
    expect(isLanguage("python")).toBe(true);
    expect(isLanguage("java")).toBe(true);
    expect(isLanguage("rust")).toBe(false);
    expect(isLanguage(undefined)).toBe(false);
  });
});

describe("languageLabel", () => {
  it("names each language the way the select does", () => {
    expect(languageLabel("cpp")).toBe("C++");
    expect(languageLabel("javascript")).toBe("JavaScript");
  });
});

describe("isUntouchedCode", () => {
  it("treats the starter code and an empty field as untouched", () => {
    expect(isUntouchedCode(starterCodeFor("python"), "python")).toBe(true);
    expect(isUntouchedCode("", "python")).toBe(true);
  });

  it("treats edited code as touched", () => {
    expect(isUntouchedCode('print("mine")', "python")).toBe(false);
  });

  it("treats the session's own starter as untouched", () => {
    const sessionStarter: SessionStarter = {
      language: "python",
      code: "def reverse(s):\n    pass",
    };

    expect(
      isUntouchedCode("def reverse(s):\n    pass", "python", sessionStarter),
    ).toBe(true);
    expect(
      isUntouchedCode("def reverse(s):\n    return s[::-1]", "python", sessionStarter),
    ).toBe(false);
  });

  it("does not treat another language's session starter as untouched", () => {
    const sessionStarter: SessionStarter = { language: "python", code: "print(1)" };

    expect(isUntouchedCode("print(1)", "javascript", sessionStarter)).toBe(false);
  });
});

describe("starterFor", () => {
  it("prefers the session's starter for the language it belongs to", () => {
    const sessionStarter: SessionStarter = { language: "python", code: "print(1)" };

    expect(starterFor("python", sessionStarter)).toBe("print(1)");
    expect(starterFor("java", sessionStarter)).toBe(starterCodeFor("java"));
    expect(starterFor("python", null)).toBe(starterCodeFor("python"));
  });
});

describe("codeAfterLanguageChange", () => {
  it("swaps in the new starter when the code is untouched", () => {
    expect(codeAfterLanguageChange(starterCodeFor("python"), "python", "javascript")).toBe(
      starterCodeFor("javascript"),
    );
  });

  it("swaps in the new starter when the field is empty", () => {
    expect(codeAfterLanguageChange("", "python", "java")).toBe(
      starterCodeFor("java"),
    );
  });

  it("keeps code the learner wrote", () => {
    expect(
      codeAfterLanguageChange('print("mine")', "python", "javascript"),
    ).toBe('print("mine")');
  });

  it("keeps edited code even when it matches another language's starter", () => {
    expect(
      codeAfterLanguageChange(starterCodeFor("javascript"), "python", "java"),
    ).toBe(starterCodeFor("javascript"));
  });

  it("swaps in the new starter when the session's own starter is untouched", () => {
    const sessionStarter: SessionStarter = { language: "python", code: "print(1)" };

    expect(
      codeAfterLanguageChange("print(1)", "python", "javascript", sessionStarter),
    ).toBe(starterCodeFor("javascript"));
  });

  it("keeps the session's starter when switching back to its language", () => {
    const sessionStarter: SessionStarter = { language: "python", code: "print(1)" };

    expect(
      codeAfterLanguageChange(
        starterCodeFor("javascript"),
        "javascript",
        "python",
        sessionStarter,
      ),
    ).toBe("print(1)");
  });
});

describe("executionStatusLabel", () => {
  it("reports the run time for a clean exit", () => {
    expect(
      executionStatusLabel({
        failureType: "none",
        exitCode: 0,
        executionTimeMs: 42,
      }),
    ).toBe("Ran in 42ms");
  });

  it("reports the exit code for every failure kind", () => {
    for (const failureType of ["compile", "runtime", "timeout"]) {
      expect(
        executionStatusLabel({ failureType, exitCode: 1, executionTimeMs: 42 }),
      ).toBe("Program exited with code 1");
    }
  });
});

describe("hasExecutionOutput", () => {
  it("is false only when both streams are empty", () => {
    expect(hasExecutionOutput({ stdout: "", stderr: "" })).toBe(false);
    expect(hasExecutionOutput({ stdout: "hi", stderr: "" })).toBe(true);
    expect(hasExecutionOutput({ stdout: "", stderr: "boom" })).toBe(true);
  });
});

describe("isSessionExpired", () => {
  it("detects a 401 from the API", () => {
    expect(isSessionExpired({ status: 401 })).toBe(true);
  });

  it("ignores other failures and non-errors", () => {
    expect(isSessionExpired({ status: 500 })).toBe(false);
    expect(isSessionExpired(new Error("boom"))).toBe(false);
    expect(isSessionExpired(null)).toBe(false);
  });
});
