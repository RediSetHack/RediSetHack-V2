import { auth, currentUser } from "@clerk/nextjs/server";
import { ProfileView, type AccountDetails } from "@/components/profile-view";
import {
  getBadgeDefinitions,
  getCharacters,
  getLearningStreak,
  getProfile,
  type CharacterOption,
  type LearningStreak,
  type Profile,
} from "@/lib/api-client";

export default async function ProfilePage() {
  const { getToken } = await auth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = await getToken();

  const [profileResult, charactersResult, streakResult, badgeResult, userResult] =
    await Promise.allSettled([
      token ? getProfile(apiUrl, token) : Promise.resolve(null),
      getCharacters(apiUrl),
      token ? getLearningStreak(apiUrl, token) : Promise.resolve(null),
      getBadgeDefinitions(apiUrl),
      currentUser(),
    ]);

  const profile: Profile | null =
    profileResult.status === "fulfilled" ? profileResult.value : null;
  const profileError = profileResult.status === "rejected";
  const characters: CharacterOption[] =
    charactersResult.status === "fulfilled" ? charactersResult.value : [];
  const streak: LearningStreak | null =
    streakResult.status === "fulfilled" ? streakResult.value : null;
  const charactersError = charactersResult.status === "rejected";

  // Badge descriptions live in the public Badge catalog; the profile only
  // carries the earned Badges, so the tooltip text is looked up by slug.
  const badgeDescriptions: Record<string, string> = {};
  for (const definition of badgeResult.status === "fulfilled" ? badgeResult.value : []) {
    if (definition.description) {
      badgeDescriptions[definition.slug] = definition.description;
    }
  }

  const user = userResult.status === "fulfilled" ? userResult.value : null;
  const displayName = user
    ? (user.fullName ?? [user.firstName, user.lastName].filter(Boolean).join(" "))
    : "";
  const account: AccountDetails = {
    name: displayName || null,
    email:
      user?.primaryEmailAddress?.emailAddress ??
      user?.emailAddresses?.[0]?.emailAddress ??
      null,
  };

  return (
    <div className="flex-1 mx-auto w-full max-w-5xl p-6 sm:p-10">
      <ProfileView
        profile={profile}
        profileError={profileError}
        streak={streak}
        characters={characters}
        charactersError={charactersError}
        badgeDescriptions={badgeDescriptions}
        account={account}
        apiUrl={apiUrl}
      />
    </div>
  );
}
