"use client";

import { useEffect, useMemo, useState } from "react";
import { ResourceForm } from "@/components/admin/resource-form";
import { EditLoadState, FormField, FormShell } from "@/components/admin/form-controls";
import { QuestionBuilder } from "@/components/admin/question-builder";
import { API_URL, useCatalog, useToken } from "@/components/admin/use-catalog";
import { useAdminAccess } from "@/components/admin/admin-access";
import { ApiError, deleteAdminQuest, getAdminQuest } from "@/lib/api-client";
import { Y2kInput, Y2kTextarea, Y2kSelect } from "@/components/y2k";
import { fieldText, newQuestion, validateQuestionSet, type AdminQuestion } from "@/lib/admin-helpers";
import { formatMmSs } from "@/lib/format";

type QuestValues = {
  id: number;
  stageId: number;
  title: string;
  description: string;
  timeLimitSeconds: number;
  passingScore: number;
  xpReward: number;
  questions: AdminQuestion[];
};

function questInitial(
  quest?: { id: number; stageId: number; title: string; description: string | null; timeLimitSeconds: number; passingScore: number; xpReward: number; questions?: unknown },
  presetStageId?: number,
): QuestValues {
  const raw = Array.isArray(quest?.questions) ? (quest!.questions as AdminQuestion[]) : [];
  return {
    id: quest?.id ?? 0,
    stageId: quest?.stageId ?? presetStageId ?? 0,
    title: quest?.title ?? "",
    description: quest?.description ?? "",
    timeLimitSeconds: quest?.timeLimitSeconds ?? 60,
    passingScore: quest?.passingScore ?? 70,
    xpReward: quest?.xpReward ?? 0,
    questions: raw.length > 0 ? raw.map((q) => ({ ...q, options: q.options.map((option) => ({ ...option })) })) : [newQuestion()],
  };
}

export function QuestForm({ mode, id }: Readonly<{ mode: "create" | "edit"; id?: string }>) {
  const token = useToken();
  const { report } = useAdminAccess();
  const catalog = useCatalog(token, { stages: true });
  const [initial, setInitial] = useState<QuestValues | null>(mode === "create" ? questInitial() : null);
  const [status, setStatus] = useState<"loading" | "not-found" | "error" | "ready">(mode === "create" ? "ready" : "loading");

  useEffect(() => {
    if (mode !== "edit" || !id || !token) return;
    let cancelled = false;
    void getAdminQuest(API_URL, token, Number(id))
      .then((quest) => {
        if (cancelled) return;
        setInitial(questInitial(quest));
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

  const stageOptions = useMemo(() => {
    const regionName = new Map(catalog.regions.map((region) => [region.id, region.name]));
    const zoneById = new Map(catalog.zones.map((zone) => [zone.id, zone]));
    return catalog.stages.map((stage) => {
      const zone = zoneById.get(stage.zoneId);
      const region = zone ? regionName.get(zone.regionId) : undefined;
      return { value: stage.id, label: `${region ?? "?"} › ${zone?.name ?? "?"} › ${stage.title}` };
    });
  }, [catalog.stages, catalog.zones, catalog.regions]);

  if (status === "loading") return <EditLoadState loading resource="Quest" />;
  if (status === "not-found") return <EditLoadState notFound resource="Quest" />;
  if (status === "error") return <EditLoadState error resource="Quest" />;
  if (!initial) return null;

  const renderFields = ({
    values,
    set,
    errors,
  }: Readonly<{ values: Record<string, unknown>; set: (key: string, value: unknown) => void; errors: Record<string, string> }>) => (
    <div className="flex flex-col gap-4">
      <FormField id="quest-stage" label="Stage" required error={errors.stageId}>
        <Y2kSelect id="quest-stage" value={fieldText(values.stageId, "0")} onChange={(event) => set("stageId", Number(event.target.value))}>
          <option value="0">Select a Stage…</option>
          {stageOptions.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </Y2kSelect>
      </FormField>
      <FormField id="quest-title" label="Title" required error={errors.title}>
        <Y2kInput id="quest-title" value={fieldText(values.title, "")} onChange={(event) => set("title", event.target.value)} />
      </FormField>
      <FormField id="quest-description" label="Description" error={errors.description}>
        <Y2kTextarea id="quest-description" value={fieldText(values.description, "")} onChange={(event) => set("description", event.target.value)} />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField id="quest-time" label="Time limit (seconds)" required error={errors.timeLimitSeconds} hint={<span className="font-body text-xs text-muted-foreground">{formatMmSs(Number(values.timeLimitSeconds ?? 0))}</span>}>
          <Y2kInput id="quest-time" type="number" min={1} value={Number(values.timeLimitSeconds ?? 60)} onChange={(event) => set("timeLimitSeconds", Number(event.target.value))} />
        </FormField>
        <FormField id="quest-passing" label="Passing %" required error={errors.passingScore}>
          <Y2kInput id="quest-passing" type="number" min={0} max={100} value={Number(values.passingScore ?? 70)} onChange={(event) => set("passingScore", Number(event.target.value))} />
        </FormField>
        <FormField id="quest-xp" label="XP reward" required error={errors.xpReward}>
          <Y2kInput id="quest-xp" type="number" min={0} value={Number(values.xpReward ?? 0)} onChange={(event) => set("xpReward", Number(event.target.value))} />
        </FormField>
      </div>
      <div className="border-t-2 border-border pt-4">
        <QuestionBuilder questions={(values.questions as AdminQuestion[]) ?? []} onChange={(next) => set("questions", next)} />
      </div>
    </div>
  );

  return (
    <FormShell title={mode === "create" ? "NEW_QUEST.EXE" : "EDIT_QUEST.EXE"} entityName={initial.title}>
      <ResourceForm
        resource="Quest"
        mode={mode}
        initialValues={initial as unknown as Record<string, unknown>}
        requiredKeys={["stageId", "title"]}
        hub="/admin/quests"
        deleteItem={deleteAdminQuest}
        itemName={initial.title || "this Quest"}
        toInput={(values) => {
          const questions = (values.questions as AdminQuestion[]) ?? [];
          const errors = validateQuestionSet(questions);
          if (errors.length > 0) throw new ApiError(400, errors.join("; "));
          return {
            stageId: Number(values.stageId),
            title: fieldText(values.title, "").trim(),
            description: fieldText(values.description, "").trim() || undefined,
            timeLimitSeconds: Number(values.timeLimitSeconds ?? 60),
            passingScore: Number(values.passingScore ?? 70),
            xpReward: Number(values.xpReward ?? 0),
            questions,
          };
        }}
        renderFields={renderFields}
      />
    </FormShell>
  );
}
