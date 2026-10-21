export type StageStatusLike = { status: string };

export function countCompleted(stages: readonly StageStatusLike[]): number {
  return stages.filter(({ status }) => status === "completed").length;
}

export function isZoneCleared(stages: readonly StageStatusLike[]): boolean {
  return stages.length > 0 && countCompleted(stages) === stages.length;
}

export function completionSummary(
  zoneStages: readonly (readonly StageStatusLike[])[],
): { total: number; completed: number; percent: number } {
  const total = zoneStages.reduce((sum, stages) => sum + stages.length, 0);
  const completed = zoneStages.reduce((sum, stages) => sum + countCompleted(stages), 0);
  return {
    total,
    completed,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}
