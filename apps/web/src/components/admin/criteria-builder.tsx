"use client";

import { useState } from "react";
import { ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Y2kInput, Y2kSelect, buttonClasses } from "@/components/y2k";
import { FormField } from "@/components/admin/form-controls";
import { criteriaToSentence } from "@/lib/admin-helpers";

export const TRIGGERS = [
  { value: "cumulative", label: "Cumulative" },
  { value: "category", label: "Zone or category completion" },
  { value: "activity", label: "Activity milestone" },
] as const;

/** The one target each accepted trigger allows, per the API's `IsBadgeCriteria`. */
export const TARGETS: readonly { trigger: string; value: string; label: string }[] = [
  { trigger: "cumulative", value: "stage_completions", label: "stage completions" },
  { trigger: "activity", value: "quest_passes", label: "quests passed" },
  { trigger: "category", value: "zone_completion", label: "zone completion" },
];

export type CriteriaValue = {
  trigger: "cumulative" | "category" | "activity";
  target: string;
  threshold: number;
  zoneId: number;
};

/** The API's `criteria` object for the current builder state. */
export function toCriteria(value: CriteriaValue) {
  switch (value.trigger) {
    case "cumulative":
      return { trigger: "cumulative" as const, target: "stage_completions" as const, threshold: value.threshold };
    case "activity":
      return { trigger: "activity" as const, target: "quest_passes" as const, threshold: value.threshold };
    case "category":
      return { trigger: "category" as const, target: "zone_completion" as const, zoneId: value.zoneId };
  }
}

/**
 * The Badge criteria builder: Trigger + Target + Threshold, a live sentence,
 * and a raw-JSON toggle showing exactly what will be sent.
 */
export function CriteriaBuilder({
  value,
  onChange,
  zoneOptions,
}: Readonly<{
  value: CriteriaValue;
  onChange: (next: CriteriaValue) => void;
  /** Zones to pick from for the `category` trigger (Region › Zone label). */
  zoneOptions: readonly { value: string; label: string }[];
}>) {
  const [showRaw, setShowRaw] = useState(false);
  const criteria = toCriteria(value);
  const exhaustive = criteriaToSentence(criteria);

  const targetsForTrigger = TARGETS.filter((candidate) => candidate.trigger === value.trigger);

  return (
    <div className="flex flex-col gap-3 border-2 border-border bg-window-body p-3 shadow-[2px_2px_0_var(--border)]">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField id="criteria-trigger" label="Trigger" required>
          <Y2kSelect
            id="criteria-trigger"
            value={value.trigger}
            onChange={(event) => {
              const trigger = event.target.value as CriteriaValue["trigger"];
              const target = TARGETS.find((candidate) => candidate.trigger === trigger)?.value ?? "stage_completions";
              onChange({ ...value, trigger, target });
            }}
          >
            {TRIGGERS.map((trigger) => (
              <option key={trigger.value} value={trigger.value}>
                {trigger.label}
              </option>
            ))}
          </Y2kSelect>
        </FormField>

        <FormField id="criteria-target" label="Target" required>
          <Y2kSelect id="criteria-target" value={value.target} onChange={(event) => onChange({ ...value, target: event.target.value })}>
            {targetsForTrigger.map((target) => (
              <option key={target.value} value={target.value}>
                {target.label}
              </option>
            ))}
          </Y2kSelect>
        </FormField>

        {value.trigger === "category" ? (
          <FormField id="criteria-zone" label="Zone" required hint={<span className="font-body text-xs text-muted-foreground">The Zone a learner must fully complete.</span>}>
            <Y2kSelect id="criteria-zone" value={String(value.zoneId)} onChange={(event) => onChange({ ...value, zoneId: Number(event.target.value) })}>
              <option value="0">Select a Zone…</option>
              {zoneOptions.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label}
                </option>
              ))}
            </Y2kSelect>
          </FormField>
        ) : (
          <FormField id="criteria-threshold" label="Threshold" required>
            <Y2kInput
              id="criteria-threshold"
              type="number"
              min={1}
              value={value.threshold}
              onChange={(event) => onChange({ ...value, threshold: Number(event.target.value) })}
            />
          </FormField>
        )}
      </div>

      <p role="status" className="border-2 border-dashed border-border px-3 py-2 font-pixel-lg text-lg leading-snug text-foreground">
        {exhaustive}
      </p>

      <div>
        <button
          type="button"
          aria-expanded={showRaw}
          onClick={() => setShowRaw((visible) => !visible)}
          className={cn(buttonClasses("ghost"), "gap-1")}
        >
          <ChevronsUpDown aria-hidden="true" className="size-3" />
          Raw JSON
        </button>
        {showRaw && (
          <pre className="mt-2 overflow-x-auto border-2 border-border bg-white p-2 font-mono text-xs">
            {JSON.stringify(criteria, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}
