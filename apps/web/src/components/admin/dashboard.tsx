"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Award, ChevronRight, Flag, Globe, Layers, MapPin, Plus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatusChip, Window, buttonClasses, XPChip } from "@/components/y2k";
import { useCatalog, useToken } from "@/components/admin/use-catalog";
import { buildContentTree, countCatalog, type CatalogCounts, type ContentNode, type ContentTree } from "@/lib/admin-tree";
import type { BadgeDefinition, Character, DailyEvent, Quest, Region, Stage, Zone } from "@/lib/api-client";

type Tile = Readonly<{ label: string; count: number | null; href: string; icon: LucideIcon; note?: string }>;

/**
 * The six stat tiles, in the order PAGES.md §15.2 lists them. Each tile
 * links to the listing it counts.
 */
export function dashboardTiles(counts: CatalogCounts, ready: boolean): Tile[] {
  const count = (value: number) => (ready ? value : null);
  return [
    { label: "Regions", count: count(counts.regions), href: "/admin/regions", icon: Globe },
    { label: "Zones", count: count(counts.zones), href: "/admin/zones", icon: Layers },
    { label: "Stages", count: count(counts.stages), href: "/admin/stages", icon: MapPin },
    { label: "Quests", count: count(counts.quests), href: "/admin/quests", icon: Flag },
    { label: "Badges", count: count(counts.badges), href: "/admin/badges", icon: Award },
    { label: "Characters", count: count(counts.characters), href: "/admin/characters", icon: Users },
  ];
}

function EditLink({ href }: Readonly<{ href: string }>) {
  return (
    <Link
      href={href}
      className="text-xs underline"
      onClick={(event) => event.stopPropagation()}
    >
      Edit
    </Link>
  );
}

function TreeBranch({ node }: Readonly<{ node: ContentNode }>) {
  const label = (
    <>
      {node.children.length > 0 && (
        <ChevronRight
          aria-hidden="true"
          className="size-3 shrink-0 transition-transform group-open:rotate-90"
        />
      )}
      <span>{node.name}</span>
      {node.xpReward !== null && <XPChip xp={node.xpReward} />}
      <EditLink href={node.editHref} />
    </>
  );

  if (node.children.length === 0) {
    return (
      <div className="flex items-center gap-2 font-body text-[13px] font-bold">{label}</div>
    );
  }

  return (
    <details className="group">
      <summary className="flex items-center gap-2 font-body text-[13px] font-bold">{label}</summary>
      <ul className="mt-1 ml-4 flex flex-col gap-1 border-l-2 border-border/40 pl-3">
        {node.children.map((child) => (
          <li key={`${child.kind}-${child.id}`}>
            <TreeBranch node={child} />
          </li>
        ))}
      </ul>
    </details>
  );
}

/**
 * The collapsible Region › Zone › Stage › Quest outline, every node carrying
 * its Edit link.
 */
export function ContentTreeView({ tree }: Readonly<{ tree: ContentTree }>) {
  return (
    <ul className="flex flex-col gap-1">
      {tree.regions.map((region) => (
        <li key={`region-${region.id}`}>
          <TreeBranch node={region} />
        </li>
      ))}
    </ul>
  );
}

/** One stat tile: the count, and a link to the listing it counts. */
export function StatTile({ tile }: Readonly<{ tile: Tile }>) {
  return (
    <Link
      href={tile.href}
      className="flex flex-col gap-2 border-2 border-border bg-window-body p-3 shadow-[4px_4px_0_var(--border)] hover:brightness-105"
    >
      <span className="flex items-center gap-2 font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        <tile.icon aria-hidden="true" className="size-4" />
        {tile.label}
      </span>
      <span className="font-pixel text-[18px] leading-relaxed text-foreground">
        {tile.count === null ? "—" : tile.count.toLocaleString("en-US")}
      </span>
      {tile.note && <span className="font-body text-xs text-muted-foreground">{tile.note}</span>}
    </Link>
  );
}

/** The catalog rows the dashboard renders from. */
export type DashboardCatalog = Readonly<{
  regions: readonly Region[];
  zones: readonly Zone[];
  stages: readonly Stage[];
  quests: readonly Quest[];
  badges: readonly BadgeDefinition[];
  characters: readonly Character[];
  loading: boolean;
  error: boolean;
}>;

