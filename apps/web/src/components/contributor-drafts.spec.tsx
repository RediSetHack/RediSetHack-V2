import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("tok") }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import type { ContributorDraftItem } from "@/lib/api-client";
import { ContributorAccessDenied, ContributorDrafts } from "./contributor-drafts";

function makeDraft(overrides: Partial<ContributorDraftItem> = {}): ContributorDraftItem {
  return {
    id: 1,
    zoneId: 2,
    title: "Loops in disguise",
    lessonContent: [],
    status: "draft",
    revision: 2,
    submittedRevision: null,
    createdAt: "2026-10-19T00:00:00Z",
    updatedAt: "2026-10-19T00:00:00Z",
    submittedAt: null,
    ...overrides,
  };
}

describe("Contributor drafts", () => {
  it("shows every draft in a window with its revision and status", () => {
    const markup = renderToStaticMarkup(
      <ContributorDrafts
        apiUrl="http://api.test"
        initial={[makeDraft({ status: "submitted" })]}
      />,
    );

    expect(markup).toContain("Loops in disguise");
    expect(markup).toContain("Rev 2");
    expect(markup).toContain("Submitted");
  });

  it("labels a revision the reviewers sent back", () => {
    const markup = renderToStaticMarkup(
      <ContributorDrafts
        apiUrl="http://api.test"
        initial={[makeDraft({ status: "revision-needed" })]}
      />,
    );

    expect(markup).toContain("Revision needed");
  });

  it("shows the empty state with a NEW DRAFT action when there are no drafts", () => {
    const markup = renderToStaticMarkup(
      <ContributorDrafts apiUrl="http://api.test" initial={[]} />,
    );

    expect(markup).toContain("No drafts yet. Start one to propose a new Stage.");
    expect(markup).toContain("NEW DRAFT");
  });
});

describe("Contributor access denied", () => {
  it("is an info dialog that says why the drafts are closed", () => {
    const markup = renderToStaticMarkup(<ContributorAccessDenied />);

    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain("lucide-info");
    expect(markup).toContain("Only approved contributors can write drafts.");
  });
});
