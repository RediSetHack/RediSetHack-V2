import type { SharedProfile } from "@/lib/api-client";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Rank, XP and evidence counts shared by the self profile and the public summary. */
export function AccomplishmentSummary({ summary }: Readonly<{ summary: Pick<SharedProfile, "adventurerRank" | "totalXp" | "accomplishments"> }>) {
  const { novelsCompleted, sideQuestsCompleted, ctfsSolved } = summary.accomplishments;
  return (
    <section aria-labelledby="accomplishments-heading" className="space-y-3">
      <h2 id="accomplishments-heading" className="text-lg font-semibold">Accomplishments</h2>
      <p className="text-sm">
        Adventurer Rank <strong>{summary.adventurerRank}</strong> · {summary.totalXp} XP
      </p>
      <ul className="grid gap-2 sm:grid-cols-3">
        <li className="rounded-lg border border-border bg-card p-3 text-sm">{plural(novelsCompleted, "Novel")} completed</li>
        <li className="rounded-lg border border-border bg-card p-3 text-sm">{plural(sideQuestsCompleted, "Side Quest")} completed</li>
        <li className="rounded-lg border border-border bg-card p-3 text-sm">{plural(ctfsSolved, "CTF challenge")} solved</li>
      </ul>
      {novelsCompleted + sideQuestsCompleted + ctfsSolved === 0 && (
        <p className="text-sm text-muted-foreground">No completed Novels, Side Quests or CTF challenges yet.</p>
      )}
    </section>
  );
}