/**
 * The admin dashboard (PAGES.md §15.2): six count tiles that link to the
 * listings they count, quick-create buttons, the content tree and a
 * read-only card for today's Event.
 *
 * The tiles and the tree are built from the same catalog load, so a tile can
 * never disagree with the list it opens.
 */
export function AdminDashboardView({
  catalog,
  event,
  eventError,
}: Readonly<{
  catalog: DashboardCatalog;
  event: DailyEvent | null;
  eventError: boolean;
}>) {
  const loading = catalog.loading;

  const counts = countCatalog({
    regions: catalog.regions,
    zones: catalog.zones,
    stages: catalog.stages,
    quests: catalog.quests,
    badges: catalog.badges,
    characters: catalog.characters,
  });

  const tree = buildContentTree({
    regions: catalog.regions,
    zones: catalog.zones,
    stages: catalog.stages,
    quests: catalog.quests,
  });

  let treeBody: ReactNode;
  if (loading) {
    treeBody = (
      <output className="block py-4 text-center font-pixel-lg text-lg text-muted-foreground">
        Loading tree…
      </output>
    );
  } else if (catalog.error) {
    treeBody = (
      <p role="alert" className="py-4 text-center font-body text-sm font-bold text-btn-danger">
        The content tree could not be loaded.
      </p>
    );
  } else if (tree.regions.length === 0) {
    treeBody = (
      <p className="py-4 text-center font-body text-sm font-bold text-muted-foreground">
        No Regions yet — create the first one.
      </p>
    );
  } else {
    treeBody = <ContentTreeView tree={tree} />;
  }

  let eventBody: ReactNode;
  if (eventError) {
    eventBody = (
      <p className="font-body text-sm font-bold text-muted-foreground">Event unavailable.</p>
    );
  } else if (event) {
    const bonus = event.eventType === "bonus";
    eventBody = (
      <div className="flex flex-col gap-2">
        <StatusChip
          status={bonus ? "bonus" : "normal"}
          label={bonus ? `BONUS ×${event.xpMultiplier} XP` : "NORMAL DAY"}
        />
        <p className="font-body text-sm font-bold text-foreground">Events are auto-generated — not editable.</p>
      </div>
    );
  } else {
    eventBody = (
      <p className="font-body text-sm font-bold text-muted-foreground">No Event today.</p>
    );
  }

  // A failed load has no counts to show: the tiles must not pass off a
  // missing number as a real one.
  const tiles = dashboardTiles(counts, !loading && !catalog.error);

  return (
    <div className="flex flex-col gap-4">
      <Window title="ADMIN_DASHBOARD.EXE">
        <div className="flex flex-col gap-4">
          {catalog.error && (
            <p role="alert" className="font-body text-sm font-bold text-btn-danger">
              The catalog could not be loaded, so the counts are unavailable.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {tiles.map((tile) => (
              <StatTile key={tile.href} tile={tile} />
            ))}
          </div>

          <div className="flex flex-wrap gap-2 border-t-2 border-border pt-3">
            <Link href="/admin/regions/new" className={buttonClasses("primary")}>
              <Plus aria-hidden="true" className="size-3" /> NEW REGION
            </Link>
            <Link href="/admin/stages/new" className={buttonClasses("primary")}>
              <Plus aria-hidden="true" className="size-3" /> NEW STAGE
            </Link>
            <Link href="/admin/quests/new" className={buttonClasses("primary")}>
              <Plus aria-hidden="true" className="size-3" /> NEW QUEST
            </Link>
            <Link href="/admin/badges/new" className={buttonClasses("primary")}>
              <Plus aria-hidden="true" className="size-3" /> NEW BADGE
            </Link>
          </div>
        </div>
      </Window>

      <div className="grid gap-4 lg:grid-cols-[1fr_16rem]">
        <Window title="CONTENT TREE">
          {treeBody}
        </Window>
        <Window title="TODAY'S EVENT">
          {eventBody}
        </Window>
      </div>
    </div>
  );
}

/** Loads the catalog and hands it to the dashboard view. */
export function AdminDashboard({
  event,
  eventError,
}: Readonly<{
  event: DailyEvent | null;
  eventError: boolean;
}>) {
  const auth = useToken();
  const catalog = useCatalog(auth, { stages: true, quests: true, badges: true, characters: true });

  return (
    <AdminDashboardView
      catalog={catalog}
      event={event}
      eventError={eventError}
    />
  );
}
