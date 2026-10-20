import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError, getQuestResult } from "@/lib/api-client";
import { StatusChip, Window, buttonClasses, EmptyState } from "@/components/y2k";
import { ErrorAlert } from "@/components/y2k-dialog";

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
      <div className="mx-auto w-full max-w-2xl flex-1 p-6 sm:p-10">
        <ErrorAlert
          message="This Result could not be loaded. Please try again later."
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  const submittedAt = new Date(review.submittedAt).toLocaleString("en-US");

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 space-y-4 p-6 sm:p-10">
      <Window title={`RESULT ${review.resultId}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-pixel text-lg leading-relaxed text-foreground">Quest Review</h1>
            <p className="mt-2 font-pixel-lg text-xl text-foreground">Score: {review.score}%</p>
            <p className="mt-2 font-body text-sm font-bold text-muted-foreground">
              Submitted {submittedAt}
            </p>
          </div>
          <StatusChip
            status={review.passed ? "passed" : "not-passed"}
            label={review.passed ? "Passed" : "Not passed"}
          />
        </div>
      </Window>

      {review.breakdown.length === 0 ? (
        <Window title="NO QUESTIONS">
          <EmptyState title="No questions to review." />
        </Window>
      ) : (
        <ol className="space-y-4">
          {review.breakdown.map((item, questionIndex) => (
            <li key={item.questionId}>
              <Window title={`QUESTION ${questionIndex + 1}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-body text-base font-bold text-foreground">{item.prompt}</p>
                  <StatusChip
                    status={item.isCorrect ? "passed" : "not-passed"}
                    label={item.isCorrect ? "Correct" : "Incorrect"}
                  />
                </div>
                <ul className="mt-3 space-y-2">
                  {item.options.map((option) => {
                    const wasChosen = option.id === item.chosenOptionId;
                    const optionIcon = option.isCorrect ? (
                      <Check aria-hidden="true" className="size-4 shrink-0" />
                    ) : wasChosen ? (
                      <X aria-hidden="true" className="size-4 shrink-0" />
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden="true" />
                    );
                    return (
                      <li
                        key={option.id}
                        className={cn(
                          "flex items-center gap-2 border-2 border-border px-3 py-2 font-body text-sm font-bold shadow-[2px_2px_0_var(--border)]",
                          option.isCorrect && "bg-[#59D98F] text-foreground",
                          wasChosen && !option.isCorrect && "bg-btn-danger text-white",
                          !option.isCorrect && !wasChosen && "bg-white text-muted-foreground",
                        )}
                      >
                        {optionIcon}
                        <span>{option.text}</span>
                        <span className="ml-auto flex flex-wrap gap-1 font-pixel text-[8px] leading-relaxed uppercase">
                          {option.isCorrect && <span>Correct answer</span>}
                          {wasChosen && <span>Your answer</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </Window>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/quests/${review.questId}/session`} className={buttonClasses("primary")}>
          Retake Quest
        </Link>
        <Link href="/quests" className={buttonClasses("secondary")}>
          Back to Quests
        </Link>
      </div>
    </div>
  );
}
