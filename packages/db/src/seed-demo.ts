import { fileURLToPath } from "node:url";
import { and, eq } from "drizzle-orm";
import { codingActivities, ctfChallenges, questOptions, questQuestions, quests, regions, sideQuests, stages, zones } from "./schema/index.js";
import { createDb } from "./index.js";
import { DEMO_CODING, DEMO_CTFS, DEMO_REGION, DEMO_SIDE_QUEST_BRIEF, DEMO_SIDE_QUESTS, DEMO_STAGES, DEMO_ZONES } from "./demo-content.js";

for (const rel of ["../../.env", "../../../.env", "./.env"]) {
  try {
    process.loadEnvFile(fileURLToPath(new URL(rel, import.meta.url)));
    if (process.env.DATABASE_URL) break;
  } catch {
    // try next
  }
}

// Idempotent: everything is keyed by slug / authoringId, so re-running refreshes content in place.
export async function seedDemo(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");
  const db = createDb(databaseUrl);

  const [region] = await db.insert(regions).values({ ...DEMO_REGION, sortOrder: 2 })
    .onConflictDoUpdate({ target: regions.slug, set: { ...DEMO_REGION, archivedAt: null } }).returning();

  const zoneIds: number[] = [];
  for (const [i, z] of DEMO_ZONES.entries()) {
    const [row] = await db.insert(zones).values({ ...z, regionId: region!.id, sortOrder: i + 1 })
      .onConflictDoUpdate({ target: [zones.regionId, zones.slug], set: { name: z.name, archivedAt: null } }).returning();
    zoneIds.push(row!.id);
  }

  const stageIds = new Map<string, number>();
  for (const [i, s] of DEMO_STAGES.entries()) {
    const values = { zoneId: zoneIds[s.zone]!, title: s.title, slug: s.slug, lessonContent: s.lesson, competencyIds: s.competencies, difficulty: s.difficulty, xpReward: s.xp, sortOrder: i + 1 };
    const [row] = await db.insert(stages).values(values)
      .onConflictDoUpdate({ target: [stages.zoneId, stages.slug], set: { ...values, archivedAt: null } }).returning();
    stageIds.set(s.slug, row!.id);

    // Quizzes have no stable key: key on (stage, title) and only build questions the first time.
    const title = `${s.title} Quiz`;
    let [quest] = await db.select().from(quests).where(and(eq(quests.stageId, row!.id), eq(quests.title, title))).limit(1);
    if (!quest) {
      [quest] = await db.insert(quests).values({ stageId: row!.id, title, description: `Check what you learned in ${s.title}.`, timeLimitSeconds: 180, passingScore: 60, xpReward: 15 }).returning();
      for (const [qi, [prompt, correct, ...wrong]] of s.quiz.entries()) {
        const [q] = await db.insert(questQuestions).values({ questId: quest!.id, prompt, competencyIds: s.competencies, difficulty: s.difficulty, sortOrder: qi + 1 }).returning();
        // Correct option is listed first in the content; put it at a rotating position so it isn't always "A".
        const options = [...wrong];
        options.splice(qi % (wrong.length + 1), 0, correct);
        await db.insert(questOptions).values(options.map((text, oi) => ({ questionId: q!.id, text, isCorrect: text === correct, sortOrder: oi + 1 })));
      }
    }
  }

  const codingIds = new Map<string, number>();
  for (const c of DEMO_CODING) {
    const values = {
      stageId: stageIds.get(c.stage)!, authoringId: c.id, title: c.title, prompt: c.prompt, language: c.language, starterCode: c.starter,
      competencyIds: c.competencies, difficulty: c.difficulty, visibleExamples: c.examples, hiddenChecks: c.hidden, passingScore: 100, xpReward: c.xp,
    };
    const [row] = await db.insert(codingActivities).values(values)
      .onConflictDoUpdate({ target: codingActivities.authoringId, set: { ...values, archivedAt: null } }).returning();
    codingIds.set(c.id, row!.id);
  }

  const ctfIds = new Map<string, number>();
  for (const c of DEMO_CTFS) {
    const values = {
      stageId: stageIds.get(c.stage)!, authoringId: c.id, title: c.title, category: c.category, difficulty: c.difficulty,
      competencyIds: ["security.secure-coding"], brief: c.brief, artifactName: c.artifactName, artifact: c.artifact, flagHash: c.flagHash, xpReward: c.xp,
    };
    const [row] = await db.insert(ctfChallenges).values(values)
      .onConflictDoUpdate({ target: ctfChallenges.authoringId, set: { ...values, archivedAt: null } }).returning();
    ctfIds.set(c.id, row!.id);
  }

  for (const sq of DEMO_SIDE_QUESTS) {
    const ids = sq.type === "ctf" ? ctfIds : codingIds;
    const p = sq.prereq;
    const prerequisites = p === null ? [] : p.kind === "level" ? [{ type: "level", minLevel: p.level }]
      : [{ type: "activity", activityType: p.type, activityId: (p.type === "ctf" ? ctfIds : codingIds).get(p.target)! }];
    const values = { authoringId: sq.id, title: sq.title, summary: sq.summary, brief: DEMO_SIDE_QUEST_BRIEF, activityType: sq.type, activityId: ids.get(sq.target)!, prerequisites, xpReward: sq.xp };
    await db.insert(sideQuests).values(values)
      .onConflictDoUpdate({ target: sideQuests.authoringId, set: { ...values, archivedAt: null } });
  }

  console.log(`Demo seed: ${DEMO_STAGES.length} modules, ${DEMO_STAGES.length} quizzes, ${DEMO_CODING.length} coding activities, ${DEMO_CTFS.length} CTFs, ${DEMO_SIDE_QUESTS.length} side quests.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    await seedDemo();
    process.exit(0);
  } catch (err) {
    console.error("Demo seeding failed:", err);
    process.exit(1);
  }
}
