"use client";

import { useEffect, useMemo, useState } from "react";
import { ResourceForm } from "@/components/admin/resource-form";
import { EditLoadState, FormShell } from "@/components/admin/form-controls";
import { API_URL, useCatalog, useToken } from "@/components/admin/use-catalog";
import { ApiError, deleteAdminZone, getAdminZone } from "@/lib/api-client";
import { makeZoneFields, zoneInitial, zoneInput, type ZoneValues } from "./zone-fields";

export function ZoneForm({ mode, id }: Readonly<{ mode: "create" | "edit"; id?: string }>) {
  const token = useToken();
  const catalog = useCatalog(token, { stages: false });
  const [initial, setInitial] = useState<ZoneValues | null>(mode === "create" ? zoneInitial() : null);
  const [status, setStatus] = useState<"loading" | "not-found" | "error" | "ready">(mode === "create" ? "ready" : "loading");

  useEffect(() => {
    if (mode !== "edit" || !id || !token) return;
    let cancelled = false;
    void getAdminZone(API_URL, token, Number(id))
      .then((zone) => {
        if (cancelled) return;
        setInitial(zoneInitial(zone));
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (!cancelled) setStatus(cause instanceof ApiError && cause.status === 404 ? "not-found" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [mode, id, token]);

  const regionOptions = useMemo(
    () => catalog.regions.map((region) => ({ value: region.id, label: region.name })),
    [catalog.regions],
  );

  if (status === "loading") return <EditLoadState loading resource="Zone" />;
  if (status === "not-found") return <EditLoadState notFound resource="Zone" />;
  if (status === "error") return <EditLoadState error resource="Zone" />;
  if (!initial) return null;

  return (
    <FormShell title={mode === "create" ? "NEW_ZONE.EXE" : "EDIT_ZONE.EXE"}>
      <ResourceForm
        resource="Zone"
        mode={mode}
        initialValues={initial as unknown as Record<string, unknown>}
        requiredKeys={["regionId", "name", "slug"]}
        toInput={zoneInput}
        hub="/admin/zones"
        deleteItem={deleteAdminZone}
        itemName={initial.name || "this Zone"}
        cascadeWarning="Deleting a Zone cascades to its Stages and Quests."
        renderFields={makeZoneFields(regionOptions)}
      />
    </FormShell>
  );
}
