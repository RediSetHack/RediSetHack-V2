import { cn } from "@/lib/utils";
import { getPageInfo } from "@/lib/pagination";
import type { Leaderboard, LeaderboardEntry } from "@/lib/api-client";
import {
  AvatarOrInitial,
  Pager,
  PixelTrophy,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  Window,
  XPChip,
} from "@/components/y2k";
import { FeedbackState } from "@/components/y2k-dialog";
import { formatXp } from "@/lib/format";
import {
  displayName,
  isCurrentUser,
  podiumEntries,
  podiumLayout,
  type PodiumPlace,
  type PodiumPosition,
} from "@/lib/leaderboard";

/** The visual column of each podium card, from its place in the row. */
const PODIUM_POSITION_CLASS: Record<PodiumPosition, string> = {
  left: "sm:order-1",
  centre: "sm:order-2",
  right: "sm:order-3",
};

function PodiumCard({
  entry,
  place,
}: Readonly<{ entry: LeaderboardEntry; place: PodiumPlace }>) {
  const layout = podiumLayout(place);
  return (
    <li
      className={cn(
        "flex flex-col items-center gap-2 border-2 border-border bg-window-body p-4 text-center shadow-[4px_4px_0_var(--border)]",
        PODIUM_POSITION_CLASS[layout.position],
        layout.tallest && "sm:px-6 sm:py-6",
      )}
    >
      <span className="font-pixel text-[9px] leading-relaxed text-muted-foreground">
        {layout.label}
      </span>
      <PixelTrophy size={layout.tallest ? 48 : 32} />
      <AvatarOrInitial
        name={displayName(entry)}
        className={cn("size-12", layout.tallest && "size-16")}
      />
      <p className="max-w-full break-words font-pixel text-[9px] leading-relaxed text-foreground">
        {displayName(entry)}
      </p>
      <p className="font-body text-sm font-bold">LV {entry.level}</p>
      <XPChip xp={entry.totalXp} />
    </li>
  );
}

function LeaderboardRow({
  entry,
  you,
}: Readonly<{ entry: LeaderboardEntry; you: boolean }>) {
  return (
    <Tr
      className={cn(you && "bg-accent/40 hover:bg-accent/50")}
      aria-current={you ? "true" : undefined}
    >
      <Td>{entry.rank}</Td>
      <Td>
        {displayName(entry)}
        {you && <span className="text-muted-foreground"> (you)</span>}
      </Td>
      <Td>LV {entry.level}</Td>
      <Td className="text-right">
        <span className="font-pixel-lg text-lg leading-none">
          {formatXp(entry.totalXp)}
        </span>
      </Td>
    </Tr>
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
      <FeedbackState
        error
        errorMessage="The leaderboard could not be loaded. Please try again."
      >
        {null}
      </FeedbackState>
    );
  }

  if (!leaderboard || leaderboard.entries.length === 0) {
    return (
      <FeedbackState
        empty
        emptyTitle="LEADERBOARD.EXE"
        emptyMessage="No one has earned XP yet."
      >
        {null}
      </FeedbackState>
    );
  }

  const { entries, page, limit, total, me } = leaderboard;
  const podium = podiumEntries(entries, page);
  const totalPages = getPageInfo(page, limit, total).totalPages;
  const hrefFor = (target: number) => `?page=${target}`;

  return (
    <div className="flex flex-col gap-6">
      <Window title="LEADERBOARD.EXE">
        <h1 className="mb-4 font-pixel text-[18px] leading-relaxed text-foreground">
          Leaderboard
        </h1>

        {podium.length > 0 && (
          <ol
            aria-label="Top three learners"
            className="mb-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-3"
          >
            {podium.map(({ entry, place }) => (
              <PodiumCard key={entry.userId} entry={entry} place={place} />
            ))}
          </ol>
        )}

        <Table>
          <Thead>
            <Tr>
              <Th>Rank</Th>
              <Th>Name</Th>
              <Th>Level</Th>
              <Th className="text-right">XP</Th>
            </Tr>
          </Thead>
          <Tbody>
            {entries.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                you={isCurrentUser(entry, currentUserId)}
              />
            ))}
          </Tbody>
        </Table>

        <div className="mt-4">
          <Pager page={page} totalPages={totalPages} hrefFor={hrefFor} />
        </div>
      </Window>

      {me && (
        <div className="sticky bottom-4 z-20 ml-auto w-full sm:max-w-xs">
          <Window title="YOUR RANK" bodyClassName="px-3 py-2">
            <p className="font-pixel-lg text-lg leading-none text-foreground">
              YOUR RANK #{me.rank} · {formatXp(me.totalXp)}
            </p>
          </Window>
        </div>
      )}
    </div>
  );
}
