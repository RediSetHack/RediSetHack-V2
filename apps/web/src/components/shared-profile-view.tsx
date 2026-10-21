import type { SharedProfile } from "@/lib/api-client";
import { AccomplishmentSummary } from "@/components/accomplishments";
import { AvatarOrInitial, BadgeTile, Window } from "@/components/y2k";
import { formatXp } from "@/lib/format";

/** `profile` null = the link is unknown or revoked; `error` = the lookup itself failed. */
export function SharedProfileView({
  profile,
  error,
  badgeDescriptions = {},
}: Readonly<{
  profile: SharedProfile | null;
  error: boolean;
  badgeDescriptions?: Readonly<Record<string, string>>;
}>) {
  if (error) {
    return (
      <Window title="ERROR.EXE">
        <p role="alert" className="font-body text-sm font-bold text-btn-danger">
          This profile could not be loaded. Please try again later.
        </p>
      </Window>
    );
  }
  if (!profile) {
    return (
      <Window title="NOT_SHARED.EXE">
        <output className="block font-body text-sm font-bold text-muted-foreground">
          This profile is not shared or the link has been revoked.
        </output>
      </Window>
    );
  }
  return (
    <div className="space-y-6">
      <Window title="SHARED_PROFILE.EXE" bodyClassName="flex flex-wrap items-center gap-4">
        <AvatarOrInitial
          src={profile.character?.imageUrl}
          name={profile.character?.name ?? "?"}
          className="size-14"
        />
        <div className="min-w-0 space-y-1">
          <p className="font-pixel text-[11px] leading-relaxed text-foreground">
            {profile.character?.name ?? "A RediSetHack learner"}
          </p>
          <p className="font-body text-sm font-bold text-foreground">
            Adventurer Rank {profile.adventurerRank} • {formatXp(profile.totalXp)}
          </p>
        </div>
      </Window>
      <Window title="ACCOMPLISHMENTS.EXE">
        <AccomplishmentSummary summary={profile} />
      </Window>
      <Window title="LEARNING_STREAK.EXE">
        <p className="font-body text-sm font-bold text-foreground">
          Current: {profile.currentStreak} • Longest: {profile.longestStreak} days
        </p>
      </Window>
      <Window title="BADGES.EXE">
        {profile.badges.length === 0 ? (
          <p className="font-body text-sm font-bold text-muted-foreground">
            No Badges earned yet.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {profile.badges.map((badge) => (
              <BadgeTile
                key={badge.slug}
                name={badge.name}
                description={badgeDescriptions[badge.slug]}
                imageUrl={badge.imageUrl}
                earnedCount={badge.count}
              />
            ))}
          </ul>
        )}
      </Window>
    </div>
  );
}
