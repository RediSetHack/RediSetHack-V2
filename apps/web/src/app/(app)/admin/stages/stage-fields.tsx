"use client";

import { Y2kInput, Y2kSelect } from "@/components/y2k";
import { FormField } from "@/components/admin/form-controls";
import { fieldText, defaultSlug } from "@/lib/admin-helpers";
import type { LessonDraftBlock } from "@/components/admin/lesson-builder";

export type StageValues = {
  id: number;
  zoneId: number;
  title: string;
  slug: string;
  xpReward: number;
  sortOrder: number;
  lessonContent: LessonDraftBlock[];
};

export function stageInitial(
  stage?: { id: number; zoneId: number; title: string; slug: string; xpReward: number; sortOrder: number; lessonContent?: unknown },
  presetZoneId?: number,
  toBlocks?: (blocks: readonly Record<string, unknown>[]) => LessonDraftBlock[],
): StageValues {
  const raw = Array.isArray(stage?.lessonContent) ? (stage!.lessonContent as Record<string, unknown>[]) : [];
  return {
    id: stage?.id ?? 0,
    zoneId: stage?.zoneId ?? presetZoneId ?? 0,
    title: stage?.title ?? "",
    slug: stage?.slug ?? "",
    xpReward: stage?.xpReward ?? 0,
    sortOrder: stage?.sortOrder ?? 0,
    lessonContent: toBlocks ? toBlocks(raw) : [],
  };
}

export function makeStageFields(
  zoneOptions: readonly { value: number; label: string }[],
  lessonBuilder: (blocks: LessonDraftBlock[], onChange: (next: LessonDraftBlock[]) => void) => React.ReactNode,
) {
  return function StageFields({
    values,
    set,
    errors,
  }: Readonly<{ values: Record<string, unknown>; set: (key: string, value: unknown) => void; errors: Record<string, string> }>) {
    return (
      <div className="flex flex-col gap-4">
        <FormField id="stage-zone" label="Zone" required error={errors.zoneId}>
          <Y2kSelect id="stage-zone" value={fieldText(values.zoneId, "0")} onChange={(event) => set("zoneId", Number(event.target.value))}>
            <option value="0">Select a Zone…</option>
            {zoneOptions.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label}
              </option>
            ))}
          </Y2kSelect>
        </FormField>
        <FormField id="stage-title" label="Title" required error={errors.title}>
          <Y2kInput
            id="stage-title"
            value={fieldText(values.title, "")}
            onChange={(event) => {
              set("title", event.target.value);
              set("slug", defaultSlug(event.target.value));
            }}
          />
        </FormField>
        <FormField id="stage-slug" label="Slug" required error={errors.slug} hint={<span className="font-body text-xs text-muted-foreground">Unique within the Zone.</span>}>
          <Y2kInput id="stage-slug" value={fieldText(values.slug, "")} onChange={(event) => set("slug", event.target.value)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="stage-xp" label="XP reward" required error={errors.xpReward}>
            <Y2kInput id="stage-xp" type="number" min={0} value={Number(values.xpReward ?? 0)} onChange={(event) => set("xpReward", Number(event.target.value))} />
          </FormField>
          <FormField id="stage-sort" label="Sort order" error={errors.sortOrder}>
            <Y2kInput id="stage-sort" type="number" value={Number(values.sortOrder ?? 0)} onChange={(event) => set("sortOrder", Number(event.target.value))} />
          </FormField>
        </div>
        <div className="border-t-2 border-border pt-4">
          {lessonBuilder((values.lessonContent as LessonDraftBlock[]) ?? [], (next) => set("lessonContent", next))}
        </div>
      </div>
    );
  };
}

export function stageInput(values: Record<string, unknown>, toPayload: (blocks: readonly LessonDraftBlock[]) => unknown) {
  return {
    zoneId: Number(values.zoneId),
    title: fieldText(values.title, "").trim(),
    slug: fieldText(values.slug, "").trim(),
    xpReward: Number(values.xpReward ?? 0),
    sortOrder: Number(values.sortOrder ?? 0),
    lessonContent: toPayload((values.lessonContent as LessonDraftBlock[]) ?? []),
  };
}
