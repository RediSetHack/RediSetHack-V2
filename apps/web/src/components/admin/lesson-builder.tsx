"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Boxes, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Window, Y2kButton, Y2kInput, Y2kSelect, Y2kTextarea, buttonClasses } from "@/components/y2k";
import { Y2kDialog } from "@/components/y2k-dialog";
import { FormField } from "@/components/admin/form-controls";
import { fieldText, buildLessonPayload, newId } from "@/lib/admin-helpers";

const LANGUAGES = ["python", "javascript", "cpp", "c", "java"] as const;

/** One lesson block the builder edits; `key` keeps React identity across reorders. */
export type LessonDraftBlock = { key: string; block: Record<string, unknown> };

const KNOWN_TYPES = ["text", "code", "exercise", "image"] as const;

/** Maps a Stage's raw `lessonContent` (or a fresh payload) into builder blocks. */
export function toDraftBlocks(blocks: readonly Record<string, unknown>[]): LessonDraftBlock[] {
  return blocks.map((value) => ({ key: newId("block"), block: { ...value } }));
}

/** The builder's blocks, normalized into the API's lesson-content shape. */
export function toLessonPayload(blocks: readonly LessonDraftBlock[]) {
  return buildLessonPayload(blocks.map(({ block }) => block) as never);
}

/**
 * The Stage lesson builder: an ordered, reorderable list of block windows.
 * Blocks keep their raw record so an unrecognised future type survives
 * editing untouched. PREVIEW LESSON renders the normalized payload.
 */
