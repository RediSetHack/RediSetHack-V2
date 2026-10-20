import type { SharedProfile } from "@/lib/api-client";
import { AccomplishmentSummary } from "@/components/accomplishments";
import { AvatarOrInitial, BadgeTile, Window } from "@/components/y2k";

/** `profile` null = the link is unknown or revoked; `error` = the lookup itself failed. */
export function SharedProfileView({ profile, error }: Readonly<{ profile: SharedProfile | null; error: boolean }>) {
  if (error) {
    return (
      <Window title="Error">
        <p role="alert" className="font-body text-sm font-bold text-btn-danger">This profile could not be loaded. Please try again later.</p>
      </Window>
    );
  }
  if (!profile) {
    return (
      <Window title="Not shared">
        <p role="status" className="font-body text-sm font-bold text-muted-foreground">This profile is not shared or the link has been revoked.</p>
      </Window>
    );
  }
  return (
    <div className="space-y-6">
      <Window title="Character" bodyClassName="flex items-center gap-4">
        <AvatarOrInitial src={profile.character?.imageUrl} name={profile.character?.name ?? "?"} className="size-14" />
        <p className="font-pixel text-[11px] leading-relaxed">{profile.character?.name ?? "A RediSetHack learner"}</p>
      </Window>
      <Window title="Accomplishments">
        <AccomplishmentSummary summary={profile} />
      </Window>
      <Window title="Learning streak">
        <p className="font-body text-sm font-bold">Current: {profile.currentStreak} · Longest: {profile.longestStreak} days</p>
      </Window>
      <Window title="Badges">
        {profile.badges.length === 0 ? (
          <p className="font-body text-sm font-bold text-muted-foreground">No Badges earned yet.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {profile.badges.map((b) => (
              <BadgeTile key={b.slug} name={b.name} imageUrl={b.imageUrl} earnedCount={b.count} />
            ))}
          </ul>
        )}
      </Window>
    </div>
  );
}
