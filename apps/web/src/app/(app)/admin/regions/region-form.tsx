"use client";

import { useEffect, useState } from "react";
import { ResourceForm } from "@/components/admin/resource-form";
import { EditLoadState, FormShell } from "@/components/admin/form-controls";
import { API_URL, useToken } from "@/components/admin/use-catalog";
import { useAdminAccess } from "@/components/admin/admin-access";
import { ApiError, deleteAdminRegion, getAdminRegion } from "@/lib/api-client";
import { regionFields, regionInitial, regionInput, type RegionValues } from "./region-fields";

export function RegionForm({ mode, id }: Readonly<{ mode: "create" | "edit"; id?: string }>) {
  const token = useToken();
  const { report } = useAdminAccess();
  const [initial, setInitial] = useState<RegionValues | null>(mode === "create" ? regionInitial() : null);
  const [status, setStatus] = useState<"loading" | "not-found" | "error" | "ready">(mode === "create" ? "ready" : "loading");

  useEffect(() => {
    if (mode !== "edit" || !id || !token) return;
    let cancelled = false;
    void getAdminRegion(API_URL, token, Number(id))
      .then((region) => {
        if (cancelled) return;
        setInitial(regionInitial(region));
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

  if (status === "loading") return <EditLoadState loading resource="Region" />;
  if (status === "not-found") return <EditLoadState notFound resource="Region" />;
  if (status === "error") return <EditLoadState error resource="Region" />;
  if (!initial) return null;

  return (
    <FormShell title={mode === "create" ? "NEW_REGION.EXE" : "EDIT_REGION.EXE"} entityName={initial.name}>
      <ResourceForm
        resource="Region"
        mode={mode}
        initialValues={initial as unknown as Record<string, unknown>}
        requiredKeys={["name", "slug"]}
        toInput={regionInput}
        hub="/admin/regions"
        deleteItem={deleteAdminRegion}
        itemName={initial.name || "this Region"}
        renderFields={regionFields}
      />
    </FormShell>
  );
}
