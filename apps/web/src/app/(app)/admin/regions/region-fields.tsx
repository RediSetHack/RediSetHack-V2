"use client";

import { Y2kInput, Y2kTextarea } from "@/components/y2k";
import { FormField } from "@/components/admin/form-controls";
import { fieldText, defaultSlug } from "@/lib/admin-helpers";

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
          value={fieldText(values.name, "")}
          onChange={(event) => {
            set("name", event.target.value);
            // Keep following the name until the admin edits the slug by hand.
            if (values.slug === defaultSlug(fieldText(values.name))) set("slug", defaultSlug(event.target.value));
          }}
        />
      </FormField>
      <FormField id="region-slug" label="Slug" required error={errors.slug} hint={<span className="font-body text-xs text-muted-foreground">Auto-filled from the name; lowercase-kebab, unique.</span>}>
        <Y2kInput id="region-slug" value={fieldText(values.slug, "")} onChange={(event) => set("slug", event.target.value)} />
      </FormField>
      <FormField id="region-description" label="Description" error={errors.description}>
        <Y2kTextarea id="region-description" value={fieldText(values.description, "")} onChange={(event) => set("description", event.target.value)} />
      </FormField>
      <FormField id="region-sort" label="Sort order" error={errors.sortOrder}>
        <Y2kInput id="region-sort" type="number" value={Number(values.sortOrder ?? 0)} onChange={(event) => set("sortOrder", Number(event.target.value))} />
      </FormField>
    </div>
  );
}

export function regionInput(values: Record<string, unknown>) {
  return {
    name: fieldText(values.name, "").trim(),
    slug: fieldText(values.slug, "").trim(),
    description: fieldText(values.description, "").trim() || undefined,
    sortOrder: Number(values.sortOrder ?? 0),
  };
}
