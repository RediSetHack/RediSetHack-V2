import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getProfile, getTodayEvent, type Profile, type DailyEvent } from "@/lib/api-client";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId, getToken } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = await getToken();

  const [profileResult, eventResult, user] = await Promise.allSettled([
    token ? getProfile(apiUrl, token) : Promise.resolve(null),
    getTodayEvent(apiUrl),
    currentUser(),
  ]);

  const profile: Profile | null =
    profileResult.status === "fulfilled" ? profileResult.value : null;
  const profileError = profileResult.status === "rejected";
  const event: DailyEvent | null =
    eventResult.status === "fulfilled" ? eventResult.value : null;
  const eventError = eventResult.status === "rejected";
  const userValue = user.status === "fulfilled" ? user.value : null;
  const role = (userValue?.publicMetadata?.role as string | undefined) ?? "user";
  const isAdmin = role === "admin";
  const isContributor = isAdmin || role === "contributor";

  // Onboarding isn't finished until a Character is chosen — send the
  // learner back to the picker before they reach the platform.
  if (profile && !profile.character) {
    redirect("/sign-up/complete");
  }

  return (
    <AppShell
      profile={profile}
      profileError={profileError}
      event={event}
      eventError={eventError}
      isAdmin={isAdmin}
      isContributor={isContributor}
    >
      {children}
    </AppShell>
  );
}
