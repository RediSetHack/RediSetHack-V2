import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPageInfo } from "@/lib/pagination";
import type { Leaderboard, LeaderboardEntry } from "@/lib/api-client";

const MEDALS = ["🥇", "🥈", "🥉"];

function TopRankCard({
  entry,
  isCurrentUser,
}: Readonly<{ entry: LeaderboardEntry; isCurrentUser: boolean }>) {
  return (
    <li
      className={cn(
        "flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-4 text-center",
        isCurrentUser && "border-primary ring-2 ring-primary/40",
      )}
    >
      <span className="text-2xl" aria-hidden="true">
        {MEDALS[entry.rank - 1]}
      </span>
      <span className="font-semibold">
        {entry.name ?? "Anonymous"}
        {isCurrentUser && <span className="text-muted-foreground"> (you)</span>}
      </span>
      <span className="text-sm text-muted-foreground">
        Level {entry.level} • {entry.totalXp} XP
      </span>
    </li>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: Readonly<{ entry: LeaderboardEntry; isCurrentUser: boolean }>) {
  return (
    <tr
      className={cn(isCurrentUser && "bg-primary/10 font-semibold")}
      aria-current={isCurrentUser ? "true" : undefined}
    >
      <td className="px-3 py-2">{entry.rank}</td>
      <td className="px-3 py-2">
        {entry.name ?? "Anonymous"}
        {isCurrentUser && <span className="text-muted-foreground"> (you)</span>}
      </td>
      <td className="px-3 py-2">{entry.level}</td>
      <td className="px-3 py-2 text-right">{entry.totalXp}</td>
    </tr>
  );
}

function Pager({
  page,
  limit,
  total,
}: Readonly<{ page: number; limit: number; total: number }>) {
  const { totalPages, hasPrevious, hasNext, previousPage, nextPage } = getPageInfo(
    page,
    limit,
    total,
  );

  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      aria-label="Leaderboard pagination"
      className="flex items-center justify-between gap-2 pt-2"
    >
      {hasPrevious ? (
        <Link href={`?page=${previousPage}`} className={buttonVariants({ variant: "outline" })}>
          Previous
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(buttonVariants({ variant: "outline" }), "opacity-50")}>
          Previous
        </span>
      )}
      <span className="text-sm text-muted-foreground" aria-live="polite">
        Page {page} of {totalPages}
      </span>
      {hasNext ? (
        <Link href={`?page=${nextPage}`} className={buttonVariants({ variant: "outline" })}>
          Next
        </Link>
      ) : (
        <span aria-hidden="true" className={cn(buttonVariants({ variant: "outline" }), "opacity-50")}>
          Next
        </span>
      )}
    </nav>
  );
}

export function LeaderboardView({
  leaderboard,
  error,
  currentUserId,
}: Readonly<{
  leaderboard: Leaderboard | null;
  error: boolean;
  currentUserId: string | null;
}>) {
  if (error) {
    return (
      <p role="alert" className="p-6 text-destructive">
        The leaderboard could not be loaded. Try again shortly.
      </p>
    );
  }

  if (!leaderboard || leaderboard.entries.length === 0) {
    return <p className="p-6 text-muted-foreground">No one has earned XP yet.</p>;
  }

  const { entries, page, limit, total } = leaderboard;
  // Top ranks are shown prominently only on the first page, and only when
  // there are enough entries to make a podium worth showing.
  const topEntries = page === 1 ? entries.filter((e) => e.rank <= 3) : [];
  const restEntries = page === 1 ? entries.filter((e) => e.rank > 3) : entries;

  return (
    <div className="flex flex-col gap-6 p-6">
      <h1 className="text-xl font-semibold">Leaderboard</h1>

      {topEntries.length > 0 && (
        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {topEntries.map((entry) => (
            <TopRankCard key={entry.userId} entry={entry} isCurrentUser={entry.userId === currentUserId} />
          ))}
        </ol>
      )}

      {restEntries.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <caption className="sr-only">Learners ranked by accumulated XP</caption>
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th scope="col" className="px-3 py-2 font-medium">Rank</th>
                <th scope="col" className="px-3 py-2 font-medium">Name</th>
                <th scope="col" className="px-3 py-2 font-medium">Level</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">XP</th>
              </tr>
            </thead>
            <tbody>
              {restEntries.map((entry) => (
                <LeaderboardRow
                  key={entry.userId}
                  entry={entry}
                  isCurrentUser={entry.userId === currentUserId}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pager page={page} limit={limit} total={total} />
    </div>
  );
}
