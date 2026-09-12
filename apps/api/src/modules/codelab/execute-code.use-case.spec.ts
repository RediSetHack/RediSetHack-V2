import { describe, expect, it, vi } from "vitest";

import { CodeExecutionPort, ExecutionResult } from "./domain/ports/code-execution.port.js";
import { UnsupportedLanguageError } from "./domain/errors.js";
import { ExecuteCodeUseCase } from "./application/execute-code.use-case.js";

const okResult: ExecutionResult = { stdout: "hi\n", stderr: "", exitCode: 0, executionTimeMs: 42 };

describe("ExecuteCodeUseCase", () => {
  it("forwards a supported-language request to the execution provider", async () => {
    const codeExecution: CodeExecutionPort = { execute: vi.fn().mockResolvedValue(okResult) };
    const useCase = new ExecuteCodeUseCase(codeExecution);

    const result = await useCase.execute({ language: "python", code: "print('hi')", stdin: "" });

    expect(codeExecution.execute).toHaveBeenCalledWith({
      language: "python",
      code: "print('hi')",
      stdin: "",
    });
    expect(result).toEqual(okResult);
  });

  it("defaults stdin to an empty string when omitted", async () => {
    const codeExecution: CodeExecutionPort = { execute: vi.fn().mockResolvedValue(okResult) };
    const useCase = new ExecuteCodeUseCase(codeExecution);

    await useCase.execute({ language: "javascript", code: "console.log(1)" });

    expect(codeExecution.execute).toHaveBeenCalledWith(
      expect.objectContaining({ stdin: "" }),
    );
  });

  it.each(["cpp", "c", "python", "javascript", "java"])(
    "accepts the supported language %s",
    async (language) => {
      const codeExecution: CodeExecutionPort = { execute: vi.fn().mockResolvedValue(okResult) };
      const useCase = new ExecuteCodeUseCase(codeExecution);

      await expect(useCase.execute({ language, code: "x" })).resolves.toEqual(okResult);
    },
  );

  it("rejects an unsupported language before calling the provider", async () => {
    const codeExecution: CodeExecutionPort = { execute: vi.fn() };
    const useCase = new ExecuteCodeUseCase(codeExecution);

    await expect(
      useCase.execute({ language: "ruby", code: "puts 1" }),
    ).rejects.toBeInstanceOf(UnsupportedLanguageError);
    expect(codeExecution.execute).not.toHaveBeenCalled();
  });

  it("propagates provider errors (simulated execution failure)", async () => {
    const codeExecution: CodeExecutionPort = {
      execute: vi.fn().mockRejectedValue(new Error("provider unavailable")),
    };
    const useCase = new ExecuteCodeUseCase(codeExecution);

    await expect(useCase.execute({ language: "c", code: "int main(){}" })).rejects.toThrow(
      "provider unavailable",
    );
  });
});
