import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: () => Promise.resolve("token") }),
  useClerk: () => ({ signOut: vi.fn() }),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

import { ReviewQueueView } from "@/app/(app)/admin/review/review-queue-list";
import { ReviewDecisionForm, ReviewHistory, isPublished } from "@/app/(app)/admin/review/review-detail";
import { zone } from "@/lib/admin-fixtures";
import type { ReviewDecisionRecord, ReviewQueueItem } from "@/lib/api-client";

const row: ReviewQueueItem = {
  id: 7,
  ownerId: "user_abc",
  zoneId: 10,
  title: "Loops in disguise",
  lessonContent: [],
  status: "submitted",
  revision: 3,
  submittedRevision: 2,
  createdAt: "2026-10-19T00:00:00Z",
  updatedAt: "2026-10-19T00:00:00Z",
  submittedAt: "2026-10-20T00:00:00Z",
};

const record = (overrides: Partial<ReviewDecisionRecord>): ReviewDecisionRecord => ({
  id: 1,
  draftId: 7,
  revision: 2,
  title: "Loops in disguise",
  lessonContent: [],
  decision: "approved",
  reviewerId: "admin",
  reason: "Looks good",
  reviewedAt: "2026-10-21T00:00:00Z",
  publishedStageId: 5,
  ...overrides,
});

describe("ReviewQueueView", () => {
  it("shows the empty state when nothing is waiting", () => {
    expect(renderToStaticMarkup(<ReviewQueueView rows={[]} zones={[]} />)).toContain("No revisions waiting for review.");
  });

  it("lists title, zone, contributor, revision and a link to the detail", () => {
    const html = renderToStaticMarkup(<ReviewQueueView rows={[row]} zones={[zone(10, 1, "Shell")]} />);
    for (const text of ["Loops in disguise", "Shell", "user_abc", "/admin/review/7"]) expect(html).toContain(text);
  });
});

describe("ReviewDecisionForm", () => {
  it("offers approve, request revision and reject with a required note", () => {
    const html = renderToStaticMarkup(<ReviewDecisionForm busy={false} onDecide={vi.fn()} onNoteMissing={vi.fn()} />);
    for (const text of ["Reviewer note (required)", "APPROVE", "REQUEST REVISION", "REJECT"]) expect(html).toContain(text);
  });
});

describe("review history", () => {
  it("renders each decision with its note", () => {
    expect(renderToStaticMarkup(<ReviewHistory history={[record({})]} />)).toContain("Looks good");
  });

  it("treats only an unreverted approval as published", () => {
    expect(isPublished([record({})])).toBe(true);
    expect(isPublished([record({}), record({ id: 2, decision: "unpublished", publishedStageId: null })])).toBe(false);
    expect(isPublished([])).toBe(false);
  });
});
