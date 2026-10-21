"use client";

import { useEffect, useState } from "react";
import { ResourceForm } from "@/components/admin/resource-form";
import { EditLoadState, FormField, FormShell } from "@/components/admin/form-controls";
import { AvatarOrInitial, Y2kInput, Y2kTextarea } from "@/components/y2k";
import { API_URL, useToken } from "@/components/admin/use-catalog";
import { useAdminAccess } from "@/components/admin/admin-access";
import { ApiError, deleteAdminCharacter, getAdminCharacter } from "@/lib/api-client";
import { fieldText, defaultSlug } from "@/lib/admin-helpers";

type CharacterValues = { id: number; name: string; slug: string; description: string; imageUrl: string };

function characterInitial(character?: { id: number; name: string; slug: string; description: string | null; imageUrl: string | null }): CharacterValues {
  return {
    id: character?.id ?? 0,
    name: character?.name ?? "",
    slug: character?.slug ?? "",
    description: character?.description ?? "",
    imageUrl: character?.imageUrl ?? "",
  };
}

export function CharacterForm({ mode, id }: Readonly<{ mode: "create" | "edit"; id?: string }>) {
  const token = useToken();
  const { report } = useAdminAccess();
  const [initial, setInitial] = useState<CharacterValues | null>(mode === "create" ? characterInitial() : null);
  const [status, setStatus] = useState<"loading" | "not-found" | "error" | "ready">(mode === "create" ? "ready" : "loading");

  useEffect(() => {
    if (mode !== "edit" || !id || !token) return;
    let cancelled = false;
    void getAdminCharacter(API_URL, token, Number(id))
      .then((character) => {
        if (cancelled) return;
        setInitial(characterInitial(character));
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        // A `403` means the session lost its admin rights: the shell swaps
        // itself for the ACCESS DENIED window.
        if (report(cause)) return;
        if (!cancelled) setStatus(cause instanceof ApiError && cause.status === 404 ? "not-found" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [mode, id, token, report]);

  if (status === "loading") return <EditLoadState loading resource="Character" />;
  if (status === "not-found") return <EditLoadState notFound resource="Character" />;
  if (status === "error") return <EditLoadState error resource="Character" />;
  if (!initial) return null;

  const renderFields = ({
    values,
    set,
    errors,
  }: Readonly<{ values: Record<string, unknown>; set: (key: string, value: unknown) => void; errors: Record<string, string> }>) => (
    <div className="flex flex-col gap-4">
      <FormField id="character-name" label="Name" required error={errors.name}>
        <Y2kInput
          id="character-name"
          value={fieldText(values.name, "")}
          onChange={(event) => {
            set("name", event.target.value);
            set("slug", defaultSlug(event.target.value));
          }}
        />
      </FormField>
      <FormField id="character-slug" label="Slug" required error={errors.slug}>
        <Y2kInput id="character-slug" value={fieldText(values.slug, "")} onChange={(event) => set("slug", event.target.value)} />
      </FormField>
      <FormField id="character-description" label="Description" error={errors.description}>
        <Y2kTextarea id="character-description" value={fieldText(values.description, "")} onChange={(event) => set("description", event.target.value)} />
      </FormField>
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <FormField id="character-image" label="Image URL" error={errors.imageUrl}>
            <Y2kInput id="character-image" value={fieldText(values.imageUrl, "")} onChange={(event) => set("imageUrl", event.target.value)} />
          </FormField>
        </div>
        <AvatarOrInitial src={fieldText(values.imageUrl, "") || null} name={fieldText(values.name, "?")} className="size-16" />
      </div>
    </div>
  );

  return (
    <FormShell title={mode === "create" ? "NEW_CHARACTER.EXE" : "EDIT_CHARACTER.EXE"} entityName={initial.name}>
      <ResourceForm
        resource="Character"
        mode={mode}
        initialValues={initial as unknown as Record<string, unknown>}
        requiredKeys={["name", "slug"]}
        hub="/admin/characters"
        deleteItem={deleteAdminCharacter}
        itemName={initial.name || "this Character"}
        cascadeWarning="Characters assigned to learners are archived rather than deleted."
        toInput={(values) => ({
          name: fieldText(values.name, "").trim(),
          slug: fieldText(values.slug, "").trim(),
          description: fieldText(values.description, "").trim() || undefined,
          imageUrl: fieldText(values.imageUrl, "").trim() || undefined,
        })}
        renderFields={renderFields}
      />
    </FormShell>
  );
}
