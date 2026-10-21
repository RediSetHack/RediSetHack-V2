import { Target, Zap } from "lucide-react";
import type { CtfSummary } from "@/lib/api-client";
import { CTF_DIFFICULTY_LABELS } from "@/lib/ctf";
import { XPChip } from "@/components/y2k";

/**
 * The facts every CTF challenge shows, in the list and in the challenge view:
 * category, difficulty and XP reward.
 */
export function CtfChallengeFacts({
  challenge,
}: Readonly<{
  challenge: Pick<CtfSummary, "category" | "difficulty" | "xpReward">;
}>) {
  return (
    <dl className="flex flex-wrap items-center gap-2">
      <div className="inline-flex items-center gap-1 font-body text-[13px] font-bold text-foreground">
        <dt className="sr-only">Category</dt>
        <dd className="inline-flex items-center gap-1">
          <Target aria-hidden="true" className="size-4" />
          {challenge.category}
        </dd>
      </div>
      <div className="inline-flex items-center gap-1 font-body text-[13px] font-bold text-foreground">
        <dt className="sr-only">Difficulty</dt>
        <dd className="inline-flex items-center gap-1">
          <Zap aria-hidden="true" className="size-4" />
          {CTF_DIFFICULTY_LABELS[challenge.difficulty]}
        </dd>
      </div>
      <div>
        <dt className="sr-only">XP reward</dt>
        <dd>
          <XPChip xp={challenge.xpReward} />
        </dd>
      </div>
    </dl>
  );
}
