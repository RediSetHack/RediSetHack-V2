import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Check, Lock, X } from "lucide-react";
import { getSideQuest, getSideQuests, type SideQuest, type SideQuestListItem } from "@/lib/api-client";
import { EmptyState, StatusChip, Window, XPChip } from "@/components/y2k";

const ACTIVITY_HREF = { ctf: "/ctf?challenge=", coding: "/codelab?activity=" } as const;

export default async function SideQuestsPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ quest?: string }> }>) {
  const { quest } = await searchParams;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { getToken } = await auth();
  const token = (await getToken()) ?? "";
  const id = Number(quest) > 0 ? Number(quest) : undefined;

  if (id) {
    let detail: SideQuest | null = null;
    try {
      detail = await getSideQuest(apiUrl, token, id);
    } catch {
      detail = null;
    }
    return (
      <div className="flex-1 mx-auto w-full max-w-4xl p-6 sm:p-10 space-y-4">
        <Link href="/side-quests" className="font-body text-sm font-bold underline">All Side Quests</Link>
        {detail === null ? (
          <Window title="Side Quest">
            <p role="alert" className="font-body text-sm font-bold text-btn-danger">Could not load this Side Quest.</p>
          </Window>
        ) : (
          <Window title={detail.title}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body text-sm font-bold">{detail.summary}</span>
              <XPChip xp={detail.xpReward} />
              <StatusChip status={detail.status === "completed" ? "completed" : detail.status === "available" ? "unlocked" : "locked"} label={detail.status.replace("_", " ")} />
            </div>
            {detail.requirements.length > 0 && (
              <ul className="mt-3 space-y-1 font-body text-sm font-bold">
                {detail.requirements.map((r) => (
                  <li key={r.message} className="flex items-center gap-2">
                    {r.met ? <Check aria-hidden="true" className="size-4" /> : <X aria-hidden="true" className="size-4" />}
                    {r.message}
                  </li>
                ))}
              </ul>
            )}
            {detail.brief && <p className="mt-2 font-body text-sm font-bold">{detail.brief}</p>}
            {detail.activity && (
              <div className="mt-3">
                <Link href={`${ACTIVITY_HREF[detail.activity.type]}${detail.activity.id}`} className="font-pixel text-[9px] leading-relaxed underline">
                  OPEN ACTIVITY
                </Link>
              </div>
            )}
          </Window>
        )}
      </div>
    );
  }

  let quests: SideQuestListItem[] | null = null;
  try {
    quests = await getSideQuests(apiUrl, token);
  } catch {
    quests = null;
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-5xl p-6 sm:p-10 space-y-6">
      <Window title="SIDE-QUESTS.EXE">
        <p className="mb-4 font-body text-sm font-bold text-muted-foreground">Optional objectives. The main story never waits on them.</p>
        {quests === null ? (
          <p role="alert" className="font-body text-sm font-bold text-btn-danger">Could not load Side Quests.</p>
        ) : quests.length === 0 ? (
          <EmptyState title="No Side Quests yet." />
        ) : (
          <ul className="space-y-2">
            {quests.map((q) => (
              <li key={q.id} className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]">
                <Link href={`/side-quests?quest=${q.id}`} className="font-pixel text-[9px] leading-relaxed underline">{q.title}</Link>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="font-body text-xs font-bold">{q.summary}</span>
                  <XPChip xp={q.xpReward} />
                  <StatusChip status={q.status === "completed" ? "completed" : q.status === "available" ? "unlocked" : "locked"} label={q.status.replace("_", " ")} />
                </div>
                {q.lockReasons.map((r) => (
                  <p key={r.message} className="mt-1 flex items-center gap-2 font-body text-xs font-bold text-muted-foreground">
                    <Lock aria-hidden="true" className="size-3" /> {r.message}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        )}
      </Window>
    </div>
  );
}
