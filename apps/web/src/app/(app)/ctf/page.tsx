import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { CtfChallengeView } from "@/components/ctf-challenge";
import { getCtfChallenges, type CtfSummary } from "@/lib/api-client";
import { EmptyState, StatusChip, Window, XPChip } from "@/components/y2k";

export default async function CtfPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ challenge?: string }> }>) {
  const { challenge } = await searchParams;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const id = Number(challenge) > 0 ? Number(challenge) : undefined;
  if (id) {
    return (
      <div className="flex-1 mx-auto w-full max-w-4xl p-6 sm:p-10 space-y-6">
        <Link href="/ctf" className="font-body text-sm font-bold underline">All challenges</Link>
        <CtfChallengeView apiUrl={apiUrl} challengeId={id} />
      </div>
    );
  }

  const { getToken } = await auth();
  let challenges: CtfSummary[] | null = null;
  try {
    challenges = await getCtfChallenges(apiUrl, (await getToken()) ?? "");
  } catch {
    challenges = null;
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-5xl p-6 sm:p-10 space-y-6">
      <Window title="CTF.EXE">
        {challenges === null ? (
          <p role="alert" className="font-body text-sm font-bold text-btn-danger">Could not load challenges.</p>
        ) : challenges.length === 0 ? (
          <EmptyState title="No challenges available yet. Finish more stages to unlock them." />
        ) : (
          <ul className="space-y-2">
            {challenges.map((c) => (
              <li key={c.id} className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]">
                <Link href={`/ctf?challenge=${c.id}`} className="font-pixel text-[9px] leading-relaxed underline">{c.title}</Link>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="font-body text-xs font-bold">{c.category} · {c.difficulty}</span>
                  <XPChip xp={c.xpReward} />
                  {c.solved && <StatusChip status="solved" />}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Window>
    </div>
  );
}
