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

  const [profileResult, eventResult] = await Promise.allSettled([
    token ? getProfile(apiUrl, token) : Promise.resolve(null),
    getTodayEvent(apiUrl),
  ]);

  const profile: Profile | null =
    profileResult.status === "fulfilled" ? profileResult.value : null;
  const profileError = profileResult.status === "rejected";
  const event: DailyEvent | null =
    eventResult.status === "fulfilled" ? eventResult.value : null;
  const eventError = eventResult.status === "rejected";

  // Onboarding isn't finished until a Character is chosen — send the
  // learner back to the picker before they reach the platform.
  if (profile && !profile.character) {
    redirect("/");
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
