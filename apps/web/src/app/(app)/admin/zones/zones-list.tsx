"use client";

import { useMemo } from "react";
import { ResourceList, type ListColumn, type ListFilter } from "@/components/admin/resource-list";
import { useCatalog, useToken } from "@/components/admin/use-catalog";
import { deleteAdminZone, type Zone } from "@/lib/api-client";

export function ZonesList() {
  const token = useToken();
  const catalog = useCatalog(token, { stages: true });

  const regionName = useMemo(() => new Map(catalog.regions.map((region) => [region.id, region.name])), [catalog.regions]);
  const stageCount = useMemo(() => {
    const counts = new Map<number, number>();
    for (const stage of catalog.stages) counts.set(stage.zoneId, (counts.get(stage.zoneId) ?? 0) + 1);
    return counts;
  }, [catalog.stages]);

  const columns: readonly ListColumn<Zone>[] = [
    { key: "name", header: "Name", sortValue: (row) => row.name, render: (row) => row.name },
    { key: "region", header: "Region", sortValue: (row) => regionName.get(row.regionId) ?? "", render: (row) => regionName.get(row.regionId) ?? `#${row.regionId}` },
    { key: "slug", header: "Slug", sortValue: (row) => row.slug, render: (row) => <code className="font-mono text-xs">{row.slug}</code> },
    { key: "sortOrder", header: "Sort order", sortValue: (row) => row.sortOrder, render: (row) => row.sortOrder },
    { key: "stages", header: "Stages #", render: (row) => stageCount.get(row.id) ?? 0 },
  ];

  const filters: readonly ListFilter<Zone>[] = [
    {
      key: "region",
      label: "Region",
      options: catalog.regions.map((region) => ({ value: String(region.id), label: region.name })),
      match: (row, value) => value === null || row.regionId === Number(value),
    },
  ];

  return (
    <ResourceList<Zone>
      title="ZONES.EXE"
      rows={catalog.zones}
      columns={columns}
      filters={filters}
      searchPlaceholder="Search Zones…"
      haystack={(row) => `${row.name} ${row.slug} ${regionName.get(row.regionId) ?? ""}`}
      newHref="/admin/zones/new"
      newLabel="NEW ZONE"
      emptyMessage="No Zones yet — create the first one."
      loading={catalog.loading}
      error={catalog.error}
      deleteItem={deleteAdminZone}
      deleteName={(row) => row.name}
      cascadeWarning="Deleting a Zone cascades to its Stages and Quests."
      onDeleted={catalog.reload}
    />
  );
}
