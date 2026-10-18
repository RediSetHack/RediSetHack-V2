import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { CtfChallengeView } from "@/components/ctf-challenge";
import { getCtfChallenges, type CtfSummary } from "@/lib/api-client";

// The parent (app)/layout.tsx already redirects unauthenticated learners to /sign-in.
export default async function CtfPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ challenge?: string }> }>) {
  const { challenge } = await searchParams;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const id = Number(challenge) > 0 ? Number(challenge) : undefined;
  if (id) {
    return (
      <div className="flex-1 mx-auto w-full max-w-4xl p-6 sm:p-10 space-y-6">
        <Link href="/ctf" className="text-sm text-muted-foreground underline">All challenges</Link>
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
    <div className="flex-1 mx-auto w-full max-w-4xl p-6 sm:p-10 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Capture the Flag</h1>
      {challenges === null ? (
        <p role="alert" className="text-sm text-destructive">Could not load challenges.</p>
      ) : challenges.length === 0 ? (
        <p className="text-sm text-muted-foreground">No challenges available yet. Finish more stages to unlock them.</p>
      ) : (
        <ul className="space-y-2">
          {challenges.map((c) => (
            <li key={c.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <Link href={`/ctf?challenge=${c.id}`} className="font-medium underline">{c.title}</Link>
              <p className="text-muted-foreground">
                {c.category} · {c.difficulty} · {c.xpReward} XP{c.solved ? " · Solved" : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
