import { CharacterSelector } from "@/components/character-selector";
import type { CharacterOption, Profile } from "@/lib/api-client";

function CharacterSummary({ profile }: Readonly<{ profile: Profile }>) {
  const character = profile.character;
  return (
    <section className="flex items-center gap-4 p-5 rounded-xl border border-border bg-card">
      {character?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatar source is admin-controlled, arbitrary host
        <img
          src={character.imageUrl}
          alt={character.name}
          className="w-14 h-14 rounded-full object-cover"
        />
      ) : (
        <span
          className="flex items-center justify-center w-14 h-14 rounded-full bg-muted text-2xl font-semibold"
          role="img"
          aria-label={character?.name ?? "No Character selected"}
        >
          {character?.name.charAt(0) ?? "?"}
        </span>
      )}
      <div>
        <p className="font-semibold text-lg text-foreground">
          {character?.name ?? "No Character selected"}
        </p>
        <p className="text-sm text-muted-foreground">
          Level {profile.level} • {profile.totalXp} XP
        </p>
      </div>
    </section>
  );
}

function BadgeList({ badges }: Readonly<{ badges: Profile["badges"] }>) {
  if (badges.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No Badges earned yet — complete Quests and Codelab challenges to start earning them.
      </p>
    );
  }

  return (
    <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {badges.map((badge) => (
        <li
          key={badge.badgeDefinitionId}
          className="flex flex-col items-center gap-2 p-4 rounded-xl border border-border bg-card text-center"
        >
          {badge.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- badge source is admin-controlled, arbitrary host
            <img src={badge.imageUrl} alt={badge.name} className="w-10 h-10 object-contain" />
          ) : (
            <span
              className="flex items-center justify-center w-10 h-10 rounded-full bg-muted text-lg font-semibold"
              role="img"
              aria-label={badge.name}
            >
              {badge.name.charAt(0)}
            </span>
          )}
          <span className="text-sm font-medium text-foreground">{badge.name}</span>
          <span className="text-xs text-muted-foreground">Earned ×{badge.count}</span>
        </li>
      ))}
    </ul>
  );
}

export function ProfileView({
  profile,
  profileError,
  characters,
  charactersError,
  apiUrl,
}: Readonly<{
  profile: Profile | null;
  profileError: boolean;
  characters: readonly CharacterOption[];
  charactersError: boolean;
  apiUrl: string;
}>) {
  if (profileError || !profile) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Your profile could not be loaded. Please try again later.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <CharacterSummary profile={profile} />

      <section aria-labelledby="badges-heading" className="space-y-3">
        <h2 id="badges-heading" className="text-lg font-semibold">
          Badges
        </h2>
        <BadgeList badges={profile.badges} />
      </section>

      <section aria-labelledby="character-heading" className="space-y-3">
        <h2 id="character-heading" className="text-lg font-semibold">
          Change Character
        </h2>
        {charactersError ? (
          <p role="alert" className="text-sm text-destructive">
            The character catalog could not be loaded. Please try again later.
          </p>
        ) : (
          <CharacterSelector
            characters={characters}
            initialCharacterId={profile.character?.id ?? null}
            apiUrl={apiUrl}
          />
        )}
      </section>
    </div>
  );
}
