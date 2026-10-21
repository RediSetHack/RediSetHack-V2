"use client";

import { Y2kInput, Y2kSelect, Y2kTextarea } from "@/components/y2k";
import { FormField } from "@/components/admin/form-controls";
import { fieldText, nextSlug } from "@/lib/admin-helpers";

export type ZoneValues = { id: number; regionId: number; name: string; slug: string; description: string; sortOrder: number };

export function zoneInitial(zone?: { id: number; regionId: number; name: string; slug: string; description: string | null; sortOrder: number }, presetRegionId?: number): ZoneValues {
  return {
    id: zone?.id ?? 0,
    regionId: zone?.regionId ?? presetRegionId ?? 0,
    name: zone?.name ?? "",
    slug: zone?.slug ?? "",
    description: zone?.description ?? "",
    sortOrder: zone?.sortOrder ?? 0,
  };
}

export function makeZoneFields(regionOptions: readonly { value: number; label: string }[]) {
  return function ZoneFields({
    values,
    set,
    errors,
  }: Readonly<{ values: Record<string, unknown>; set: (key: string, value: unknown) => void; errors: Record<string, string> }>) {
    return (
      <div className="flex flex-col gap-4">
        <FormField id="zone-region" label="Region" required error={errors.regionId}>
          <Y2kSelect id="zone-region" value={fieldText(values.regionId, "0")} onChange={(event) => set("regionId", Number(event.target.value))}>
            <option value="0">Select a Region…</option>
            {regionOptions.map((region) => (
              <option key={region.value} value={region.value}>
                {region.label}
              </option>
            ))}
          </Y2kSelect>
        </FormField>
        <FormField id="zone-name" label="Name" required error={errors.name}>
          <Y2kInput
            id="zone-name"
            value={fieldText(values.name, "")}
            onChange={(event) => {
              set("name", event.target.value);
              set("slug", nextSlug(values, "name", event.target.value));
            }}
          />
        </FormField>
        <FormField id="zone-slug" label="Slug" required error={errors.slug} hint={<span className="font-body text-xs text-muted-foreground">Unique within the Region.</span>}>
          <Y2kInput id="zone-slug" value={fieldText(values.slug, "")} onChange={(event) => set("slug", event.target.value)} />
        </FormField>
        <FormField id="zone-description" label="Description" error={errors.description}>
          <Y2kTextarea id="zone-description" value={fieldText(values.description, "")} onChange={(event) => set("description", event.target.value)} />
        </FormField>
        <FormField id="zone-sort" label="Sort order" error={errors.sortOrder}>
          <Y2kInput id="zone-sort" type="number" value={Number(values.sortOrder ?? 0)} onChange={(event) => set("sortOrder", Number(event.target.value))} />
        </FormField>
      </div>
    );
  };
}

export function zoneInput(values: Record<string, unknown>) {
  return {
    regionId: Number(values.regionId),
    name: fieldText(values.name, "").trim(),
    slug: fieldText(values.slug, "").trim(),
    description: fieldText(values.description, "").trim() || undefined,
    sortOrder: Number(values.sortOrder ?? 0),
  };
}
