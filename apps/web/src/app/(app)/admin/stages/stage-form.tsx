"use client";

import { useEffect, useMemo, useState } from "react";
import { ResourceForm } from "@/components/admin/resource-form";
import { EditLoadState, FormShell } from "@/components/admin/form-controls";
import { LessonBuilder, toDraftBlocks, toLessonPayload } from "@/components/admin/lesson-builder";
import { API_URL, useCatalog, useToken } from "@/components/admin/use-catalog";
import { ApiError, deleteAdminStage, getAdminStage } from "@/lib/api-client";
import { makeStageFields, stageInitial, stageInput, type StageValues } from "./stage-fields";

export function StageForm({ mode, id }: Readonly<{ mode: "create" | "edit"; id?: string }>) {
  const token = useToken();
  const catalog = useCatalog(token, { stages: false });
  const [initial, setInitial] = useState<StageValues | null>(() => (mode === "create" ? stageInitial(undefined, undefined, toDraftBlocks) : null));
  const [status, setStatus] = useState<"loading" | "not-found" | "error" | "ready">(mode === "create" ? "ready" : "loading");

  useEffect(() => {
    if (mode !== "edit" || !id || !token) return;
    let cancelled = false;
    void getAdminStage(API_URL, token, Number(id))
      .then((stage) => {
        if (cancelled) return;
        setInitial(stageInitial(stage, undefined, toDraftBlocks));
        setStatus("ready");
      })
      .catch((cause: unknown) => {
        if (!cancelled) setStatus(cause instanceof ApiError && cause.status === 404 ? "not-found" : "error");
      });
    return () => {
      cancelled = true;
    };
  }, [mode, id, token]);

  const regionName = useMemo(() => new Map(catalog.regions.map((region) => [region.id, region.name])), [catalog.regions]);
  const zoneOptions = useMemo(
    () =>
      catalog.zones.map((zone) => ({
        value: zone.id,
        label: `${regionName.get(zone.regionId) ?? "?"} › ${zone.name}`,
      })),
    [catalog.zones, regionName],
  );

  if (status === "loading") return <EditLoadState loading resource="Stage" />;
  if (status === "not-found") return <EditLoadState notFound resource="Stage" />;
  if (status === "error") return <EditLoadState error resource="Stage" />;
  if (!initial) return null;

  return (
    <FormShell title={mode === "create" ? "NEW_STAGE.EXE" : "EDIT_STAGE.EXE"}>
      <ResourceForm
        resource="Stage"
        mode={mode}
        initialValues={initial as unknown as Record<string, unknown>}
        requiredKeys={["zoneId", "title", "slug"]}
        toInput={(values) => stageInput(values, toLessonPayload)}
        hub="/admin/stages"
        deleteItem={deleteAdminStage}
        itemName={initial.title || "this Stage"}
        cascadeWarning="Deleting a Stage cascades to its Quests; learner progress rows are removed."
        renderFields={makeStageFields(zoneOptions, (blocks, onChange) => <LessonBuilder blocks={blocks} onChange={onChange} />)}
      />
    </FormShell>
  );
}
