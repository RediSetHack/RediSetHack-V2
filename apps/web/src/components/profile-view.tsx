import { CharacterSelector } from "@/components/character-selector";
import { COMPETENCIES } from "@repo/contracts";
import type { CharacterOption, LearningStreak, Profile } from "@/lib/api-client";
import { AccomplishmentSummary } from "@/components/accomplishments";
import { ProfileSharing } from "@/components/profile-sharing";
import { LearningStreakGraph } from "@/components/learning-streak-graph";
import {
  AvatarOrInitial,
  BadgeTile,
  Progress,
  Window,
} from "@/components/y2k";
import { levelProgress } from "@/lib/format";
import { useClerk } from "@clerk/nextjs";

type ActivityEvent = Profile["activity"][number];

function activityTitle(event: ActivityEvent): string {
  if (event.activityType === "quest") return "Quest submission";
  if (event.activityType === "ctf") return "CTF challenge";
  return "Reading completion";
}

function activityOutcome(event: ActivityEvent): string {
  if (event.activityType === "ctf") {
    const label = event.outcome.status === "solved" ? "Solved" : "Wrong flag";
    return `${label} · ${event.outcome.xpAwarded} XP`;
  }
  if (event.activityType === "quest") {
    if (event.outcome.status === "expired") return "Expired · no assessed answers";
    const label = event.outcome.passed ? "Passed" : "Not passed";
    return `${label} · ${event.outcome.score}% · ${event.outcome.xpAwarded} XP`;
  }
  return `Completed · ${event.outcome.xpAwarded} XP · not assessed`;
}

function CharacterSummary({ profile }: Readonly<{ profile: Profile }>) {
  const character = profile.character;
  const { level, intoLevel, span } = levelProgress(profile.totalXp);

  return (
    <Window title="Character" bodyClassName="flex flex-wrap items-center gap-4">
      <AvatarOrInitial
        src={character?.imageUrl}
        name={character?.name ?? "?"}
        className="size-16"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-pixel text-[11px] leading-relaxed">
          {character?.name ?? "No Character selected"}
        </p>
        <p className="font-body text-sm font-bold">
          Level {level} • {profile.totalXp.toLocaleString("en-US")} XP
        </p>
        <div className="max-w-xs">
          <Progress value={intoLevel} max={span} label="XP to next level" />
        </div>
      </div>
    </Window>
  );
}

function BadgeList({ badges }: Readonly<{ badges: Profile["badges"] }>) {
  if (badges.length === 0) {
    return (
      <p className="font-body text-sm font-bold text-muted-foreground">
        No Badges earned yet — complete Quests and Codelab challenges to start earning them.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
      {badges.map((badge) => (
        <BadgeTile
          key={badge.badgeDefinitionId}
          name={badge.name}
          description={badge.name}
          imageUrl={badge.imageUrl}
          earnedCount={badge.count}
        />
      ))}
    </ul>
  );
}

export function ProfileView({
  profile,
  profileError,
  streak,
  characters,
  charactersError,
  apiUrl,
}: Readonly<{
  profile: Profile | null;
  profileError: boolean;
  streak: LearningStreak | null;
  characters: readonly CharacterOption[];
  charactersError: boolean;
  apiUrl: string;
}>) {
  const { openUserProfile } = useClerk();

  if (profileError || !profile) {
    return (
      <Window title="Profile">
        <p role="alert" className="font-body text-sm font-bold text-btn-danger">
          Your profile could not be loaded. Please try again later.
        </p>
      </Window>
    );
  }

  return (
    <div className="space-y-6">
      <CharacterSummary profile={profile} />

      <Window title="Stats">
        <AccomplishmentSummary summary={profile} />
      </Window>

      <Window title="Learning streak">
        <LearningStreakGraph streak={streak} />
      </Window>

      <Window title="Badges">
        <BadgeList badges={profile.badges} />
      </Window>

      <Window title="Change Character" bodyClassName="space-y-3">
        {charactersError ? (
          <p role="alert" className="font-body text-sm font-bold text-btn-danger">
            The character catalog could not be loaded. Please try again later.
          </p>
        ) : (
          <CharacterSelector
            characters={characters}
            initialCharacterId={profile.character?.id ?? null}
            apiUrl={apiUrl}
          />
        )}
      </Window>

      <Window title="Account" bodyClassName="space-y-2">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 border-2 border-border px-4 py-2 font-pixel text-[9px] leading-relaxed text-foreground shadow-[3px_3px_0_var(--border)] bg-window-body hover:brightness-105 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none"
            onClick={() => {
              if (typeof openUserProfile === "function") {
                openUserProfile();
              } else {
                window.open("https://accounts.clerk.dev/user", "_blank", "noopener,noreferrer");
              }
            }}
          >
            MANAGE ACCOUNT
          </button>
        </div>
      </Window>

      <Window title="Shared Profile" bodyClassName="space-y-3">
        <ProfileSharing initialShareId={profile.sharing.shareId} apiUrl={apiUrl} />
      </Window>

      <section aria-labelledby="competency-heading" className="space-y-3">
        <Window title="Initial competency baseline">
          {profile.initialCompetencyBaseline ? (
            <>
              <p className="text-sm text-muted-foreground">Assessment-based snapshot; this is not a trained ML estimate. Completed {new Date(profile.initialCompetencyBaseline.completedAt).toLocaleDateString()} (version {profile.initialCompetencyBaseline.assessmentVersion.slice(0, 12)}).</p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">{profile.initialCompetencyBaseline.skills.map((skill) => <li key={skill.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                <span className="font-medium">{COMPETENCIES.find(({ id }) => id === skill.id)?.title ?? skill.id}</span>
                <p className="text-muted-foreground">{skill.score === null ? "Unassessed" : `${skill.score}% correct (${skill.correct}/${skill.assessed} questions)`}</p>
              </li>)}</ul>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">No initial assessment completed yet. Complete the designated assessment from Quests to establish your baseline.</p>
          )}
        </Window>
      </section>

      <section aria-labelledby="activity-heading" className="space-y-3">
        <Window title="Recent learning activity">
          {profile.activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No learning activity yet.</p>
          ) : (
            <ul className="space-y-2">
              {profile.activity.map((event) => (
                <li key={event.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <span className="font-medium">{activityTitle(event)}</span>
                  <p className="text-muted-foreground">{activityOutcome(event)}</p>
                  <time className="ml-2 text-muted-foreground" dateTime={event.occurredAt}>
                    {new Date(event.occurredAt).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Window>
      </section>
    </div>
  );
}
