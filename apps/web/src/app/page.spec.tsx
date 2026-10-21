import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const {
  mockAuth,
  mockCurrentUser,
  mockGetCurrentUser,
  mockGetProfile,
  mockGetTodayEvent,
  mockGetRegions,
  mockGetZones,
  mockGetStages,
  mockGetLeaderboard,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockCurrentUser: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockGetProfile: vi.fn(),
  mockGetTodayEvent: vi.fn(),
  mockGetRegions: vi.fn(),
  mockGetZones: vi.fn(),
  mockGetStages: vi.fn(),
  mockGetLeaderboard: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  currentUser: mockCurrentUser,
}));

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("token") }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/lib/api-client", () => ({
  getCurrentUser: mockGetCurrentUser,
  getProfile: mockGetProfile,
  getTodayEvent: mockGetTodayEvent,
  getRegions: mockGetRegions,
  getZones: mockGetZones,
  getStages: mockGetStages,
  getLeaderboard: mockGetLeaderboard,
}));

import Home, { resolveResume } from "./page";

describe("Landing / Home Page", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://localhost:3001");
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("Signed-out Visitor Landing (§1)", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: null,
        getToken: vi.fn().mockResolvedValue(null),
      });
      mockCurrentUser.mockResolvedValue(null);
    });

    it("renders WELCOME.EXE hero with h1, sub-copy, SIGN UP, and SIGN IN", async () => {
      const html = renderToStaticMarkup(await Home());
      expect(html).toContain("WELCOME.EXE");
      expect(html).toContain("<h1");
      expect(html).toContain("Learn to code. Level up.");
      expect(html).toContain('href="/sign-up"');
      expect(html).toContain("SIGN UP");
      expect(html).toContain('href="/sign-in"');
      expect(html).toContain("SIGN IN");
    });

    it("renders the 4 staggered feature windows", async () => {
      const html = renderToStaticMarkup(await Home());
      expect(html).toContain("MAP.EXE");
      expect(html).toContain("Progress through Regions and Zones");
      expect(html).toContain("QUESTS.EXE");
      expect(html).toContain("Timed quizzes with XP rewards");
      expect(html).toContain("CODELAB.EXE");
      expect(html).toContain("Run code in five languages");
      expect(html).toContain("BADGES.EXE");
      expect(html).toContain("Collect Badges and earn XP");
    });

    it("renders the five-language desktop icon strip", async () => {
      const html = renderToStaticMarkup(await Home());
      expect(html).toContain("Python");
      expect(html).toContain("JavaScript");
      expect(html).toContain("C++");
      expect(html).toContain("C");
      expect(html).toContain("Java");
    });

    it("renders TOP LEARNERS teaser with 3 learner rows", async () => {
      const html = renderToStaticMarkup(await Home());
      expect(html).toContain("TOP LEARNERS");
      expect(html).toContain("#1");
      expect(html).toContain("#2");
      expect(html).toContain("#3");
    });

    it("renders footer with copyright and ××× divider", async () => {
      const html = renderToStaticMarkup(await Home());
      expect(html).toContain("© RediSetHack");
      expect(html).toContain("×××");
    });

    it("contains no emoji or gradient text", async () => {
      const html = renderToStaticMarkup(await Home());
      // No emojis in the supplementary unicode plane
      expect(html).not.toMatch(/[\uD800-\uDBFF][\uDC00-\uDFFF]/);
      expect(html).not.toContain("bg-gradient");
      expect(html).not.toContain("bg-clip-text");
    });
  });

  describe("Signed-in Learner Continue Hub (§1)", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({
        userId: "user_42",
        getToken: vi.fn().mockResolvedValue("mock-token"),
      });
      mockCurrentUser.mockResolvedValue({
        id: "user_42",
        firstName: "Ada",
        primaryEmailAddress: { emailAddress: "ada@example.com" },
      });
      mockGetCurrentUser.mockResolvedValue({
        id: "user_42",
        email: "ada@example.com",
        totalXp: 500,
      });
      mockGetProfile.mockResolvedValue({
        userId: "user_42",
        adventurerRank: 3,
        level: 3,
        totalXp: 500,
        character: { id: 1, name: "Ada", slug: "ada", imageUrl: null },
        badges: [{ badgeId: 1, count: 2 }],
      });
      mockGetTodayEvent.mockResolvedValue({
        id: 1,
        eventType: "bonus",
        xpMultiplier: 2,
        eventDate: "2026-10-21",
      });
      mockGetRegions.mockResolvedValue([
        { id: 10, name: "Binary Woods", slug: "binary-woods" },
      ]);
      mockGetZones.mockResolvedValue([
        { id: 20, regionId: 10, name: "Variables Glade", slug: "variables-glade" },
      ]);
      mockGetStages.mockResolvedValue([
        {
          id: 30,
          zoneId: 20,
          title: "Declaring Variables",
          slug: "declaring-variables",
          xpReward: 50,
          status: "available",
          sortOrder: 1,
        },
      ]);
    });

    it("renders Continue card linking to the next unlocked Stage with Region › Zone, title, and XP", async () => {
      const html = renderToStaticMarkup(await Home());
      expect(html).toContain("CONTINUE.EXE");
      expect(html).toContain("Continue where you left off");
      expect(html).toContain("Binary Woods › Variables Glade");
      expect(html).toContain("Declaring Variables");
      expect(html).toContain("50 XP");
      expect(html).toContain('href="/map/10/20/30"');
      expect(html).toContain("CONTINUE");
    });

    it("renders today's Event card with bonus XP indicator", async () => {
      const html = renderToStaticMarkup(await Home());
      expect(html).toContain("TODAY.EXE");
      expect(html).toContain("BONUS DAY ×2 XP");
    });

    it("renders the 3 stat tiles: Rank, Total XP, and Badges count", async () => {
      const html = renderToStaticMarkup(await Home());
      expect(html).toContain("RANK.EXE");
      expect(html).toContain("LV 3");
      expect(html).toContain("XP.EXE");
      expect(html).toContain("500 XP");
      expect(html).toContain("BADGES.EXE");
      expect(html).toContain("2");
    });

    it("renders quick links for QUESTS and CODELAB", async () => {
      const html = renderToStaticMarkup(await Home());
      expect(html).toContain('href="/quests"');
      expect(html).toContain("QUESTS");
      expect(html).toContain('href="/codelab"');
      expect(html).toContain("CODELAB");
    });
  });

  describe("Unregistered user state", () => {
    it("renders UnregisteredUserCard dialog when user has no DB account", async () => {
      mockAuth.mockResolvedValue({
        userId: "user_new",
        getToken: vi.fn().mockResolvedValue("mock-token"),
      });
      mockCurrentUser.mockResolvedValue({
        id: "user_new",
        firstName: "Newbie",
        primaryEmailAddress: { emailAddress: "newbie@example.com" },
      });
      mockGetCurrentUser.mockResolvedValue(null); // Unregistered!

      const html = renderToStaticMarkup(await Home());
      expect(html).toContain('role="dialog"');
      expect(html).toContain("SETUP.EXE");
      expect(html).toContain("We&#x27;re still setting up your account");
      expect(html).toContain("RETRY SYNC");
      expect(html).toContain("SIGN OUT");
    });
  });

  describe("resolveResume", () => {
    it("resolves to the next available Stage", async () => {
      mockGetRegions.mockResolvedValue([{ id: 1, name: "Region 1" }]);
      mockGetZones.mockResolvedValue([{ id: 2, regionId: 1, name: "Zone 2" }]);
      mockGetStages.mockResolvedValue([
        { id: 101, title: "Stage 1", status: "completed", xpReward: 25 },
        { id: 102, title: "Stage 2", status: "available", xpReward: 50 },
      ]);

      const result = await resolveResume("http://localhost:3001", "tok");
      expect(result).toEqual({
        href: "/map/1/2/102",
        stageTitle: "Stage 2",
        regionName: "Region 1",
        zoneName: "Zone 2",
        xpReward: 50,
      });
    });

    it("falls back to /map when no available stage is found", async () => {
      mockGetRegions.mockResolvedValue([]);
      const result = await resolveResume("http://localhost:3001", "tok");
      expect(result).toEqual({ href: "/map", stageTitle: "Map" });
    });
  });
});
