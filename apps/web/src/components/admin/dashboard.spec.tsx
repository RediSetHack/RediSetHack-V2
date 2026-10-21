import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminDashboardView, ContentTreeView, dashboardTiles } from "./dashboard";
import { buildContentTree } from "@/lib/admin-tree";
import { badge, character, quest, region, stage, zone } from "@/lib/admin-fixtures";
import type { DailyEvent } from "@/lib/api-client";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: () => Promise.resolve("token") }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

type DashboardCatalog = Parameters<typeof AdminDashboardView>[0]["catalog"];

function renderDashboard(
  catalog: DashboardCatalog,
  event: DailyEvent | null = null,
  eventError = false,
): string {
  return renderToStaticMarkup(
    <AdminDashboardView catalog={catalog} event={event} eventError={eventError} />,
  );
}

const catalog: DashboardCatalog = {
  regions: [region(1, "Linux Basics"), region(2, "Networks")],
  zones: [zone(10, 1, "Shell")],
  stages: [stage(100, 10, "Intro")],
  quests: [quest(1000, 100, "Intro Quiz")],
  badges: [badge(1), badge(2)],
  characters: [character(1), character(2), character(3)],
  loading: false,
  error: false,
};

const tree = buildContentTree(catalog);

/** The four levels the content tree must show, in order. */
const TREE_LABELS = ["Linux Basics", "Shell", "Intro", "Intro Quiz"];

/** The number each stat tile shows, in tile order. */
function tileValues(html: string): string[] {
  return [...html.matchAll(/class="font-pixel text-\[18px\] leading-relaxed text-foreground">([^<]*)</g)].map(
    (match) => match[1]!,
  );
}

function expectTreeLabels(html: string) {
  for (const label of TREE_LABELS) {
    expect(html).toContain(label);
  }
}

describe("ContentTreeView", () => {
  it("expands Region › Zone › Stage › Quest", () => {
    const html = renderToStaticMarkup(<ContentTreeView tree={tree} />);
    expectTreeLabels(html);
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
    expect(html).toContain("10 XP");
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
  const bonusEvent: DailyEvent = {
    id: 1,
    eventDate: "2026-10-21",
    eventType: "bonus",
    xpMultiplier: 2,
  };

  const normalEvent: DailyEvent = {
    id: 1,
    eventDate: "2026-10-21",
    eventType: "normal",
    xpMultiplier: 1,
  };

  it("shows one count per catalog listing", () => {
    const html = renderDashboard(catalog);
    expect(html).toContain("ADMIN_DASHBOARD.EXE");
    expect(html).toContain(">2<"); // Regions
    expect(html).toContain(">1<"); // Zones
  });

  it("links every tile to its list", () => {
    const html = renderDashboard(catalog);
    expect(html).toContain('href="/admin/regions"');
    expect(html).toContain('href="/admin/zones"');
    expect(html).toContain('href="/admin/stages"');
    expect(html).toContain('href="/admin/quests"');
    expect(html).toContain('href="/admin/badges"');
    expect(html).toContain('href="/admin/characters"');
  });

  it("offers the four quick-create buttons", () => {
    const html = renderDashboard(catalog);
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
    const html = renderDashboard(catalog);
    expect(html).toContain("CONTENT TREE");
    expectTreeLabels(html);
  });

  it("shows a placeholder while the catalog loads", () => {
    const html = renderDashboard({ ...catalog, loading: true });
    expect(html).toContain("Loading tree…");
    expect(html).not.toContain("Linux Basics");
  });

  it("shows the empty state when there is no content yet", () => {
    const html = renderDashboard({ ...catalog, regions: [], zones: [], stages: [], quests: [] });
    expect(html).toContain("No Regions yet — create the first one.");
  });

  it("shows the error copy when the catalog failed to load", () => {
    const html = renderDashboard({ ...catalog, error: true });
    expect(html).toContain('role="alert"');
    expect(html).toContain("The content tree could not be loaded.");
  });

  it("does not pass off missing counts as real numbers", () => {
    const html = renderDashboard({ ...catalog, error: true });
    expect(html).toContain("The catalog could not be loaded, so the counts are unavailable.");
    // Every tile shows its placeholder instead of a number it could not load.
    expect(tileValues(html)).toEqual(["—", "—", "—", "—", "—", "—"]);
  });

  it("shows the counts once the catalog loaded", () => {
    expect(tileValues(renderDashboard(catalog))).toEqual(["2", "1", "1", "1", "2", "3"]);
  });

  it("shows today's Event, read-only", () => {
    const html = renderDashboard(catalog, bonusEvent);
    expect(html).toContain("TODAY&#x27;S EVENT");
    expect(html).toContain("BONUS ×2 XP");
    expect(html).toContain("Events are auto-generated — not editable.");
  });

  it("shows the normal day copy for a normal Event", () => {
    const html = renderDashboard(catalog, normalEvent);
    expect(html).toContain("NORMAL DAY");
  });

  it("hides the Event copy when the Event failed to load", () => {
    const html = renderDashboard(catalog, null, true);
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
