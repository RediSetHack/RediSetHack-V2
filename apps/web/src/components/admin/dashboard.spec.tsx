import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboardView, ContentTreeView, dashboardTiles } from "./dashboard";
import { buildContentTree } from "@/lib/admin-tree";
import type { BadgeDefinition, Character, Quest, Region, Stage, Zone } from "@/lib/api-client";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: () => Promise.resolve("token") }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

function region(id: number, name: string): Region {
  return { id, name, slug: name.toLowerCase(), description: null, sortOrder: 0, storyIntro: null };
}

function zone(id: number, regionId: number, name: string): Zone {
  return { id, regionId, name, slug: name.toLowerCase(), description: null, sortOrder: 0 };
}

function stage(id: number, zoneId: number, title: string, xpReward = 25): Stage {
  return {
    id,
    zoneId,
    title,
    slug: title.toLowerCase(),
    xpReward,
    sortOrder: 0,
    status: "available",
    lockReason: null,
  };
}

function quest(id: number, stageId: number, title: string): Quest {
  return {
    id,
    stageId,
    title,
    description: null,
    timeLimitSeconds: 60,
    passingScore: 70,
    xpReward: 5,
    initialAssessment: false,
    completed: false,
    lockReason: null,
  };
}

function badge(id: number): BadgeDefinition {
  return {
    id,
    name: `Badge ${id}`,
    slug: `badge-${id}`,
    description: null,
    criteria: { trigger: "cumulative", target: "stage_completions", threshold: id },
    imageUrl: null,
  };
}

function character(id: number): Character {
  return {
    id,
    name: `Character ${id}`,
    slug: `character-${id}`,
    description: null,
    imageUrl: null,
  };
}

const tree = buildContentTree({
  regions: [region(1, "Linux Basics")],
  zones: [zone(10, 1, "Shell")],
  stages: [stage(100, 10, "Intro")],
  quests: [quest(1000, 100, "Intro Quiz")],
});

describe("ContentTreeView", () => {
  it("expands Region › Zone › Stage › Quest", () => {
    const html = renderToStaticMarkup(<ContentTreeView tree={tree} />);
    expect(html).toContain("Linux Basics");
    expect(html).toContain("Shell");
    expect(html).toContain("Intro");
    expect(html).toContain("Intro Quiz");
  });

  it("gives every level its Edit link", () => {
    const html = renderToStaticMarkup(<ContentTreeView tree={tree} />);
    expect(html).toContain('href="/admin/regions/1"');
    expect(html).toContain('href="/admin/zones/10"');
    expect(html).toContain('href="/admin/stages/100"');
    expect(html).toContain('href="/admin/quests/1000"');
  });

  it("shows a Stage's XP reward", () => {
    const html = renderToStaticMarkup(<ContentTreeView tree={tree} />);
    expect(html).toContain("25 XP");
  });

  it("nests each level inside the one above it", () => {
    const html = renderToStaticMarkup(<ContentTreeView tree={tree} />);
    // Three collapsible levels: Region, Zone and Stage.
    expect(html.match(/<details/g)).toHaveLength(3);
  });

  it("renders nothing but the list for an empty catalog", () => {
    const html = renderToStaticMarkup(<ContentTreeView tree={{ regions: [] }} />);
    expect(html).not.toContain("Edit");
  });
});

