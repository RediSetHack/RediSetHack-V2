import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { AppShell, MinimalHeader } from "./app-shell";
import { PlayerChip } from "./player-chip";
import { EventBanner } from "./event-banner";
import { Taskbar } from "./taskbar";
import type { DailyEvent, Profile } from "@/lib/api-client";

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/map",
}));

const mockProfile: Profile = {
  userId: "user-123",
  totalXp: 1240,
  level: 4,
  adventurerRank: 4,
  character: {
    id: 1,
    name: "Ada Lovelace",
    slug: "ada",
    imageUrl: "https://example.com/ada.png",
  },
  badges: [],
  accomplishments: {
    novelsCompleted: 1,
    sideQuestsCompleted: 2,
    ctfsSolved: 0,
  },
  sharing: {
    shareId: null,
  },
  activity: [],
  initialCompetencyBaseline: null,
};

const normalEvent: DailyEvent = {
  id: 1,
  eventDate: "2026-10-21",
  eventType: "normal",
  xpMultiplier: 1,
};

const bonusEvent: DailyEvent = {
  id: 2,
  eventDate: "2026-10-21",
  eventType: "bonus",
  xpMultiplier: 2,
};

describe("PlayerChip", () => {
  it("renders player avatar, character name, level progress bar, and total XP", () => {
    const html = renderToStaticMarkup(
      <PlayerChip profile={mockProfile} isAdmin={false} />,
    );
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("LV 4");
    expect(html).toContain('aria-label="XP to next Level"');
    expect(html).toContain("1,240 XP");
    expect(html).toContain('href="/profile"');
    expect(html).toContain("Sign out");
  });

  it("renders ADMIN chip when user is an admin", () => {
    const html = renderToStaticMarkup(
      <PlayerChip profile={mockProfile} isAdmin={true} />,
    );
    expect(html).toContain('data-testid="admin-chip"');
    expect(html).toContain("ADMIN");
  });

  it("does not render ADMIN chip for non-admin players", () => {
    const html = renderToStaticMarkup(
      <PlayerChip profile={mockProfile} isAdmin={false} />,
    );
    expect(html).not.toContain('data-testid="admin-chip"');
  });

  it("renders the error copy with role=alert on profile load failure", () => {
    const html = renderToStaticMarkup(
      <PlayerChip profile={null} isAdmin={false} error={true} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Your profile could not be loaded.");
  });

  it("renders null when profile is null without error", () => {
    const html = renderToStaticMarkup(
      <PlayerChip profile={null} isAdmin={false} error={false} />,
    );
    expect(html).toBe("");
  });
});

describe("EventBanner variants", () => {
  const todayKey = `rsh-event-dismissed-${new Date().toISOString().slice(0, 10)}`;

  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  afterEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("renders Normal Day copy and NORMAL DAY status chip", () => {
    const html = renderToStaticMarkup(
      <EventBanner event={normalEvent} error={false} />,
    );
    expect(html).toContain("NORMAL DAY");
    expect(html).toContain("Today&#x27;s Event: a Normal day, no XP bonus.");
    expect(html).not.toContain("BONUS DAY");
  });

  it("renders Bonus Day copy with marching-ants border and multiplier", () => {
    const html = renderToStaticMarkup(
      <EventBanner event={bonusEvent} error={false} />,
    );
    expect(html).toContain("BONUS DAY ×2 XP");
    expect(html).toContain("Today&#x27;s Event: ×2 XP — make it count!");
    expect(html).toContain("y2k-marching-ants");
    expect(html).toContain('data-testid="bonus-badge"');
  });

  it("hides the banner completely on error", () => {
    const html = renderToStaticMarkup(
      <EventBanner event={normalEvent} error={true} />,
    );
    expect(html).toBe("");
  });

  it("hides the banner when event is null", () => {
    const html = renderToStaticMarkup(
      <EventBanner event={null} error={false} />,
    );
    expect(html).toBe("");
  });

  it("stays dismissed when dismissed for the day in localStorage", () => {
    // Simulate window.localStorage having today's dismissal key
    const storageMock: Record<string, string> = { [todayKey]: "1" };
    const fakeLocalStorage = {
      getItem: (k: string) => storageMock[k] ?? null,
      setItem: (k: string, v: string) => { storageMock[k] = v; },
      removeItem: (k: string) => { delete storageMock[k]; },
      clear: () => { Object.keys(storageMock).forEach((k) => delete storageMock[k]); },
      length: 1,
      key: () => null,
    };

    const hadWindow = "window" in globalThis;
    const oldWindow = (globalThis as unknown as { window: unknown }).window;
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: fakeLocalStorage,
    };

    try {
      const html = renderToStaticMarkup(
        <EventBanner event={normalEvent} error={false} />,
      );
      expect(html).toBe("");
    } finally {
      if (hadWindow) {
        (globalThis as unknown as { window: unknown }).window = oldWindow;
      } else {
        delete (globalThis as unknown as { window?: unknown }).window;
      }
    }
  });
});

