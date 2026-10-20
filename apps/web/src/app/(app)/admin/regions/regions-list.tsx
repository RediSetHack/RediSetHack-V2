"use client";

import { useMemo } from "react";
import { ResourceList, type ListColumn } from "@/components/admin/resource-list";
import { useCatalog } from "@/components/admin/use-catalog";
import { deleteAdminRegion, type Region } from "@/lib/api-client";

export function RegionsList() {
  const catalog = useCatalog(null, { stages: false });

  const zoneCount = useMemo(() => {
    const counts = new Map<number, number>();
    for (const zone of catalog.zones) counts.set(zone.regionId, (counts.get(zone.regionId) ?? 0) + 1);
    return counts;
  }, [catalog.zones]);

  const columns: readonly ListColumn<Region>[] = [
    { key: "name", header: "Name", sortValue: (row) => row.name, render: (row) => row.name },
    { key: "slug", header: "Slug", sortValue: (row) => row.slug, render: (row) => <code className="font-mono text-xs">{row.slug}</code> },
    { key: "sortOrder", header: "Sort order", sortValue: (row) => row.sortOrder, render: (row) => row.sortOrder },
    { key: "zones", header: "Zones #", render: (row) => zoneCount.get(row.id) ?? 0 },
  ];

  return (
    <ResourceList<Region>
      title="REGIONS.EXE"
      rows={catalog.regions}
      columns={columns}
      searchPlaceholder="Search Regions…"
      haystack={(row) => `${row.name} ${row.slug}`}
      newHref="/admin/regions/new"
      newLabel="NEW REGION"
      emptyMessage="No Regions yet — create the first one."
      loading={catalog.loading}
      error={catalog.error}
      deleteItem={deleteAdminRegion}
      deleteName={(row) => row.name}
      cascadeWarning="Deleting a Region also deletes its Zones, Stages and Quests."
      onDeleted={catalog.reload}
    />
  );
}
