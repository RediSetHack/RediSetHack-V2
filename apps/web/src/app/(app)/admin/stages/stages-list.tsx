"use client";

import { useMemo } from "react";
import { ResourceList, type ListColumn, type ListFilter } from "@/components/admin/resource-list";
import { useCatalog, useToken } from "@/components/admin/use-catalog";
import { deleteAdminStage, type Stage } from "@/lib/api-client";
import { formatXp } from "@/lib/format";

export function StagesList() {
  const auth = useToken();
  const catalog = useCatalog(auth, { stages: true, quests: true });

  const regionByZone = useMemo(() => new Map(catalog.zones.map((zone) => [zone.id, zone.regionId])), [catalog.zones]);
  const regionName = useMemo(() => new Map(catalog.regions.map((region) => [region.id, region.name])), [catalog.regions]);
  const zoneName = useMemo(() => new Map(catalog.zones.map((zone) => [zone.id, zone.name])), [catalog.zones]);
  const questStageIds = useMemo(() => new Set(catalog.quests.map((quest) => quest.stageId)), [catalog.quests]);

  const columns: readonly ListColumn<Stage>[] = [
    { key: "title", header: "Title", sortValue: (row) => row.title, render: (row) => row.title },
    {
      key: "zone",
      header: "Zone (Region › Zone)",
      sortValue: (row) => `${regionName.get(regionByZone.get(row.zoneId) ?? -1) ?? ""} ${zoneName.get(row.zoneId) ?? ""}`,
      render: (row) => `${regionName.get(regionByZone.get(row.zoneId) ?? -1) ?? "?"} › ${zoneName.get(row.zoneId) ?? "#" + row.zoneId}`,
    },
    { key: "xp", header: "XP reward", sortValue: (row) => row.xpReward, render: (row) => formatXp(row.xpReward) },
    { key: "sortOrder", header: "Sort order", sortValue: (row) => row.sortOrder, render: (row) => row.sortOrder },
    { key: "quest", header: "Has Quest", render: (row) => questStageIds.has(row.id) ? "Yes" : "No" },
  ];

  const filters: readonly ListFilter<Stage>[] = [
    {
      key: "region",
      label: "Region",
      options: catalog.regions.map((region) => ({ value: String(region.id), label: region.name })),
      resetFilters: ["zone"],
      match: (row, value) => value === null || regionByZone.get(row.zoneId) === Number(value),
    },
    {
      key: "zone",
      label: "Zone",
      options: (selected) => catalog.zones
        .filter((zone) => !selected.region || zone.regionId === Number(selected.region))
        .map((zone) => ({ value: String(zone.id), label: zone.name })),
      match: (row, value) => value === null || row.zoneId === Number(value),
    },
  ];

  return (
    <ResourceList<Stage>
      title="STAGES.EXE"
      rows={catalog.stages}
      columns={columns}
      filters={filters}
      searchPlaceholder="Search Stages…"
      haystack={(row) => `${row.title} ${row.slug} ${zoneName.get(row.zoneId) ?? ""}`}
      newHref="/admin/stages/new"
      newLabel="NEW STAGE"
      emptyMessage="No Stages yet — create the first one."
      loading={catalog.loading}
      error={catalog.error}
      deleteItem={deleteAdminStage}
      deleteName={(row) => row.title}
      onDeleted={catalog.reload}
    />
  );
}