describe("AdminDashboardView", () => {
  const catalog = {
    regions: [region(1, "Linux Basics"), region(2, "Networks")],
    zones: [zone(10, 1, "Shell")],
    stages: [stage(100, 10, "Intro")],
    quests: [quest(1000, 100, "Intro Quiz")],
    badges: [badge(1), badge(2)],
    characters: [character(1), character(2), character(3)],
    loading: false,
    error: false,
  };

  it("shows one count per catalog listing", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView catalog={catalog} event={null} eventError={false} />,
    );
    expect(html).toContain("ADMIN_DASHBOARD.EXE");
    expect(html).toContain(">2<"); // Regions
    expect(html).toContain(">1<"); // Zones
  });

  it("links every tile to its list", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView catalog={catalog} event={null} eventError={false} />,
    );
    expect(html).toContain('href="/admin/regions"');
    expect(html).toContain('href="/admin/zones"');
    expect(html).toContain('href="/admin/stages"');
    expect(html).toContain('href="/admin/quests"');
    expect(html).toContain('href="/admin/badges"');
    expect(html).toContain('href="/admin/characters"');
  });

  it("offers the four quick-create buttons", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView catalog={catalog} event={null} eventError={false} />,
    );
    expect(html).toContain("NEW REGION");
    expect(html).toContain("NEW STAGE");
    expect(html).toContain("NEW QUEST");
    expect(html).toContain("NEW BADGE");
    expect(html).toContain('href="/admin/regions/new"');
    expect(html).toContain('href="/admin/stages/new"');
    expect(html).toContain('href="/admin/quests/new"');
    expect(html).toContain('href="/admin/badges/new"');
  });

  it("renders the content tree from the same catalog it counts", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView catalog={catalog} event={null} eventError={false} />,
    );
    expect(html).toContain("CONTENT TREE");
    expect(html).toContain("Linux Basics");
    expect(html).toContain("Shell");
    expect(html).toContain("Intro");
    expect(html).toContain("Intro Quiz");
  });

  it("shows a placeholder while the catalog loads", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView catalog={{ ...catalog, loading: true }} event={null} eventError={false} />,
    );
    expect(html).toContain("Loading tree…");
    expect(html).not.toContain("Linux Basics");
  });

  it("shows the empty state when there is no content yet", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView
        catalog={{ ...catalog, regions: [], zones: [], stages: [], quests: [] }}
        event={null}
        eventError={false}
      />,
    );
    expect(html).toContain("No Regions yet — create the first one.");
  });

  it("shows the error copy when the catalog failed to load", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView catalog={{ ...catalog, error: true }} event={null} eventError={false} />,
    );
    expect(html).toContain('role="alert"');
    expect(html).toContain("The content tree could not be loaded.");
  });

  it("shows today's Event, read-only", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView
        catalog={catalog}
        event={{ id: 1, eventDate: "2026-10-21", eventType: "bonus", xpMultiplier: 2 }}
        eventError={false}
      />,
    );
    expect(html).toContain("TODAY&#x27;S EVENT");
    expect(html).toContain("BONUS ×2 XP");
    expect(html).toContain("Events are auto-generated — not editable.");
  });

  it("shows the normal day copy for a normal Event", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView
        catalog={catalog}
        event={{ id: 1, eventDate: "2026-10-21", eventType: "normal", xpMultiplier: 1 }}
        eventError={false}
      />,
    );
    expect(html).toContain("NORMAL DAY");
  });

  it("hides the Event copy when the Event failed to load", () => {
    const html = renderToStaticMarkup(
      <AdminDashboardView catalog={catalog} event={null} eventError={true} />,
    );
    expect(html).toContain("Event unavailable.");
  });
});

describe("dashboardTiles", () => {
  const counts = {
    regions: 2,
    zones: 3,
    stages: 4,
    quests: 5,
    badges: 6,
    characters: 7,
  };

  it("shows one tile per catalog listing, each linking to its list", () => {
    const tiles = dashboardTiles(counts, true);
    expect(tiles.map((tile) => tile.label)).toEqual([
      "Regions",
      "Zones",
      "Stages",
      "Quests",
      "Badges",
      "Characters",
    ]);
    expect(tiles.map((tile) => tile.href)).toEqual([
      "/admin/regions",
      "/admin/zones",
      "/admin/stages",
      "/admin/quests",
      "/admin/badges",
      "/admin/characters",
    ]);
    expect(tiles.map((tile) => tile.count)).toEqual([2, 3, 4, 5, 6, 7]);
  });

  it("shows a placeholder instead of a count while the catalog loads", () => {
    const tiles = dashboardTiles(counts, false);
    expect(tiles.every((tile) => tile.count === null)).toBe(true);
  });
});
