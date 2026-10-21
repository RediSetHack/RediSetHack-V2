import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

import type { CtfSummary } from "@/lib/api-client";
import { CtfChallengeList } from "./ctf-challenge-list";

function makeChallenge(overrides: Partial<CtfSummary> = {}): CtfSummary {
  return {
    id: 1,
    title: "Decode the payload",
    category: "web",
    difficulty: "beginner",
    skills: ["javascript"],
    xpReward: 80,
    solved: false,
    ...overrides,
  };
}

describe("CTF challenge list", () => {
  it("shows every challenge in its own window with category, difficulty and XP", () => {
    const markup = renderToStaticMarkup(
      <CtfChallengeList error={false} challenges={[makeChallenge()]} />,
    );

    expect(markup).toContain("Decode the payload");
    expect(markup).toContain("web");
    expect(markup).toContain("Beginner");
    expect(markup).toContain("80 XP");
    expect(markup).toContain("javascript");
  });

  it("marks a solved challenge with the Solved chip", () => {
    const markup = renderToStaticMarkup(
      <CtfChallengeList error={false} challenges={[makeChallenge({ solved: true })]} />,
    );

    expect(markup).toContain("Solved");
    expect(markup).not.toContain("Unsolved");
  });

  it("marks an unsolved challenge with the Unsolved chip", () => {
    const markup = renderToStaticMarkup(
      <CtfChallengeList error={false} challenges={[makeChallenge()]} />,
    );

    expect(markup).toContain("Unsolved");
  });

  it("links every challenge to its view", () => {
    const markup = renderToStaticMarkup(
      <CtfChallengeList error={false} challenges={[makeChallenge({ id: 4 })]} />,
    );

    expect(markup).toContain('href="/ctf?challenge=4"');
    expect(markup).toContain("OPEN CHALLENGE");
  });
});

describe("CTF list states", () => {
  it("shows the empty state when there are no challenges", () => {
    const markup = renderToStaticMarkup(
      <CtfChallengeList error={false} challenges={[]} />,
    );

    expect(markup).toContain(
      "No challenges available yet. Finish more Stages to unlock them.",
    );
  });

  it("shows the error state when the challenges could not be loaded", () => {
    const markup = renderToStaticMarkup(
      <CtfChallengeList error={true} challenges={null} />,
    );

    expect(markup).toContain(
      "Challenges could not be loaded. Please try again later.",
    );
  });
});
