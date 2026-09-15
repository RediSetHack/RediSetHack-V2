import { auth } from "@clerk/nextjs/server";
import { QuestList } from "@/components/quest-list";
import { getQuests, type Quest } from "@/lib/api-client";

// The parent (app)/layout.tsx already redirects unauthenticated learners to
// /sign-in before this page renders, so no auth guard is needed here.
export default async function QuestsPage() {
  const { getToken } = await auth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = await getToken();

  let quests: Quest[] | null = null;
  let error = false;
  try {
    quests = await getQuests(apiUrl, token ?? "");
  } catch {
    error = true;
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-4xl p-6 sm:p-10 space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Quests</h1>
      <QuestList quests={quests} error={error} />
    </div>
  );
}
