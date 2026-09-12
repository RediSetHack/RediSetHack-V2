import { ConfigService } from "@nestjs/config";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PistonCodeExecutionService } from "./infrastructure/piston-code-execution.service.js";

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: () => Promise.resolve(body), text: () => Promise.resolve(JSON.stringify(body)) };
}

describe("PistonCodeExecutionService", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("builds the provider request payload from the execution request", async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ run: { stdout: "hi\n", stderr: "", code: 0 } }));
    vi.stubGlobal("fetch", fetchMock);
    const config = { get: vi.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new PistonCodeExecutionService(config);

    await service.execute({ language: "cpp", code: "int main(){}", stdin: "5\n" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://emkc.org/api/v2/piston/execute",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          language: "c++",
          version: "*",
          files: [{ content: "int main(){}" }],
          stdin: "5\n",
        }),
      }),
    );
  });

  it("parses a successful run result", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(jsonResponse({ run: { stdout: "hi\n", stderr: "", code: 0 } })),
    );
    const config = { get: vi.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new PistonCodeExecutionService(config);

    const result = await service.execute({ language: "python", code: "print('hi')", stdin: "" });

    expect(result.stdout).toBe("hi\n");
    expect(result.stderr).toBe("");
    expect(result.exitCode).toBe(0);
    expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
  });

  it("combines compile and run stderr for a failed compile", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          compile: { stdout: "", stderr: "syntax error", code: 1 },
          run: { stdout: "", stderr: "", code: null },
        }),
      ),
    );
    const config = { get: vi.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new PistonCodeExecutionService(config);

    const result = await service.execute({ language: "java", code: "broken", stdin: "" });

    expect(result.stderr).toBe("syntax error");
    expect(result.exitCode).toBe(1);
  });

  it("throws when the provider responds with an error status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(jsonResponse({}, false, 500)));
    const config = { get: vi.fn().mockReturnValue(undefined) } as unknown as ConfigService;
    const service = new PistonCodeExecutionService(config);

    await expect(service.execute({ language: "c", code: "x", stdin: "" })).rejects.toThrow(
      /Code execution provider request failed/,
    );
  });
});
