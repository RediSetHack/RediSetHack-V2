"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Award, Flag, Globe, Layers, MapPin, Plus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { StatusChip, Window, buttonClasses, XPChip, SkeletonWindow } from "@/components/y2k";
import { useCatalog, useToken, type Catalog } from "@/components/admin/use-catalog";

type Tile = Readonly<{ label: string; count: number | null; href: string; icon: LucideIcon; note?: string }>;

function ContentTree({
  regions,
  zones,
  stages,
}: Readonly<{
  regions: Catalog["regions"];
  zones: Catalog["zones"];
  stages: Catalog["stages"];
}>) {
  return (
    <ul className="flex flex-col gap-1">
      {regions.map((region) => {
        const regionZones = zones.filter((zone) => zone.regionId === region.id);
        return (
          <li key={region.id}>
            <details>
              <summary className="flex items-center gap-2 font-body text-[13px] font-bold">
                <span>{region.name}</span>
                <Link href={`/admin/regions/${region.id}`} className="text-xs underline">
                  Edit
                </Link>
              </summary>
              <ul className="mt-1 ml-4 flex flex-col gap-1 border-l-2 border-border/40 pl-3">
                {regionZones.length === 0 && (
                  <li className="font-body text-xs text-muted-foreground">No Zones.</li>
                )}
                {regionZones.map((zone) => {
                  const zoneStages = stages.filter((stage) => stage.zoneId === zone.id);
                  return (
                    <li key={zone.id}>
                      <details>
                        <summary className="flex items-center gap-2 font-body text-[13px] font-bold">
                          <span>{zone.name}</span>
                          <Link href={`/admin/zones/${zone.id}`} className="text-xs underline">
                            Edit
                          </Link>
                        </summary>
                        <ul className="mt-1 ml-4 flex flex-col gap-1 border-l-2 border-border/40 pl-3">
                          {zoneStages.length === 0 && (
                            <li className="font-body text-xs text-muted-foreground">No Stages.</li>
                          )}
                          {zoneStages.map((stage) => (
                            <li key={stage.id} className="flex items-center gap-2 font-body text-[13px] font-bold">
                              <span>{stage.title}</span>
                              <XPChip xp={stage.xpReward} />
                              <Link href={`/admin/stages/${stage.id}`} className="text-xs underline">
                                Edit
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </details>
                    </li>
                  );
                })}
              </ul>
            </details>
          </li>
        );
      })}
    </ul>
  );
}

function StatTile({ tile }: Readonly<{ tile: Tile }>) {
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

export function AdminDashboard({
  regions,
  zones,
  stages,
  quests,
  badges,
  characters,
  eventLabel,
  eventBonus,
  error,
}: Readonly<{
  regions: number;
  zones: number;
  stages: number;
  quests: number;
  badges: number;
  characters: number;
  eventLabel: string | null;
  eventBonus: boolean;
  error: boolean;
}>) {
  const token = useToken();
  const catalog = useCatalog(token, { stages: true });
  const treeRegions = catalog.regions;
  const treeFailed = catalog.error || error;
  const treeEmpty = treeRegions.length === 0;

  let treeBody: ReactNode;
  if (catalog.loading) {
    treeBody = (
      <output className="block py-4 text-center font-pixel-lg text-lg text-muted-foreground">
        Loading tree…
      </output>
    );
  } else if (treeFailed) {
    treeBody = (
      <p role="alert" className="py-4 text-center font-body text-sm font-bold text-btn-danger">
        The content tree could not be loaded.
      </p>
    );
  } else if (treeEmpty) {
    treeBody = (
      <p className="py-4 text-center font-body text-sm font-bold text-muted-foreground">
        No Regions yet — create the first one.
      </p>
    );
  } else {
    treeBody = <ContentTree regions={treeRegions} zones={catalog.zones} stages={catalog.stages} />;
  }

  let eventBody: ReactNode;
  if (error) {
    eventBody = (
      <p className="font-body text-sm font-bold text-muted-foreground">Event unavailable.</p>
    );
  } else if (eventLabel) {
    eventBody = (
      <div className="flex flex-col gap-2">
        <StatusChip status={eventBonus ? "bonus" : "normal"} label={eventLabel} />
        <p className="font-body text-sm font-bold text-foreground">Events are auto-generated — not editable.</p>
      </div>
    );
  } else {
    eventBody = <SkeletonWindow title="Loading…" label="Loading" />;
  }

  const tiles: Tile[] = [
    { label: "Regions", count: regions, href: "/admin/regions", icon: Globe },
    { label: "Zones", count: zones, href: "/admin/zones", icon: Layers },
    { label: "Stages", count: stages, href: "/admin/stages", icon: MapPin },
    { label: "Quests", count: quests, href: "/admin/quests", icon: Flag },
    { label: "Badges", count: badges, href: "/admin/badges", icon: Award },
    { label: "Characters", count: characters, href: "/admin/characters", icon: Users },
  ];

  return (
    <div className="flex flex-col gap-4">
      <Window title="ADMIN_DASHBOARD.EXE">
        <div className="flex flex-col gap-4">
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
