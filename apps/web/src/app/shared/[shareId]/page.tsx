import { SharedProfileView } from "@/components/shared-profile-view";
import { ApiError, getSharedProfile, type SharedProfile } from "@/lib/api-client";
import { Decorations, Window } from "@/components/y2k";

// Public: lives outside the (app) group, so it does not require sign-in.
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
  return (
    <main className="relative min-h-screen y2k-grid flex-1 mx-auto w-full max-w-4xl p-6 sm:p-10 space-y-6">
      <Decorations />
      <div className="relative z-10 space-y-6">
        <Window title="SHARED_PROFILE.EXE">
          <p className="font-pixel text-[11px] leading-relaxed">Adventurer profile</p>
        </Window>
        <SharedProfileView profile={profile} error={error} />
      </div>
    </main>
  );
}
