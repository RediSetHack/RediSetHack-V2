import { fileURLToPath } from "node:url";
import { eq, sql } from "drizzle-orm";
import { characters, codingActivities, ctfChallenges, sideQuests, stages } from "./schema/index.js";
import { createDb } from "./index.js";
import { SECURE_DEV_ACTIVITY, SECURE_DEV_LESSON, SECURE_DEV_STAGE_SLUG } from "./secure-dev-content.js";

for (const rel of ["../../.env", "../../../.env", "./.env"]) {
  try {
    process.loadEnvFile(fileURLToPath(new URL(rel, import.meta.url)));
    if (process.env.DATABASE_URL) break;
  } catch {
    // try next
  }
}

export const DEFAULT_CHARACTERS = [
  {
    id: 1,
    name: "Binary Knight",
    slug: "binary-knight",
    description: "Resilient defender of algorithms and clean code.",
  },
  {
    id: 2,
    name: "Code Wizard",
    slug: "code-wizard",
    description: "Master of abstractions, functional spells, and recursion.",
  },
  {
    id: 3,
    name: "Cyber Rogue",
    slug: "cyber-rogue",
    description: "Stealthy bug hunter and security operative.",
  },
  {
    id: 4,
    name: "DevOps Alchemist",
    slug: "devops-alchemist",
    description: "Transmuter of code into scalable cloud infrastructure.",
  },
  {
    id: 5,
    name: "Script Samurai",
    slug: "script-samurai",
    description: "Swift executor of clean syntax and precision tests.",
  },
] as const;

export async function seed(databaseUrl?: string) {
  const url = databaseUrl ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }

  const db = createDb(url);
  console.log("Seeding default characters into database...");

  for (const char of DEFAULT_CHARACTERS) {
    await db
      .insert(characters)
      .values({
        id: char.id,
        name: char.name,
        slug: char.slug,
        description: char.description,
      })
      .onConflictDoUpdate({
        target: characters.id,
        set: {
          name: char.name,
          slug: char.slug,
          description: char.description,
        },
      });
  }

  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('characters', 'id'), coalesce(max(id), 1)) FROM characters;`,
  );

  const [stage] = await db.select().from(stages).where(eq(stages.slug, "read-the-signal")).limit(1);
  if (stage) {
    const [activity] = await db.insert(codingActivities).values({
      stageId: stage.id,
      authoringId: "signal-uppercase",
      title: "Uppercase the signal",
      prompt: "Read a message and print it in uppercase.",
      language: "python",
      starterCode: "message = input()\n",
      competencyIds: ["programming.control-flow"],
      difficulty: "beginner",
      visibleExamples: [{ input: "hello", expected: "HELLO" }],
      hiddenChecks: [{ input: "signal received", expected: "SIGNAL RECEIVED" }],
      passingScore: 100,
      xpReward: 10,
      contentVersion: "1",
    }).onConflictDoUpdate({
      target: codingActivities.authoringId,
      set: { stageId: stage.id, title: "Uppercase the signal", prompt: "Read a message and print it in uppercase.", language: "python", starterCode: "message = input()\n", competencyIds: ["programming.control-flow"], difficulty: "beginner", visibleExamples: [{ input: "hello", expected: "HELLO" }], hiddenChecks: [{ input: "signal received", expected: "SIGNAL RECEIVED" }], passingScore: 100, xpReward: 10, contentVersion: "1", archivedAt: null },
    }).returning();
    await db.update(stages).set({
      lessonContent: (stage.lessonContent as { type: string; [key: string]: unknown }[] ?? []).map((block) =>
        block.type === "exercise" ? { ...block, activityId: activity!.id } : block,
      ),
    }).where(eq(stages.id, stage.id));

    // Controlled CTF: the artifact below is the entire scope; nothing external is attacked.
    const ctf = {
      stageId: stage.id,
      authoringId: "ctf-log-forensics-1",
      title: "The quiet log line",
      category: "forensics",
      difficulty: "beginner" as const,
      competencyIds: ["programming.control-flow"],
      brief: "A rover's telemetry log was captured offline. One line carries a base64-encoded flag in the form RSH{...}. Inspect the log, decode it locally, and submit the flag. No network access to any system is needed or allowed.",
      artifactName: "rover-telemetry.log",
      artifact: [
        "2026-03-02T08:00:01Z INFO  boot sequence ok",
        "2026-03-02T08:00:04Z INFO  battery=97% temp=21C",
        "2026-03-02T08:00:09Z WARN  sensor drift on axis-y",
        "2026-03-02T08:00:12Z DEBUG beacon=UlNIe3RydXN0X2J1dF92ZXJpZnlfdGhlX2xvZ30=",
        "2026-03-02T08:00:15Z INFO  uplink idle",
        "",
      ].join("\n"),
      // sha256 of the flag; the plaintext flag is never stored.
      flagHash: "dbfd2aa26dd5cff48c9de5167aa013e770a0d6b16b3cb7c2698fa0d720518fb9",
      xpReward: 25,
      contentVersion: "1",
    };
    const [challenge] = await db.insert(ctfChallenges).values(ctf).onConflictDoUpdate({
      target: ctfChallenges.authoringId,
      set: { ...ctf, archivedAt: null },
    }).returning();

    // Optional Side Quest reusing the CTF challenge above; unlocked after the coding activity.
    const sideQuest = {
      authoringId: "side-quest-quiet-log",
      title: "Side Quest: Trace the quiet log",
      summary: "An optional forensics detour: recover the hidden flag from a rover telemetry log.",
      brief: "Open the designated challenge, inspect the log artifact offline, and submit the flag. The main story never waits on this.",
      activityType: "ctf" as const,
      activityId: challenge!.id,
      prerequisites: [{ type: "level", minLevel: 1 }, { type: "activity", activityType: "coding", activityId: activity!.id }],
      xpReward: 15,
      contentVersion: "1",
    };
    await db.insert(sideQuests).values(sideQuest).onConflictDoUpdate({
      target: sideQuests.authoringId,
      set: { ...sideQuest, archivedAt: null },
    });
  }

  const [secureStage] = await db.select().from(stages).where(eq(stages.slug, SECURE_DEV_STAGE_SLUG)).limit(1);
  if (secureStage) {
    const { authoringId: _id, ...mutable } = SECURE_DEV_ACTIVITY;
    const [secure] = await db.insert(codingActivities).values({ stageId: secureStage.id, ...SECURE_DEV_ACTIVITY })
      .onConflictDoUpdate({ target: codingActivities.authoringId, set: { stageId: secureStage.id, ...mutable, archivedAt: null } }).returning();
    await db.update(stages).set({
      lessonContent: SECURE_DEV_LESSON.map((block) => (block.type === "exercise" ? { ...block, activityId: secure!.id } : block)),
    }).where(eq(stages.id, secureStage.id));
  }

  console.log("Seeded 5 characters and the sample coding activity when its Lesson exists!");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await seed();
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}
