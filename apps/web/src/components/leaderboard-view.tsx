import { cn } from "@/lib/utils";
import { getPageInfo } from "@/lib/pagination";
import type { Leaderboard, LeaderboardEntry } from "@/lib/api-client";
import {
  AvatarOrInitial,
  EmptyState,
  Pager,
  Table,
  Td,
  Th,
  TrophyIcon,
  Window,
  XPChip,
} from "@/components/y2k";
import { formatXp } from "@/lib/format";

function EntryName({
  entry,
  isCurrentUser,
}: Readonly<{ entry: LeaderboardEntry; isCurrentUser: boolean }>) {
  return (
    <>
      {entry.name ?? "Anonymous"}
      {isCurrentUser && <span className="text-muted-foreground"> (you)</span>}
    </>
  );
}

function TopRankCard({
  entry,
  isCurrentUser,
  tallest,
}: Readonly<{ entry: LeaderboardEntry; isCurrentUser: boolean; tallest?: boolean }>) {
  return (
    <li
      className={cn(
        "flex flex-col items-center gap-2 border-2 border-border bg-window-body p-4 text-center shadow-[4px_4px_0_var(--border)]",
        tallest && "sm:mt-[-8px]",
        isCurrentUser && "outline outline-2 outline-sparkle",
      )}
    >
      <TrophyIcon className="size-6" />
      <AvatarOrInitial name={entry.name ?? "Anonymous"} className="size-12" />
      <p className="font-pixel text-[9px] leading-relaxed">
        <EntryName entry={entry} isCurrentUser={isCurrentUser} />
      </p>
      <p className="font-body text-sm font-bold">LV {entry.level}</p>
      <XPChip xp={entry.totalXp} />
    </li>
  );
}

function LeaderboardRow({
  entry,
  isCurrentUser,
}: Readonly<{ entry: LeaderboardEntry; isCurrentUser: boolean }>) {
  return (
    <tr
      className={cn(isCurrentUser && "bg-accent/40")}
      aria-current={isCurrentUser ? "true" : undefined}
    >
      <Td>{entry.rank}</Td>
      <Td>
        <EntryName entry={entry} isCurrentUser={isCurrentUser} />
      </Td>
      <Td>LV {entry.level}</Td>
      <Td className="text-right">{formatXp(entry.totalXp)}</Td>
    </tr>
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
      <Window title="LEADERBOARD.EXE">
        <p role="alert" className="font-body text-sm font-bold text-btn-danger">
          The leaderboard could not be loaded. Try again shortly.
        </p>
      </Window>
    );
  }

  if (!leaderboard || leaderboard.entries.length === 0) {
    return (
      <Window title="LEADERBOARD.EXE">
        <EmptyState title="No one has earned XP yet." />
      </Window>
    );
  }

  const { entries, page, limit, total } = leaderboard;
  const topEntries = page === 1 ? entries.filter((e) => e.rank <= 3) : [];
  const restEntries = page === 1 ? entries.filter((e) => e.rank > 3) : entries;
  const currentEntry = leaderboard.entries.find((e) => e.userId === currentUserId);

  const hrefFor = (p: number) => `?page=${p}`;

  return (
    <div className="flex flex-col gap-6">
      <Window title="LEADERBOARD.EXE">
        {topEntries.length > 0 && (
          <ol className="grid grid-cols-1 items-end gap-3 sm:grid-cols-3">
            {topEntries[0] && (
              <TopRankCard
                entry={topEntries[0]}
                isCurrentUser={topEntries[0].userId === currentUserId}
              />
            )}
            {topEntries[1] && (
              <TopRankCard
                entry={topEntries[1]}
                isCurrentUser={topEntries[1].userId === currentUserId}
                tallest
              />
            )}
            {topEntries[2] && (
              <TopRankCard
                entry={topEntries[2]}
                isCurrentUser={topEntries[2].userId === currentUserId}
              />
            )}
          </ol>
        )}

        {restEntries.length > 0 && (
          <div className="mt-4">
            <Table>
              <thead>
                <tr>
                  <Th>Rank</Th>
                  <Th>Name</Th>
                  <Th>Adventurer Level</Th>
                  <Th className="text-right">XP</Th>
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
            </Table>
          </div>
        )}

        <div className="mt-4">
          <Pager page={page} totalPages={getPageInfo(page, limit, total).totalPages} hrefFor={hrefFor} />
        </div>
      </Window>

      {currentEntry && (
        <Window title="YOUR RANK" className="sm:max-w-sm">
          <p className="font-body text-sm font-bold">
            YOUR RANK #{currentEntry.rank} · {formatXp(currentEntry.totalXp)}
          </p>
        </Window>
      )}
    </div>
  );
}
