"use client";

import { useEffect, useState } from "react";
import { AvatarOrInitial } from "@/components/y2k";
import { ResourceList, type ListColumn, type ListFilter } from "@/components/admin/resource-list";
import { API_URL } from "@/components/admin/use-catalog";
import { deleteAdminBadge, getBadgeDefinitions, type BadgeDefinition } from "@/lib/api-client";
import { criteriaSummary } from "@/lib/admin-helpers";

export function BadgesList() {
  const [rows, setRows] = useState<BadgeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(false);
      try {
        const badges = await getBadgeDefinitions(API_URL);
        if (!cancelled) {
          setRows(badges);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  const columns: readonly ListColumn<BadgeDefinition>[] = [
    { key: "image", header: "Image", render: (row) => <AvatarOrInitial src={row.imageUrl} name={row.name} className="size-9" /> },
    { key: "name", header: "Name", sortValue: (row) => row.name, render: (row) => row.name },
    { key: "slug", header: "Slug", sortValue: (row) => row.slug, render: (row) => <code className="font-mono text-xs">{row.slug}</code> },
    { key: "criteria", header: "Criteria summary", sortValue: (row) => row.criteria.trigger, render: (row) => criteriaSummary(row.criteria) },
  ];

  const filters: readonly ListFilter<BadgeDefinition>[] = [
    {
      key: "trigger",
      label: "Trigger",
      options: [
        { value: "cumulative", label: "Cumulative" },
        { value: "activity", label: "Activity" },
        { value: "category", label: "Category" },
      ],
      match: (row, value) => value === null || row.criteria.trigger === value,
    },
  ];

  return (
    <ResourceList<BadgeDefinition>
      title="BADGES.EXE"
      rows={rows}
      columns={columns}
      filters={filters}
      searchPlaceholder="Search Badges…"
      haystack={(row) => `${row.name} ${row.slug} ${criteriaSummary(row.criteria)}`}
      newHref="/admin/badges/new"
      newLabel="NEW BADGE"
      emptyMessage="No Badges yet — create the first one."
      loading={loading}
      error={error}
      deleteItem={deleteAdminBadge}
      deleteName={(row) => row.name}
      onDeleted={() => setVersion((value) => value + 1)}
    />
  );
}
