import type { SharedProfile } from "@/lib/api-client";
import { AccomplishmentSummary } from "@/components/accomplishments";

/** `profile` null = the link is unknown or revoked; `error` = the lookup itself failed. */
export function SharedProfileView({ profile, error }: Readonly<{ profile: SharedProfile | null; error: boolean }>) {
  if (error) {
    return <p role="alert" className="text-sm text-destructive">This profile could not be loaded. Please try again later.</p>;
  }
  if (!profile) {
    return <p role="status" className="text-sm text-muted-foreground">This profile is not shared or the link has been revoked.</p>;
  }
  return (
    <div className="space-y-8">
      <p className="font-semibold text-lg">{profile.character?.name ?? "A RediSetHack learner"}</p>
      <AccomplishmentSummary summary={profile} />
      <section aria-labelledby="shared-streak-heading" className="space-y-2">
        <h2 id="shared-streak-heading" className="text-lg font-semibold">Learning streak</h2>
        <p className="text-sm">Current: <strong>{profile.currentStreak}</strong> · Longest: <strong>{profile.longestStreak}</strong> days</p>
      </section>
      <section aria-labelledby="shared-badges-heading" className="space-y-2">
        <h2 id="shared-badges-heading" className="text-lg font-semibold">Badges</h2>
        {profile.badges.length === 0 ? <p className="text-sm text-muted-foreground">No Badges earned yet.</p> : (
          <ul className="flex flex-wrap gap-2">
            {profile.badges.map((b) => <li key={b.slug} className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm">{b.name} ×{b.count}</li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
