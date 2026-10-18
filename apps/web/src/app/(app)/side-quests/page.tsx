import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getSideQuest, getSideQuests, type SideQuest, type SideQuestListItem } from "@/lib/api-client";

const ACTIVITY_HREF = { ctf: "/ctf?challenge=", coding: "/codelab?activity=" } as const;

// The parent (app)/layout.tsx already redirects unauthenticated learners to /sign-in.
// Side Quests are optional: nothing on the main story path reads this page.
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
        <Link href="/side-quests" className="text-sm text-muted-foreground underline">All Side Quests</Link>
        {detail === null ? (
          <p role="alert" className="text-sm text-destructive">Could not load this Side Quest.</p>
        ) : (
          <>
            <h1 className="text-2xl font-bold tracking-tight">{detail.title}</h1>
            <p className="text-sm text-muted-foreground">{detail.summary} · {detail.xpReward} XP · {detail.status.replace("_", " ")}</p>
            {detail.requirements.length > 0 && (
              <ul className="space-y-1 text-sm">
                {detail.requirements.map((r) => (
                  <li key={r.message}>{r.met ? "✓" : "✗"} {r.message}</li>
                ))}
              </ul>
            )}
            {detail.brief && <p className="text-sm">{detail.brief}</p>}
            {detail.activity && (
              <Link href={`${ACTIVITY_HREF[detail.activity.type]}${detail.activity.id}`} className="text-sm font-medium underline">
                Open the activity
              </Link>
            )}
          </>
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
    <div className="flex-1 mx-auto w-full max-w-4xl p-6 sm:p-10 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Side Quests</h1>
      <p className="text-sm text-muted-foreground">Optional objectives. The main story never waits on them.</p>
      {quests === null ? (
        <p role="alert" className="text-sm text-destructive">Could not load Side Quests.</p>
      ) : quests.length === 0 ? (
        <p className="text-sm text-muted-foreground">No Side Quests yet.</p>
      ) : (
        <ul className="space-y-2">
          {quests.map((q) => (
            <li key={q.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <Link href={`/side-quests?quest=${q.id}`} className="font-medium underline">{q.title}</Link>
              <p className="text-muted-foreground">{q.summary} · {q.xpReward} XP · {q.status.replace("_", " ")}</p>
              {q.lockReasons.map((r) => (
                <p key={r.message} className="text-muted-foreground">🔒 {r.message}</p>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
