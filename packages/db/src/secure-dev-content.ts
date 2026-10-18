// Reviewed secure-programming content for the "Treat Input as Untrusted" Stage of the sample Novel.
// Hidden checks live here only as authoring data; they are stored server-side and never serialized to learners.

const VULNERABLE = `import sqlite3

db = sqlite3.connect(":memory:")
db.execute("CREATE TABLE users (name TEXT, role TEXT)")
db.executemany("INSERT INTO users VALUES (?, ?)", [("alice", "member"), ("root", "admin")])

name = input()
row = db.execute(f"SELECT role FROM users WHERE name = '{name}'").fetchone()
print(row[0] if row else "no such user")
`;

export const SECURE_DEV_STAGE_SLUG = "treat-input-as-untrusted";

export const SECURE_DEV_PROVENANCE = {
  source: "OWASP Cheat Sheet Series: SQL Injection Prevention; CWE-89",
  url: "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
  license: "CC BY-SA 4.0 (concepts paraphrased; examples original)",
  author: "RediSetHack content team",
  reviewedBy: "RediSetHack secure-programming reviewer",
  reviewedAt: "2026-10-18",
};

export const SECURE_DEV_ACTIVITY = {
  authoringId: "signal-parameterized-lookup",
  title: "Repair the role lookup",
  prompt:
    "The relay looks up a caller's role by name, but it builds its SQL by pasting the name into the query. Repair it so the name is only ever treated as data. It must still return the right role for real users and print `no such user` for anything else.",
  language: "python",
  starterCode: VULNERABLE,
  competencyIds: ["security.input-validation", "security.secure-coding", "programming.fundamentals"],
  difficulty: "intermediate",
  objectives: {
    programming: ["Query a database with sqlite3 and read a single row."],
    security: ["Prevent SQL injection (CWE-89) by binding untrusted input as a query parameter."],
  },
  provenance: SECURE_DEV_PROVENANCE,
  visibleExamples: [
    { input: "alice", expected: "member" },
    { input: "mallory", expected: "no such user" },
  ],
  hiddenChecks: [
    { input: "root", expected: "admin" },
    { input: "x' OR '1'='1", expected: "no such user" },
    { input: "alice' --", expected: "no such user" },
  ],
  passingScore: 100,
  xpReward: 20,
  contentVersion: "1",
};

export const SECURE_DEV_LESSON = [
  {
    type: "text",
    content:
      "SQL injection (CWE-89) happens when untrusted text is pasted into a query, so the database cannot tell your instructions from the caller's data. A name like `x' OR '1'='1` then changes what the query means instead of being looked up as a name.",
  },
  {
    type: "code",
    language: "python",
    content: "# Insecure: the name becomes part of the SQL.\nrow = db.execute(f\"SELECT role FROM users WHERE name = '{name}'\").fetchone()",
  },
  {
    type: "code",
    language: "python",
    content: "# Safe: the name is bound as a parameter and is always data.\nrow = db.execute(\"SELECT role FROM users WHERE name = ?\", (name,)).fetchone()",
  },
  {
    type: "text",
    content:
      "Objectives. Programming: query a database and read one row. Security: bind untrusted input as a parameter instead of building SQL strings. Source: OWASP SQL Injection Prevention Cheat Sheet and CWE-89; reviewed 2026-10-18.",
  },
  { type: "exercise", language: SECURE_DEV_ACTIVITY.language, prompt: SECURE_DEV_ACTIVITY.prompt, starterCode: VULNERABLE },
] as { type: string; [key: string]: unknown }[];
