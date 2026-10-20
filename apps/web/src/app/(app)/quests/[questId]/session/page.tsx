import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { QuestSessionRunner } from "@/components/quest-session-runner";
import { ErrorAlert } from "@/components/y2k-dialog";
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

  // Visiting this route starts a Quest Session, or resumes the learner's
  // unexpired one with its original server deadline; once a Session is
  // submitted or expired, visiting again is an explicit retake.
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
      <div className="mx-auto w-full max-w-2xl flex-1 p-6 sm:p-10">
        <ErrorAlert
          message={
            error instanceof ApiError && error.status === 403
              ? error.message
              : "This Quest could not be started. Please try again later."
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 p-6 sm:p-10">
      <QuestSessionRunner questId={questIdNumber} session={session} apiUrl={apiUrl} />
    </div>
  );
}
