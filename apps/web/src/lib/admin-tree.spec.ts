import { describe, expect, it } from "vitest";
import { buildContentTree, countCatalog } from "./admin-tree";
import type { Quest, Region, Stage, Zone } from "@/lib/api-client";

function region(id: number, name: string, sortOrder = 0): Region {
  return { id, name, slug: name.toLowerCase(), description: null, sortOrder, storyIntro: null };
}

function zone(id: number, regionId: number, name: string, sortOrder = 0): Zone {
  return { id, regionId, name, slug: name.toLowerCase(), description: null, sortOrder };
}

function stage(id: number, zoneId: number, title: string, sortOrder = 0, xpReward = 10): Stage {
  return {
    id,
    zoneId,
    title,
    slug: title.toLowerCase(),
    xpReward,
    sortOrder,
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

describe("buildContentTree", () => {
  const tree = buildContentTree({
    regions: [region(1, "Linux Basics"), region(2, "Networks", 1)],
    zones: [zone(10, 1, "Shell"), zone(11, 1, "Files", 1), zone(20, 2, "TCP")],
    stages: [stage(100, 10, "Intro"), stage(101, 10, "Pipes", 1), stage(200, 11, "Permissions")],
    quests: [quest(1000, 100, "Intro Quiz"), quest(1001, 100, "Commands Quiz"), quest(2000, 200, "Chmod Quiz")],
  });

  it("roots the tree at the Regions, in sort order", () => {
    expect(tree.regions.map((node) => node.name)).toEqual(["Linux Basics", "Networks"]);
  });

  it("nests Zones under their Region", () => {
    const linux = tree.regions[0]!;
    expect(linux.children.map((node) => node.name)).toEqual(["Shell", "Files"]);
    expect(linux.children.every((node) => node.kind === "zone")).toBe(true);
  });

  it("nests Stages under their Zone", () => {
    const shell = tree.regions[0]!.children[0]!;
    expect(shell.children.map((node) => node.name)).toEqual(["Intro", "Pipes"]);
    expect(shell.children.every((node) => node.kind === "stage")).toBe(true);
  });

  it("nests Quests under their Stage, sorted by title", () => {
    const intro = tree.regions[0]!.children[0]!.children[0]!;
    expect(intro.children.map((node) => node.name)).toEqual(["Commands Quiz", "Intro Quiz"]);
    expect(intro.children.every((node) => node.kind === "quest")).toBe(true);
  });

  it("gives every node its Edit link", () => {
    const intro = tree.regions[0]!.children[0]!.children[0]!;
    expect(tree.regions[0]!.editHref).toBe("/admin/regions/1");
    expect(tree.regions[0]!.children[0]!.editHref).toBe("/admin/zones/10");
    expect(intro.editHref).toBe("/admin/stages/100");
    expect(intro.children[0]!.editHref).toBe("/admin/quests/1001");
  });

  it("carries a Stage's XP reward and leaves the other levels empty", () => {
    const intro = tree.regions[0]!.children[0]!.children[0]!;
    expect(intro.xpReward).toBe(10);
    expect(tree.regions[0]!.xpReward).toBeNull();
    expect(intro.children[0]!.xpReward).toBeNull();
  });

  it("leaves a Stage without Quests as a leaf", () => {
    const pipes = tree.regions[0]!.children[0]!.children[1]!;
    expect(pipes.children).toEqual([]);
  });

  it("keeps Quests that point at an unknown Stage out of the tree", () => {
    const orphan = buildContentTree({
      regions: [],
      zones: [],
      stages: [],
      quests: [quest(1, 999, "Orphan")],
    });
    expect(orphan.regions).toEqual([]);
  });
});

describe("countCatalog", () => {
  it("counts every catalog listing the tiles link to", () => {
    expect(
      countCatalog({
        regions: [region(1, "a"), region(2, "b")],
        zones: [zone(1, 1, "a")],
        stages: [stage(1, 1, "a"), stage(2, 1, "b")],
        quests: [quest(1, 1, "a")],
        badges: [{ id: 1 }, { id: 2 }, { id: 3 }],
        characters: [{ id: 1 }],
      }),
    ).toEqual({
      regions: 2,
      zones: 1,
      stages: 2,
      quests: 1,
      badges: 3,
      characters: 1,
    });
  });

  it("counts an empty catalog as zeroes", () => {
    expect(
      countCatalog({ regions: [], zones: [], stages: [], quests: [], badges: [], characters: [] }),
    ).toEqual({ regions: 0, zones: 0, stages: 0, quests: 0, badges: 0, characters: 0 });
  });
});
