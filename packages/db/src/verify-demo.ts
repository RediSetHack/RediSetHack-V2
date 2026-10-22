// E2E check against a running Piston: every demo coding activity's reference solution must pass all checks
// (graded like the API: trimmed stdout), and its untouched starter must not. Run: pnpm --filter @repo/db db:verify:demo
import { fileURLToPath } from "node:url";
import { DEMO_CODING } from "./demo-content.js";

for (const rel of ["../../.env", "../../../.env"]) {
  try {
    process.loadEnvFile(fileURLToPath(new URL(rel, import.meta.url)));
    if (process.env.CODE_EXECUTION_API_URL) break;
  } catch {
    // try next
  }
}
const base = (process.env.CODE_EXECUTION_API_URL ?? "http://localhost:2000/api/v2").trim();
const LANG: Record<string, string> = { cpp: "c++", c: "c", python: "python", javascript: "javascript", java: "java" };
const norm = (s: string) => s.trim().replace(/\r\n/g, "\n");

async function run(language: string, code: string, stdin: string) {
  const res = await fetch(`${base}/execute`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ language: LANG[language], version: "*", files: [{ content: code }], stdin }),
  });
  if (!res.ok) throw new Error(`Piston ${res.status}: ${await res.text()}`);
  const j = (await res.json()) as { run?: { stdout: string; code: number }; compile?: { stderr: string; code: number } };
  return { out: j.run?.stdout ?? "", err: j.compile?.code ? j.compile.stderr : "" };
}

let failed = 0;
for (const a of DEMO_CODING) {
  const checks = [...a.examples, ...a.hidden];
  const grade = async (code: string) => {
    let ok = 0;
    for (const c of checks) {
      const r = await run(a.language, code, c.input);
      if (!r.err && norm(r.out) === norm(c.expected)) ok++;
    }
    return ok;
  };
  const solved = await grade(a.solution);
  const starter = await grade(a.starter);
  const good = solved === checks.length && starter < checks.length;
  if (!good) failed++;
  console.log(`${good ? "PASS" : "FAIL"} ${a.id} (${a.language}): solution ${solved}/${checks.length}, starter ${starter}/${checks.length}`);
}
process.exit(failed ? 1 : 0);
