/**
 * Pure paging arithmetic for the leaderboard listing. The server computes
 * rank, XP, and ordering; this only turns (page, limit, total) into the
 * numbers a pager needs to render and navigate.
 */
export interface PageInfo {
  page: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
  previousPage: number | null;
  nextPage: number | null;
}

export function getPageInfo(page: number, limit: number, total: number): PageInfo {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const clampedPage = Math.min(Math.max(1, page), totalPages);
  const hasPrevious = clampedPage > 1;
  const hasNext = clampedPage < totalPages;

  return {
    page: clampedPage,
    totalPages,
    hasPrevious,
    hasNext,
    previousPage: hasPrevious ? clampedPage - 1 : null,
    nextPage: hasNext ? clampedPage + 1 : null,
  };
}

/** Parses a `?page=` search param into a valid page number, defaulting to 1. */
export function parsePageParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number.parseInt(raw, 10) : 1;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
