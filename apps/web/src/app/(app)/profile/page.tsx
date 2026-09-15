import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile-view";
import { getCharacters, getProfile, type CharacterOption, type Profile } from "@/lib/api-client";

export default async function ProfilePage() {
  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = await getToken();

  let profile: Profile | null = null;
  let profileError = false;
  let characters: CharacterOption[] = [];
  let charactersError = false;

  try {
    profile = token ? await getProfile(apiUrl, token) : null;
  } catch (error) {
    console.error("Failed to load profile:", error);
    profileError = true;
  }

  try {
    characters = await getCharacters(apiUrl);
  } catch (error) {
    console.error("Failed to load character catalog:", error);
    charactersError = true;
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-4xl p-6 sm:p-10 space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
      <ProfileView
        profile={profile}
        profileError={profileError}
        characters={characters}
        charactersError={charactersError}
        apiUrl={apiUrl}
      />
    </div>
  );
}
