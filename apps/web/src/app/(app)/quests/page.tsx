import { auth } from "@clerk/nextjs/server";
import { QuestList } from "@/components/quest-list";
import { Sparkle, Window } from "@/components/y2k";
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
    <div className="mx-auto w-full max-w-4xl flex-1 space-y-6 p-6 sm:p-10">
      <Window title="QUESTS.EXE">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-pixel text-xl leading-relaxed text-foreground">Quests</h1>
            <p className="mt-2 font-body text-sm font-bold text-muted-foreground">
              Timed quizzes. Pass to earn XP — first pass only.
            </p>
          </div>
          <Sparkle size={20} />
        </div>
      </Window>
      <QuestList quests={quests} error={error} />
    </div>
  );
}
