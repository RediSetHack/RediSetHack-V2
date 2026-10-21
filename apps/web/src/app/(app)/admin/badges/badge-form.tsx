"use client";

import type { BadgeCriteria } from "@repo/contracts";
import { useEffect, useMemo, useState } from "react";
import { ResourceForm } from "@/components/admin/resource-form";
import { EditLoadState, FormField, FormShell } from "@/components/admin/form-controls";
import { CriteriaBuilder, toCriteria, toCriteriaValue, type CriteriaValue } from "@/components/admin/criteria-builder";
import { API_URL, useCatalog, useToken } from "@/components/admin/use-catalog";
import { useAdminAccess } from "@/components/admin/admin-access";
import { AvatarOrInitial, Y2kInput, Y2kTextarea } from "@/components/y2k";
import { ApiError, deleteAdminBadge, getAdminBadge } from "@/lib/api-client";
import { fieldText, defaultSlug } from "@/lib/admin-helpers";

type BadgeValues = { id: number; name: string; slug: string; description: string; imageUrl: string; criteria: CriteriaValue };


function badgeInitial(badge?: { id: number; name: string; slug: string; description: string | null; imageUrl: string | null; criteria: BadgeCriteria }): BadgeValues {
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
  const { report } = useAdminAccess();
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
        // A canceled request must not report: the page that replaced this
        // one owns the shell state now.
        if (cancelled) return;
        // A `403` means the session lost its admin rights: the shell swaps
        // itself for the ACCESS DENIED window.
        if (report(cause)) return;
        setStatus(cause instanceof ApiError && cause.status === 404 ? "not-found" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [mode, id, token, report]);

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
          value={fieldText(values.name, "")}
          onChange={(event) => {
            set("name", event.target.value);
            set("slug", defaultSlug(event.target.value));
          }}
        />
      </FormField>
      <FormField id="badge-slug" label="Slug" required error={errors.slug}>
        <Y2kInput id="badge-slug" value={fieldText(values.slug, "")} onChange={(event) => set("slug", event.target.value)} />
      </FormField>
      <FormField id="badge-description" label="Description" error={errors.description}>
        <Y2kTextarea id="badge-description" value={fieldText(values.description, "")} onChange={(event) => set("description", event.target.value)} />
      </FormField>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <FormField id="badge-image" label="Image URL" error={errors.imageUrl} hint={<span className="font-body text-xs text-muted-foreground">Live preview with checkerboard fallback.</span>}>
            <Y2kInput id="badge-image" value={fieldText(values.imageUrl, "")} onChange={(event) => set("imageUrl", event.target.value)} />
          </FormField>
        </div>
        <AvatarOrInitial src={fieldText(values.imageUrl, "") || null} name={fieldText(values.name, "?")} className="size-16" />
      </div>
      <div className="border-t-2 border-border pt-4">
        <CriteriaBuilder value={(values.criteria as CriteriaValue) ?? toCriteriaValue()} onChange={(next) => set("criteria", next)} zoneOptions={zoneOptions} />
      </div>
    </div>
  );

  return (
    <FormShell title={mode === "create" ? "NEW_BADGE.EXE" : "EDIT_BADGE.EXE"} entityName={initial.name}>
      <ResourceForm
        resource="Badge"
        mode={mode}
        initialValues={initial as unknown as Record<string, unknown>}
        requiredKeys={["name", "slug"]}
        hub="/admin/badges"
        deleteItem={deleteAdminBadge}
        itemName={initial.name || "this Badge"}
        toInput={(values) => ({
          name: fieldText(values.name, "").trim(),
          slug: fieldText(values.slug, "").trim(),
          description: fieldText(values.description, "").trim() || undefined,
          imageUrl: fieldText(values.imageUrl, "").trim() || undefined,
          criteria: toCriteria(values.criteria as CriteriaValue),
        })}
        renderFields={renderFields}
      />
    </FormShell>
  );
}
