import { auth } from "@clerk/nextjs/server";
import { ProfileView } from "@/components/profile-view";
import { getCharacters, getLearningStreak, getProfile, type CharacterOption, type LearningStreak, type Profile } from "@/lib/api-client";

// The parent (app)/layout.tsx already redirects unauthenticated learners to
// /sign-in before this page renders, so no auth guard is needed here.
export default async function ProfilePage() {
  const { getToken } = await auth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = await getToken();

  const [profileResult, charactersResult, streakResult] = await Promise.allSettled([
    token ? getProfile(apiUrl, token) : Promise.resolve(null),
    getCharacters(apiUrl),
    token ? getLearningStreak(apiUrl, token) : Promise.resolve(null),
  ]);

  const profile: Profile | null =
    profileResult.status === "fulfilled" ? profileResult.value : null;
  const profileError = profileResult.status === "rejected";
  const characters: CharacterOption[] =
    charactersResult.status === "fulfilled" ? charactersResult.value : [];
  const streak: LearningStreak | null = streakResult.status === "fulfilled" ? streakResult.value : null;
  const charactersError = charactersResult.status === "rejected";

  return (
    <div className="flex-1 mx-auto w-full max-w-4xl p-6 sm:p-10 space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
      <ProfileView
        profile={profile}
        profileError={profileError}
        streak={streak}
        characters={characters}
        charactersError={charactersError}
        apiUrl={apiUrl}
      />
    </div>
  );
}
