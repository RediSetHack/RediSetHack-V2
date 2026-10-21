import type { Quest } from "@/lib/api-client";
import { formatMmSs } from "@/lib/format";

/** The Quest outcome vocabulary from `UI/PAGES.md` §0, plus "never taken". */
export type QuestOutcome = "passed" | "not-passed" | "not-taken";

/** The client-side filter tabs on the Quests list (`UI/PAGES.md` §9). */
export type QuestFilter = "all" | "not-taken" | "passed";

export const QUEST_FILTERS: ReadonlyArray<{
  id: QuestFilter;
  label: string;
}> = [
  { id: "all", label: "All" },
  { id: "not-taken", label: "Not taken" },
  { id: "passed", label: "Passed" },
];

/**
 * The learner's outcome for a Quest: never taken, taken but not passed, or
 * passed. Derived from the server-supplied best Result so the client never
 * re-scores an attempt.
 */
export function questOutcome(quest: Quest): QuestOutcome {
  const best = quest.bestResult;
  if (!best) return "not-taken";
  return best.passed ? "passed" : "not-passed";
}

/** The best-Result chip copy: `Passed 90%`, `Not passed` or `Not taken`. */
export function bestResultLabel(quest: Quest): string {
  const best = quest.bestResult;
  if (!best) return "Not taken";
  if (!best.passed) return "Not passed";
  return `Passed ${best.score}%`;
}

/**
 * Filters the already-loaded Quest list client-side by tab and search text.
 * The search matches the title or the description.
 */
export function filterQuests(
  quests: readonly Quest[],
  filter: QuestFilter,
  query: string,
): Quest[] {
  const search = query.trim().toLowerCase();
  return quests.filter((quest) => {
    if (filter === "not-taken" && questOutcome(quest) !== "not-taken") {
      return false;
    }
    if (filter === "passed" && questOutcome(quest) !== "passed") return false;
    if (!search) return true;
    return (
      quest.title.toLowerCase().includes(search) ||
      (quest.description ?? "").toLowerCase().includes(search)
    );
  });
}

/** The start-confirmation dialog copy (`UI/PAGES.md` §9). */
export function startQuestConfirmCopy(quest: Quest): {
  title: string;
  message: string;
} {
  return {
    title: `Start ${quest.title}?`,
    message: `You have ${formatMmSs(quest.timeLimitSeconds)}. The timer starts immediately and submits automatically at zero.`,
  };
}
