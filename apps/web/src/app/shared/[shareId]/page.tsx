import { SharedProfileView } from "@/components/shared-profile-view";
import { ApiError, getSharedProfile, type SharedProfile } from "@/lib/api-client";

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
    <main className="flex-1 mx-auto w-full max-w-3xl p-6 sm:p-10 space-y-8">
      <h1 className="text-2xl font-bold tracking-tight">Adventurer profile</h1>
      <SharedProfileView profile={profile} error={error} />
    </main>
  );
}
