import type { LearningStreak } from "@/lib/api-client";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
// Intensity classes only reinforce the count and label that every cell also carries.
const SHADES = ["bg-muted", "bg-primary/30", "bg-primary/55", "bg-primary/80"];

/**
 * PAGES.md §14 Learning Streak and Contribution Graph: the counts are always
 * spelled out in text, and the calendar only reinforces them with colour.
 */
export function LearningStreakGraph({ streak }: Readonly<{ streak: LearningStreak | null }>) {
  if (!streak) {
    return (
      <section aria-label="Learning streak" className="space-y-2">
        <p role="alert" className="font-body text-sm font-bold text-btn-danger">
          Your learning history could not be loaded. Please try again later.
        </p>
      </section>
    );
  }

  const totals = streak.days.map((d) => d.reading + d.assessed);
  const activeDays = totals.filter((t) => t > 0).length;
  const reading = streak.days.reduce((n, d) => n + d.reading, 0);
  const assessed = streak.days.reduce((n, d) => n + d.assessed, 0);
  // Weeks run top-to-bottom (Sunday first); pad so the first day lands on its weekday row.
  const leading = new Date(`${streak.from}T00:00:00Z`).getUTCDay();

  return (
    <section aria-label="Learning streak" className="space-y-3">
      <p className="font-body text-sm font-bold text-foreground">
        Current streak: <strong>{plural(streak.currentStreak, "day")}</strong> · Longest streak: <strong>{plural(streak.longestStreak, "day")}</strong>
      </p>
      <p className="font-body text-xs font-bold text-muted-foreground">
        {streak.from} to {streak.to} (Philippine time): {plural(activeDays, "active day")}, {plural(reading, "reading completion")} and {plural(assessed, "assessed accomplishment")}.
        {streak.currentStreak === 0 ? " Complete a lesson or assessment today to start a streak." : ""}
      </p>
      <ol className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1" aria-label="Daily learning contributions, oldest first">
        {Array.from({ length: leading }, (_, i) => <li key={`pad-${i}`} aria-hidden="true" className="h-5 w-5" />)}
        {streak.days.map((day, i) => {
          const total = totals[i]!;
          const label = `${day.date}: ${plural(total, "accomplishment")} (${day.reading} reading, ${day.assessed} assessed)`;
          return (
            <li key={day.date} aria-label={label} title={label}
              className={`flex h-5 w-5 items-center justify-center border-2 border-border text-[10px] leading-none ${SHADES[Math.min(total, 3)]}`}>
              {total > 0 ? total : ""}
            </li>
          );
        })}
      </ol>
      <p className="font-body text-xs font-bold text-muted-foreground">Numbers show qualifying accomplishments per day: completed readings and passed or solved assessed activities. Logins, page views and failed attempts do not count.</p>
    </section>
  );
}
