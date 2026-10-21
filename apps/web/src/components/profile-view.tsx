import { CharacterSelector } from "@/components/character-selector";
import { COMPETENCIES } from "@repo/contracts";
import type { CharacterOption, LearningStreak, Profile } from "@/lib/api-client";
import { AccomplishmentSummary } from "@/components/accomplishments";
import { ProfileSharing } from "@/components/profile-sharing";
import { LearningStreakGraph } from "@/components/learning-streak-graph";
import { AccountWindow } from "@/components/account-window";
import {
  AvatarOrInitial,
  BadgeTile,
  Progress,
  Window,
} from "@/components/y2k";
import { formatXp, levelProgress } from "@/lib/format";

type ActivityEvent = Profile["activity"][number];

/** Read-only account details rendered in the Account window. */
export type AccountDetails = {
  readonly name: string | null;
  readonly email: string | null;
};

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
    <Window title="CHARACTER.EXE" bodyClassName="flex flex-wrap items-center gap-4">
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
          Adventurer Rank {profile.adventurerRank} • {formatXp(profile.totalXp)}
        </p>
        <div className="max-w-xs">
          <Progress
            value={intoLevel}
            max={span}
            label={`XP to Adventurer Rank ${level + 1}`}
          />
        </div>
      </div>
    </Window>
  );
}

function BadgeGrid({
  badges,
  descriptions,
}: Readonly<{
  badges: Profile["badges"];
  descriptions: Readonly<Record<string, string>>;
}>) {
  if (badges.length === 0) {
    return (
      <p className="font-body text-sm font-bold text-muted-foreground">
        No Badges earned yet — complete Quests and Codelab challenges to start earning them.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {badges.map((badge) => (
        <BadgeTile
          key={badge.badgeDefinitionId}
          name={badge.name}
          description={descriptions[badge.slug]}
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
  badgeDescriptions,
  account,
  apiUrl,
}: Readonly<{
  profile: Profile | null;
  profileError: boolean;
  streak: LearningStreak | null;
  characters: readonly CharacterOption[];
  charactersError: boolean;
  badgeDescriptions: Readonly<Record<string, string>>;
  account: AccountDetails;
  apiUrl: string;
}>) {
  if (profileError || !profile) {
    return (
      <Window title="PROFILE.EXE">
        <p role="alert" className="font-body text-sm font-bold text-btn-danger">
          Your profile could not be loaded. Please try again later.
        </p>
      </Window>
    );
  }

  return (
    <div className="space-y-6">
      <CharacterSummary profile={profile} />

      <Window title="STATS.EXE">
        <AccomplishmentSummary summary={profile} />
      </Window>

      <Window title="LEARNING_STREAK.EXE">
        <LearningStreakGraph streak={streak} />
      </Window>

      <Window title="BADGES.EXE">
        <BadgeGrid badges={profile.badges} descriptions={badgeDescriptions} />
      </Window>

      <Window title="CHANGE_CHARACTER.EXE" bodyClassName="space-y-3">
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

      <Window title="ACCOUNT.EXE" bodyClassName="space-y-2">
        <AccountWindow name={account.name} email={account.email} />
      </Window>

      <Window title="SHARED_PROFILE.EXE" bodyClassName="space-y-3">
        <ProfileSharing initialShareId={profile.sharing.shareId} apiUrl={apiUrl} />
      </Window>

      <section aria-label="Initial competency baseline" className="space-y-3">
        <Window title="INITIAL_COMPETENCY_BASELINE.EXE">
          {profile.initialCompetencyBaseline ? (
            <>
              <p className="font-body text-sm font-bold text-muted-foreground">
                Assessment-based snapshot; this is not a trained ML estimate. Completed{" "}
                {new Date(profile.initialCompetencyBaseline.completedAt).toLocaleDateString()} (version{" "}
                {profile.initialCompetencyBaseline.assessmentVersion.slice(0, 12)}).
              </p>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {profile.initialCompetencyBaseline.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]"
                  >
                    <span className="font-body text-sm font-bold text-foreground">
                      {COMPETENCIES.find(({ id }) => id === skill.id)?.title ?? skill.id}
                    </span>
                    <p className="font-body text-xs font-bold text-muted-foreground">
                      {skill.score === null
                        ? "Unassessed"
                        : `${skill.score}% correct (${skill.correct}/${skill.assessed} questions)`}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="font-body text-sm font-bold text-muted-foreground">
              No initial assessment completed yet. Complete the designated assessment from Quests to establish your baseline.
            </p>
          )}
        </Window>
      </section>

      <section aria-label="Recent learning activity" className="space-y-3">
        <Window title="RECENT_LEARNING_ACTIVITY.EXE">
          {profile.activity.length === 0 ? (
            <p className="font-body text-sm font-bold text-muted-foreground">
              No learning activity yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {profile.activity.map((event) => (
                <li
                  key={event.id}
                  className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]"
                >
                  <span className="font-body text-sm font-bold text-foreground">
                    {activityTitle(event)}
                  </span>
                  <p className="font-body text-xs font-bold text-muted-foreground">
                    {activityOutcome(event)}
                  </p>
                  <time
                    className="font-body text-xs font-bold text-muted-foreground"
                    dateTime={event.occurredAt}
                  >
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
