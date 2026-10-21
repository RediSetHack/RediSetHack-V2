import { auth } from "@clerk/nextjs/server";
import { ApiError, getQuestResult, getQuests, type Quest } from "@/lib/api-client";
import { ErrorAlert } from "@/components/y2k-dialog";
import { QuestResultNotFound } from "@/components/quest-result-not-found";
import { QuestResultReviewPanel } from "@/components/quest-result-review";

// The parent (app)/layout.tsx already redirects unauthenticated learners to
// /sign-in before this page renders, so no auth guard is needed here.
export default async function QuestResultPage({
  params,
}: Readonly<{ params: Promise<{ resultId: string }> }>) {
  const { resultId } = await params;
  const resultIdNumber = Number(resultId);
  const notFound = (
    <div className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center p-6 sm:p-10">
      <QuestResultNotFound />
    </div>
  );

  if (!Number.isInteger(resultIdNumber) || resultIdNumber <= 0) {
    return notFound;
  }

  const { getToken } = await auth();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const token = await getToken();

  let review;
  try {
    if (!token) {
      throw new ApiError(401, "Authentication token is required");
    }
    review = await getQuestResult(apiUrl, token, resultIdNumber);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return notFound;
    }
    return (
      <div className="mx-auto w-full max-w-2xl flex-1 p-6 sm:p-10">
        <ErrorAlert
          message="This Result could not be loaded. Please try again later."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  let quest: Quest | undefined;
  try {
    quest = (await getQuests(apiUrl, token ?? "")).find(
      (item) => item.id === review.questId,
    );
  } catch {
    // The review remains useful if the current Quest catalog is temporarily unavailable.
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-6 sm:p-10">
      <QuestResultReviewPanel
        review={review}
        questTitle={quest?.title ?? "Quest Review"}
        fallbackPassingScore={quest?.passingScore}
      />
    </div>
  );
}
