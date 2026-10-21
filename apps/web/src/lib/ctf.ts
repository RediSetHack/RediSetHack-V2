import type { CtfAttempt, CtfSummary } from "@/lib/api-client";

/** The difficulty of a CTF challenge, spelled out for the learner. */
export const CTF_DIFFICULTY_LABELS: Record<CtfSummary["difficulty"], string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

/** How a flag attempt ended, so the view can pick an icon and a colour. */
export type FlagVerdict = {
  message: string;
  tone: "success" | "error";
};

/**
 * The copy shown after a flag attempt. A replayed correct flag says so and
 * never promises XP twice (`UI/PAGES.md` §0: status is stated in text).
 */
export function flagVerdict(result: CtfAttempt): FlagVerdict {
  if (!result.correct) {
    return {
      message: "Not the flag. Check the artifact and try again.",
      tone: "error",
    };
  }
  if (result.alreadySolved) {
    return {
      message: "Correct — you already solved this one.",
      tone: "success",
    };
  }
  return {
    message: `Correct! +${result.xpAwarded} XP earned.`,
    tone: "success",
  };
}

/**
 * A safe download name for the artifact. The name comes from the API, so it
 * is reduced to characters a file system accepts.
 */
export function artifactFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^\w.-]+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
  return cleaned.length > 0 ? cleaned : "artifact.txt";
}
