import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { QuestSessionRunner } from "@/components/quest-session-runner";
import { ApiError, startQuestSession } from "@/lib/api-client";

// The parent (app)/layout.tsx already redirects unauthenticated learners to
// /sign-in before this page renders, so no auth guard is needed here.
export default async function QuestSessionPage({
  params,
}: Readonly<{ params: Promise<{ questId: string }> }>) {
  const { questId } = await params;
  const questIdNumber = Number(questId);
  if (!Number.isInteger(questIdNumber)) {
    notFound();
  }

  const { getToken } = await auth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = await getToken();

  // Starting a Quest Session on navigation, rather than caching it, is
  // deliberate: every visit to this route begins a fresh, correctly-timed
  // Session with its own deadline.
  let session;
  try {
    if (!token) {
      throw new ApiError(401, "Authentication token is required");
    }
    session = await startQuestSession(apiUrl, token, questIdNumber);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    return (
      <div className="flex-1 mx-auto w-full max-w-2xl p-6 sm:p-10">
        <p role="alert" className="text-sm text-destructive">
          This Quest could not be started. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-2xl p-6 sm:p-10">
      <QuestSessionRunner questId={questIdNumber} session={session} apiUrl={apiUrl} />
    </div>
  );
}
