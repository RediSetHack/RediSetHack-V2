import type { SharedProfile } from "@/lib/api-client";
import { formatXp } from "@/lib/format";

/** Rank, XP and evidence counts shared by the self profile and the public summary. */
export function AccomplishmentSummary({ summary }: Readonly<{ summary: Pick<SharedProfile, "adventurerRank" | "totalXp" | "accomplishments"> }>) {
  const { novelsCompleted, sideQuestsCompleted, ctfsSolved } = summary.accomplishments;
  return (
    <section aria-labelledby="accomplishments-heading" className="space-y-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-4">
        <div className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]">
          <p className="font-pixel text-[8px] leading-relaxed">Stages completed</p>
          <p className="mt-1 font-pixel-lg text-xl">{novelsCompleted}</p>
        </div>
        <div className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]">
          <p className="font-pixel text-[8px] leading-relaxed">Quests passed</p>
          <p className="mt-1 font-pixel-lg text-xl">{sideQuestsCompleted}</p>
        </div>
        <div className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]">
          <p className="font-pixel text-[8px] leading-relaxed">Badges</p>
          <p className="mt-1 font-pixel-lg text-xl">{ctfsSolved}</p>
        </div>
        <div className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]">
          <p className="font-pixel text-[8px] leading-relaxed">Rank</p>
          <p className="mt-1 font-pixel-lg text-xl">#{summary.adventurerRank}</p>
          <p className="text-xs text-muted-foreground">{formatXp(summary.totalXp)}</p>
        </div>
      </div>
      {novelsCompleted + sideQuestsCompleted + ctfsSolved === 0 && (
        <p className="font-body text-sm font-bold text-muted-foreground">No completed Novels, Side Quests or CTF challenges yet.</p>
      )}
    </section>
  );
}
