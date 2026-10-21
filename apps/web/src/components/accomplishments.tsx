import type { ReactNode } from "react";
import { formatXp } from "@/lib/format";

/**
 * The counts the stat tiles read. Both the signed-in Profile and the public
 * Shared Profile carry them, so the tiles stay identical in both places.
 */
export type AccomplishmentSummary = {
  readonly adventurerRank: number;
  readonly totalXp: number;
  readonly accomplishments: {
    readonly novelsCompleted: number;
    readonly sideQuestsCompleted: number;
    readonly ctfsSolved: number;
  };
  readonly badges: readonly { readonly count: number }[];
};

function StatTile({
  label,
  value,
  hint,
}: Readonly<{ label: string; value: ReactNode; hint?: ReactNode }>) {
  return (
    <div className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]">
      <p className="font-pixel text-[8px] leading-relaxed text-foreground">{label}</p>
      <p className="mt-1 font-pixel-lg text-xl leading-none text-foreground">{value}</p>
      {hint ? (
        <p className="mt-1 font-body text-xs font-bold text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Rank, XP and evidence counts shared by the self profile and the public summary. */
export function AccomplishmentSummary({
  summary,
}: Readonly<{ summary: AccomplishmentSummary }>) {
  const { novelsCompleted, sideQuestsCompleted, ctfsSolved } = summary.accomplishments;
  const badgesEarned = summary.badges.reduce((total, badge) => total + badge.count, 0);

  return (
    <section aria-label="Accomplishments" className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatTile label="Stages completed" value={novelsCompleted} />
        <StatTile label="Quests passed" value={sideQuestsCompleted} />
        <StatTile label="Badges" value={badgesEarned} />
        <StatTile
          label="Rank"
          value={`#${summary.adventurerRank}`}
          hint={formatXp(summary.totalXp)}
        />
      </div>
      <p className="font-body text-xs font-bold text-muted-foreground">
        CTF challenges solved: {ctfsSolved}
      </p>
      {novelsCompleted + sideQuestsCompleted + ctfsSolved === 0 && (
        <p className="font-body text-sm font-bold text-muted-foreground">
          No completed Novels, Side Quests or CTF challenges yet.
        </p>
      )}
    </section>
  );
}
