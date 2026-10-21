import { SharedProfileView } from "@/components/shared-profile-view";
import { MinimalHeader } from "@/components/app-shell";
import { ApiError, getBadgeDefinitions, getSharedProfile, type SharedProfile } from "@/lib/api-client";
import { Decorations } from "@/components/y2k";

// Public: lives outside the (app) group, so it does not require sign-in and
// renders without the signed-in App Shell (no Player chip, Event banner or
// Taskbar) — just the wordmark, the public summary and the desktop backdrop.
export default async function SharedProfilePage({ params }: Readonly<{ params: Promise<{ shareId: string }> }>) {
  const { shareId } = await params;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  let profile: SharedProfile | null = null;
  let error = false;
  try {
    profile = await getSharedProfile(apiUrl, shareId);
  } catch (e) {
    error = !(e instanceof ApiError && e.status === 404);
  }

  // Badge descriptions live in the public Badge catalog; the shared summary
  // only carries the earned Badges, so the tooltip text is looked up by slug.
  const badgeDescriptions: Record<string, string> = {};
  try {
    for (const definition of await getBadgeDefinitions(apiUrl)) {
      if (definition.description) {
        badgeDescriptions[definition.slug] = definition.description;
      }
    }
  } catch {
    // The summary still renders without the tooltips.
  }

  return (
    <div className="y2k-grid relative flex min-h-screen flex-col pb-12">
      <Decorations />
      <MinimalHeader />
      <main className="relative z-10 mx-auto w-full max-w-4xl flex-1 p-6 sm:p-10">
        <SharedProfileView
          profile={profile}
          error={error}
          badgeDescriptions={badgeDescriptions}
        />
      </main>
    </div>
  );
}
