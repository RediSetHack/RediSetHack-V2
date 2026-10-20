"use client";

import { useEffect, useMemo, useState } from "react";
import { ResourceForm } from "@/components/admin/resource-form";
import { EditLoadState, FormShell } from "@/components/admin/form-controls";
import { CriteriaBuilder, toCriteria, type CriteriaValue } from "@/components/admin/criteria-builder";
import { API_URL, useCatalog, useToken } from "@/components/admin/use-catalog";
import { AvatarOrInitial, Y2kInput, Y2kTextarea } from "@/components/y2k";
import { FormField } from "@/components/admin/form-controls";
import { ApiError, deleteAdminBadge, getAdminBadge } from "@/lib/api-client";
import { defaultSlug } from "@/lib/admin-helpers";

type BadgeValues = { id: number; name: string; slug: string; description: string; imageUrl: string; criteria: CriteriaValue };

function toCriteriaValue(criteria?: { trigger: string }): CriteriaValue {
  if (criteria?.trigger === "activity") return { trigger: "activity", target: "quest_passes", threshold: 1, zoneId: 0 };
  if (criteria?.trigger === "category") {
    const zoneId = "zoneId" in criteria ? Number((criteria as { zoneId: number }).zoneId) : 0;
    return { trigger: "category", target: "zone_completion", threshold: 1, zoneId };
  }
  return { trigger: "cumulative", target: "stage_completions", threshold: 5, zoneId: 0 };
}

function badgeInitial(badge?: { id: number; name: string; slug: string; description: string | null; imageUrl: string | null; criteria: { trigger: string } }): BadgeValues {
  return {
    id: badge?.id ?? 0,
    name: badge?.name ?? "",
    slug: badge?.slug ?? "",
    description: badge?.description ?? "",
    imageUrl: badge?.imageUrl ?? "",
    criteria: toCriteriaValue(badge?.criteria),
  };
}

export function BadgeForm({ mode, id }: Readonly<{ mode: "create" | "edit"; id?: string }>) {
  const token = useToken();
  const catalog = useCatalog(token, { stages: false });
  const [initial, setInitial] = useState<BadgeValues | null>(mode === "create" ? badgeInitial() : null);
  const [status, setStatus] = useState<"loading" | "not-found" | "error" | "ready">(mode === "create" ? "ready" : "loading");

  useEffect(() => {
    if (mode !== "edit" || !id || !token) return;
    let cancelled = false;
    void getAdminBadge(API_URL, token, Number(id))
      .then((badge) => {
        if (cancelled) return;
        setInitial(badgeInitial(badge));
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (!cancelled) setStatus(cause instanceof ApiError && cause.status === 404 ? "not-found" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [mode, id, token]);

  const zoneOptions = useMemo(() => {
    const regionName = new Map(catalog.regions.map((region) => [region.id, region.name]));
    return catalog.zones.map((zone) => ({ value: String(zone.id), label: `${regionName.get(zone.regionId) ?? "?"} › ${zone.name}` }));
  }, [catalog.zones, catalog.regions]);

  if (status === "loading") return <EditLoadState loading resource="Badge" />;
  if (status === "not-found") return <EditLoadState notFound resource="Badge" />;
  if (status === "error") return <EditLoadState error resource="Badge" />;
  if (!initial) return null;

  const renderFields = ({
    values,
    set,
    errors,
  }: Readonly<{ values: Record<string, unknown>; set: (key: string, value: unknown) => void; errors: Record<string, string> }>) => (
    <div className="flex flex-col gap-4">
      <FormField id="badge-name" label="Name" required error={errors.name}>
        <Y2kInput
          id="badge-name"
          value={String(values.name ?? "")}
          onChange={(event) => {
            set("name", event.target.value);
            set("slug", defaultSlug(event.target.value));
          }}
        />
      </FormField>
      <FormField id="badge-slug" label="Slug" required error={errors.slug}>
        <Y2kInput id="badge-slug" value={String(values.slug ?? "")} onChange={(event) => set("slug", event.target.value)} />
      </FormField>
      <FormField id="badge-description" label="Description" error={errors.description}>
        <Y2kTextarea id="badge-description" value={String(values.description ?? "")} onChange={(event) => set("description", event.target.value)} />
      </FormField>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <FormField id="badge-image" label="Image URL" error={errors.imageUrl} hint={<span className="font-body text-xs text-muted-foreground">Live preview with checkerboard fallback.</span>}>
            <Y2kInput id="badge-image" value={String(values.imageUrl ?? "")} onChange={(event) => set("imageUrl", event.target.value)} />
          </FormField>
        </div>
        <AvatarOrInitial src={String(values.imageUrl ?? "") || null} name={String(values.name ?? "?")} className="size-16" />
      </div>
      <div className="border-t-2 border-border pt-4">
        <CriteriaBuilder value={(values.criteria as CriteriaValue) ?? toCriteriaValue()} onChange={(next) => set("criteria", next)} zoneOptions={zoneOptions} />
      </div>
    </div>
  );

  return (
    <FormShell title={mode === "create" ? "NEW_BADGE.EXE" : "EDIT_BADGE.EXE"}>
      <ResourceForm
        resource="Badge"
        mode={mode}
        initialValues={initial as unknown as Record<string, unknown>}
        requiredKeys={["name", "slug"]}
        hub="/admin/badges"
        deleteItem={deleteAdminBadge}
        itemName={initial.name || "this Badge"}
        cascadeWarning="Badges already earned by learners are removed."
        toInput={(values) => ({
          name: String(values.name ?? "").trim(),
          slug: String(values.slug ?? "").trim(),
          description: String(values.description ?? "").trim() || undefined,
          imageUrl: String(values.imageUrl ?? "").trim() || undefined,
          criteria: toCriteria(values.criteria as CriteriaValue),
        })}
        renderFields={renderFields}
      />
    </FormShell>
  );
}
