import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApiError, getQuestResult } from "@/lib/api-client";

// The parent (app)/layout.tsx already redirects unauthenticated learners to
// /sign-in before this page renders, so no auth guard is needed here.
export default async function QuestResultPage({
  params,
}: Readonly<{ params: Promise<{ resultId: string }> }>) {
  const { resultId } = await params;
  const resultIdNumber = Number(resultId);
  if (!Number.isInteger(resultIdNumber)) {
    notFound();
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
      notFound();
    }
    return (
      <div className="flex-1 mx-auto w-full max-w-2xl p-6 sm:p-10">
        <p role="alert" className="text-sm text-destructive">
          This Result could not be loaded. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-2xl space-y-6 p-6 sm:p-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Quest Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {review.passed ? "Passed" : "Not passed"} • Score: {review.score}%
        </p>
      </div>

      <ol className="space-y-4">
        {review.breakdown.map((item, questionIndex) => (
          <li key={item.questionId} className="rounded-xl border border-border bg-card p-4">
            <p className="font-medium text-foreground">
              {questionIndex + 1}. {item.prompt}
            </p>
            <ul className="mt-2 space-y-1">
              {item.options.map((option) => {
                const wasChosen = option.id === item.chosenOptionId;
                return (
                  <li
                    key={option.id}
                    className={`rounded-lg px-2 py-1 text-sm ${
                      option.isCorrect
                        ? "bg-green-500/10 text-green-700 dark:text-green-400"
                        : wasChosen
                          ? "bg-destructive/10 text-destructive"
                          : "text-muted-foreground"
                    }`}
                  >
                    {option.text}
                    {option.isCorrect && " — Correct answer"}
                    {wasChosen && !option.isCorrect && " — Your answer"}
                    {wasChosen && option.isCorrect && " — Your answer"}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/quests/${review.questId}/session`}
          className="rounded-lg border border-input bg-background px-2.5 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Retake Quest
        </Link>
        <Link
          href="/quests"
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium hover:bg-muted"
        >
          Back to Quests
        </Link>
      </div>
    </div>
  );
}
