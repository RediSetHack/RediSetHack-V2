export function formatXp(xp: number): string {
  return `${xp.toLocaleString("en-US")} XP`;
}

export function formatMmSs(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// Mirrors apps/api level-calculator: level n starts at (n-1)^2 * XP_PER_LEVEL.
export const XP_PER_LEVEL = 100;

export function levelFromXp(totalXp: number): number {
  return Math.floor(Math.sqrt(Math.max(totalXp, 0) / XP_PER_LEVEL)) + 1;
}

export function levelStartXp(level: number): number {
  return (level - 1) ** 2 * XP_PER_LEVEL;
}

export function levelProgress(totalXp: number): {
  level: number;
  intoLevel: number;
  span: number;
} {
  const level = levelFromXp(totalXp);
  const start = levelStartXp(level);
  const next = levelStartXp(level + 1);
  return { level, intoLevel: totalXp - start, span: next - start };
}

export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length || to < 0 || to >= next.length) return next;
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
