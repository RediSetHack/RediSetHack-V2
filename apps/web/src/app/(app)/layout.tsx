import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getProfile, getTodayEvent, type Profile, type DailyEvent } from "@/lib/api-client";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = await getToken();

  let profile: Profile | null = null;
  let profileError = false;
  try {
    profile = token ? await getProfile(apiUrl, token) : null;
  } catch {
    profileError = true;
  }

  // Onboarding isn't finished until a Character is chosen — send the
  // learner back to the picker before they reach the platform.
  if (profile && !profile.character) {
    redirect("/");
  }

  let event: DailyEvent | null = null;
  let eventError = false;
  try {
    event = await getTodayEvent(apiUrl);
  } catch {
    eventError = true;
  }

  return (
    <AppShell
      profile={profile}
      profileError={profileError}
      event={event}
      eventError={eventError}
    >
      {children}
    </AppShell>
  );
}