export function LessonBuilder({
  blocks,
  onChange,
}: Readonly<{ blocks: readonly LessonDraftBlock[]; onChange: (next: LessonDraftBlock[]) => void }>) {
  const [previewOpen, setPreviewOpen] = useState(false);

  const patch = (key: string, next: Record<string, unknown>) =>
    onChange(blocks.map((entry) => (entry.key === key ? { ...entry, block: next } : entry)));

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    onChange(next);
  };

  const add = (block: Record<string, unknown>) => onChange([...blocks, { key: newId("block"), block }]);

  const preview = toLessonPayload(blocks).map((block, index) => ({ key: blocks[index]!.key, block }));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Lesson content ({blocks.length} blocks)
        </span>
        <Y2kButton variant="secondary" onClick={() => setPreviewOpen(true)} disabled={blocks.length === 0}>
          PREVIEW LESSON
        </Y2kButton>
      </div>

      {blocks.length === 0 ? (
        <p className="border-2 border-dashed border-border p-4 text-center font-body text-sm font-bold text-muted-foreground">
          No blocks yet — add the first one.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {blocks.map((entry, index) => {
            const block = entry.block;
            const type = fieldText(block.type, "unknown");
            const known = (KNOWN_TYPES as readonly string[]).includes(type);
            return (
              <li key={entry.key} className="border-2 border-border bg-window-body p-3 shadow-[2px_2px_0_var(--border)]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-pixel text-[9px] leading-relaxed uppercase">{type} block</span>
                  <div className="flex items-center gap-1">
                    <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label="Move block up" className={cn(buttonClasses("secondary"), index === 0 && "pointer-events-none opacity-40")}>
                      <ArrowUp aria-hidden="true" className="size-3" />
                    </button>
                    <button type="button" disabled={index === blocks.length - 1} onClick={() => move(index, 1)} aria-label="Move block down" className={cn(buttonClasses("secondary"), index === blocks.length - 1 && "pointer-events-none opacity-40")}>
                      <ArrowDown aria-hidden="true" className="size-3" />
                    </button>
                    <button type="button" onClick={() => onChange(blocks.filter((candidate) => candidate.key !== entry.key))} aria-label="Delete block" className={buttonClasses("danger")}>
                      <Trash2 aria-hidden="true" className="size-3" />
                    </button>
                  </div>
                </div>

                {type === "text" && (
                  <FormField id={`block-${entry.key}-content`} label="Content" required>
                    <Y2kTextarea
                      id={`block-${entry.key}-content`}
                      value={fieldText(block.content, "")}
                      onChange={(event) => patch(entry.key, { ...block, content: event.target.value })}
                    />
                  </FormField>
                )}

                {type === "code" && (
                  <>
                    <FormField id={`block-${entry.key}-language`} label="Language" required>
                      <Y2kSelect
                        id={`block-${entry.key}-language`}
                        value={fieldText(block.language, "python")}
                        onChange={(event) => patch(entry.key, { ...block, language: event.target.value })}
                      >
                        {LANGUAGES.map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </Y2kSelect>
                    </FormField>
                    <FormField id={`block-${entry.key}-code`} label="Code" required>
                      <Y2kTextarea
                        id={`block-${entry.key}-code`}
                        value={fieldText(block.content, "")}
                        onChange={(event) => patch(entry.key, { ...block, content: event.target.value })}
                        className="font-mono"
                      />
                    </FormField>
                  </>
                )}

                {type === "exercise" && (
                  <>
                    <FormField id={`block-${entry.key}-prompt`} label="Prompt" required>
                      <Y2kTextarea
                        id={`block-${entry.key}-prompt`}
                        value={fieldText(block.prompt, "")}
                        onChange={(event) => patch(entry.key, { ...block, prompt: event.target.value })}
                      />
                    </FormField>
                    <FormField id={`block-${entry.key}-language`} label="Language" required>
                      <Y2kSelect
                        id={`block-${entry.key}-language`}
                        value={fieldText(block.language, "python")}
                        onChange={(event) => patch(entry.key, { ...block, language: event.target.value })}
                      >
                        {LANGUAGES.map((language) => (
                          <option key={language} value={language}>
                            {language}
                          </option>
                        ))}
                      </Y2kSelect>
                    </FormField>
                    <FormField id={`block-${entry.key}-starter`} label="Starter code">
                      <Y2kTextarea
                        id={`block-${entry.key}-starter`}
                        value={fieldText(block.starterCode, "")}
                        onChange={(event) => patch(entry.key, { ...block, starterCode: event.target.value })}
                        className="font-mono"
                      />
                    </FormField>
                  </>
                )}

                {type === "image" && (
                  <>
                    <FormField id={`block-${entry.key}-url`} label="Image URL" required>
                      <Y2kInput
                        id={`block-${entry.key}-url`}
                        value={fieldText(block.url, "")}
                        onChange={(event) => patch(entry.key, { ...block, url: event.target.value })}
                      />
                    </FormField>
                    <FormField id={`block-${entry.key}-alt`} label="Alt text" required>
                      <Y2kInput
                        id={`block-${entry.key}-alt`}
                        value={fieldText(block.alt, "")}
                        onChange={(event) => patch(entry.key, { ...block, alt: event.target.value })}
                      />
                    </FormField>
                    <FormField id={`block-${entry.key}-caption`} label="Caption">
                      <Y2kInput
                        id={`block-${entry.key}-caption`}
                        value={fieldText(block.caption, "")}
                        onChange={(event) => patch(entry.key, { ...block, caption: event.target.value })}
                      />
                    </FormField>
                  </>
                )}

                {!known && (
                  <p className="font-body text-sm font-bold text-muted-foreground">
                    Unsupported block type — preserved as-is.
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      )}

      <details className="border-2 border-border bg-window-body p-2">
        <summary className="cursor-pointer font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          ADD BLOCK
        </summary>
        <div className="mt-2 flex flex-wrap gap-2">
          <Y2kButton variant="secondary" onClick={() => add({ type: "text", content: "" } as Record<string, unknown>)}>
            <Boxes aria-hidden="true" className="size-3" /> TEXT
          </Y2kButton>
          <Y2kButton variant="secondary" onClick={() => add({ type: "code", language: "python", content: "" })}>
            CODE
          </Y2kButton>
          <Y2kButton variant="secondary" onClick={() => add({ type: "exercise", prompt: "", language: "python", starterCode: "" })}>
            EXERCISE
          </Y2kButton>
          <Y2kButton variant="secondary" onClick={() => add({ type: "image", url: "", alt: "" })}>
            IMAGE
          </Y2kButton>
        </div>
      </details>

      <Y2kDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="LESSON_PREVIEW.EXE"
        className="max-w-xl"
        actions={
          <Y2kButton variant="secondary" onClick={() => setPreviewOpen(false)}>
            CLOSE
          </Y2kButton>
        }
      >
        <Window title="LESSON" controls={false} className="w-full">
          <ol className="flex flex-col gap-2">
            {preview.map(({ key, block }) => (
              <li key={key} className="border-2 border-border p-2">
                <span className="font-pixel text-[9px] leading-relaxed uppercase">
                  {(block as { type: string }).type}
                </span>
                <pre className="mt-1 font-mono text-xs whitespace-pre-wrap">{JSON.stringify(block, null, 2)}</pre>
              </li>
            ))}
          </ol>
        </Window>
      </Y2kDialog>
    </div>
  );
}
