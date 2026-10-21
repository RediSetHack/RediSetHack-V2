import Link from "next/link";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QuestResultReview } from "@/lib/api-client";
import {
  buttonClasses,
  EmptyState,
  StatusChip,
  Window,
} from "@/components/y2k";

/** The Result's submission time, or a dash when the API sent no usable date. */
export function formatSubmittedAt(submittedAt: string): string {
  const date = new Date(submittedAt);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US");
}

/**
 * The Result Review window: a summary of the submission plus every question
 * with the learner's answer and the correct answer marked with both an icon
 * and words, so the marking never relies on colour alone.
 */
export function QuestResultReviewPanel({
  review,
  questTitle,
  fallbackPassingScore,
}: Readonly<{
  review: QuestResultReview;
  questTitle: string;
  /** The Quest's current passing score, used when the Result predates it. */
  fallbackPassingScore?: number;
}>) {
  const passingScore =
    review.passingScore !== undefined
      ? review.passingScore
      : (fallbackPassingScore ?? null);
  const xpAwarded = review.xpAwarded ?? 0;

  return (
    <>
      <Window title={`RESULT ${review.resultId}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-pixel text-lg leading-relaxed text-foreground">
              {questTitle}
            </h1>
            <p className="mt-2 font-pixel-lg text-xl text-foreground">
              Score: {review.score}%
            </p>
            <p className="mt-2 font-body text-sm font-bold text-muted-foreground">
              Submitted {formatSubmittedAt(review.submittedAt)}
            </p>
          </div>
          <StatusChip
            status={review.passed ? "passed" : "not-passed"}
            label={review.passed ? "Passed" : "Not passed"}
          />
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-2 border-t-2 border-border pt-3 font-body text-sm font-bold">
          <div>
            <dt className="text-muted-foreground">Passing score</dt>
            <dd className="text-foreground">
              {passingScore === null ? "—" : `${passingScore}%`}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">XP awarded</dt>
            <dd className="text-foreground">{xpAwarded} XP</dd>
          </div>
        </dl>
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
                  <p className="font-body text-base font-bold text-foreground">
                    {item.prompt}
                  </p>
                  <StatusChip
                    status={item.isCorrect ? "passed" : "not-passed"}
                    label={item.isCorrect ? "Correct" : "Incorrect"}
                  />
                </div>
                <ul className="mt-3 space-y-2">
                  {item.options.map((option) => {
                    const wasChosen = option.id === item.chosenOptionId;
                    const isCorrect = option.isCorrect;
                    const marker = isCorrect ? (
                      <Check
                        aria-hidden="true"
                        data-testid="option-correct"
                        className="size-4 shrink-0"
                      />
                    ) : wasChosen ? (
                      <X
                        aria-hidden="true"
                        data-testid="option-incorrect"
                        className="size-4 shrink-0"
                      />
                    ) : (
                      <span className="size-4 shrink-0" aria-hidden="true" />
                    );
                    return (
                      <li
                        key={option.id}
                        className={cn(
                          "flex items-center gap-2 border-2 border-border px-3 py-2 font-body text-sm font-bold shadow-[2px_2px_0_var(--border)]",
                          isCorrect && "bg-[#59D98F] text-foreground",
                          wasChosen && !isCorrect && "bg-btn-danger text-white",
                          !isCorrect && !wasChosen && "bg-white text-muted-foreground",
                        )}
                      >
                        {marker}
                        <span>{option.text}</span>
                        <span className="ml-auto flex flex-wrap gap-1 font-pixel text-[8px] leading-relaxed uppercase">
                          {isCorrect && <span>Correct answer</span>}
                          {wasChosen && <span>Your answer</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {item.chosenOptionId === null && (
                  <p className="mt-2 font-body text-sm font-bold text-muted-foreground">
                    Not answered
                  </p>
                )}
              </Window>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href={`/quests/${review.questId}/session`} className={buttonClasses("primary")}>
          RETAKE QUEST
        </Link>
        <Link href="/quests" className={buttonClasses("secondary")}>
          BACK TO QUESTS
        </Link>
      </div>
    </>
  );
}
