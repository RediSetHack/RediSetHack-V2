"use client";

import { Y2kInput, Y2kTextarea } from "@/components/y2k";
import { FormField } from "@/components/admin/form-controls";
import { defaultSlug } from "@/lib/admin-helpers";

export type RegionValues = {
  id: number;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
};

export function regionInitial(region?: { id: number; name: string; slug: string; description: string | null; sortOrder: number }): RegionValues {
  return {
    id: region?.id ?? 0,
    name: region?.name ?? "",
    slug: region?.slug ?? "",
    description: region?.description ?? "",
    sortOrder: region?.sortOrder ?? 0,
  };
}

export function regionFields({
  values,
  set,
  errors,
}: Readonly<{ values: Record<string, unknown>; set: (key: string, value: unknown) => void; errors: Record<string, string> }>) {
  return (
    <div className="flex flex-col gap-4">
      <FormField id="region-name" label="Name" required error={errors.name}>
        <Y2kInput
          id="region-name"
          value={String(values.name ?? "")}
          onChange={(event) => {
            set("name", event.target.value);
            set("slug", defaultSlug(event.target.value));
          }}
        />
      </FormField>
      <FormField id="region-slug" label="Slug" required error={errors.slug} hint={<span className="font-body text-xs text-muted-foreground">Auto-filled from the name; lowercase-kebab, unique.</span>}>
        <Y2kInput id="region-slug" value={String(values.slug ?? "")} onChange={(event) => set("slug", event.target.value)} />
      </FormField>
      <FormField id="region-description" label="Description" error={errors.description}>
        <Y2kTextarea id="region-description" value={String(values.description ?? "")} onChange={(event) => set("description", event.target.value)} />
      </FormField>
      <FormField id="region-sort" label="Sort order" error={errors.sortOrder}>
        <Y2kInput id="region-sort" type="number" value={Number(values.sortOrder ?? 0)} onChange={(event) => set("sortOrder", Number(event.target.value))} />
      </FormField>
    </div>
  );
}

export function regionInput(values: Record<string, unknown>) {
  return {
    name: String(values.name ?? "").trim(),
    slug: String(values.slug ?? "").trim(),
    description: String(values.description ?? "").trim() || undefined,
    sortOrder: Number(values.sortOrder ?? 0),
  };
}
