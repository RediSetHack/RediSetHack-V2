export function findNovelResume<Z extends { id: number }, S extends { id: number; status: string }>(
  chapters: { zone: Z; stages: S[] }[],
) {
  return chapters
    .flatMap(({ zone, stages }) => stages.map((stage) => ({ zone, stage })))
    .find(({ stage }) => stage.status === 'available');
}