describe("Taskbar: Start menu role gating", () => {
  it("shows only base programs for standard learner (no Contribute, no Control Panel)", () => {
    const html = renderToStaticMarkup(
      <Taskbar isAdmin={false} isContributor={false} initialStartOpen={true} />,
    );
    expect(html).toContain('role="menu"');
    expect(html).toContain("Map");
    expect(html).toContain("Quests");
    expect(html).toContain("Codelab");
    expect(html).toContain("Leaderboard");
    expect(html).toContain("Profile");
    expect(html).toContain("CTF");
    expect(html).toContain("Side Quests");
    expect(html).toContain("Sign out");
    expect(html).not.toContain("Contribute");
    expect(html).not.toContain("Control Panel");
  });

  it("shows Contribute but not Control Panel for contributor role", () => {
    const html = renderToStaticMarkup(
      <Taskbar isAdmin={false} isContributor={true} initialStartOpen={true} />,
    );
    expect(html).toContain("Contribute");
    expect(html).not.toContain("Control Panel");
  });

  it("shows both Contribute and Control Panel for admin role", () => {
    const html = renderToStaticMarkup(
      <Taskbar isAdmin={true} isContributor={false} initialStartOpen={true} />,
    );
    expect(html).toContain("Contribute");
    expect(html).toContain("Control Panel");
  });
});

describe("Taskbar: Active window button & mobile layout", () => {
  it("marks the active page window button with aria-current and pressed physical styling", () => {
    const html = renderToStaticMarkup(
      <Taskbar currentPath="/quests" isAdmin={false} isContributor={false} />,
    );
    // Quests button is active
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/quests"/);
    expect(html).toContain("translate-x-[2px]");

    // Map button is not active
    expect(html).not.toMatch(/<a[^>]*aria-current="page"[^>]*href="\/map"/);
  });

  it("switches active state when navigating to /codelab", () => {
    const html = renderToStaticMarkup(
      <Taskbar currentPath="/codelab" isAdmin={false} isContributor={false} />,
    );
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/codelab"/);
    expect(html).not.toMatch(/<a[^>]*aria-current="page"[^>]*href="\/quests"/);
  });

  it("renders 5 window buttons in mobile grid without horizontal scroll", () => {
    const html = renderToStaticMarkup(
      <Taskbar currentPath="/map" isAdmin={false} isContributor={false} />,
    );
    // 5 buttons present
    expect(html).toContain('href="/map"');
    expect(html).toContain('href="/quests"');
    expect(html).toContain('href="/codelab"');
    expect(html).toContain('href="/leaderboard"');
    expect(html).toContain('href="/profile"');

    // Desktop controls hidden on mobile
    expect(html).toContain("hidden sm:block");
    expect(html).toContain("grid-cols-5");
    expect(html).toContain("overflow-x-hidden");
  });
});

describe("AppShell & MinimalHeader", () => {
  it("renders minimal header with wordmark and sign-in/up links for signed-out pages", () => {
    const html = renderToStaticMarkup(<MinimalHeader />);
    expect(html).toContain("REDISETHACK");
    expect(html).toContain('href="/sign-in"');
    expect(html).toContain('href="/sign-up"');
  });

  it("renders the full app shell for signed-in pages", () => {
    const html = renderToStaticMarkup(
      <AppShell
        profile={mockProfile}
        profileError={false}
        event={bonusEvent}
        eventError={false}
        isAdmin={true}
        isContributor={true}
      >
        <div data-testid="page-content">Hello Learner</div>
      </AppShell>,
    );
    expect(html).toContain("REDISETHACK");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("ADMIN");
    expect(html).toContain("BONUS DAY ×2 XP");
    expect(html).toContain("Hello Learner");
    expect(html).toContain('aria-label="Taskbar"');
  });

  it("renders error copy inside player chip area on profile load failure", () => {
    const html = renderToStaticMarkup(
      <AppShell
        profile={null}
        profileError={true}
        event={normalEvent}
        eventError={false}
        isAdmin={false}
        isContributor={false}
      >
        <div>Content</div>
      </AppShell>,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("Your profile could not be loaded.");
  });
});
