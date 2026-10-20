"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Window, Y2kButton, Y2kInput, Y2kTextarea, buttonClasses } from "@/components/y2k";
import { Y2kDialog } from "@/components/y2k-dialog";
import { FormField } from "@/components/admin/form-controls";
import { newId, validateQuestionSet, type AdminQuestion } from "@/lib/admin-helpers";

export const QUESTION_MIN_OPTIONS = 2;
export const QUESTION_MAX_OPTIONS = 6;

export function optionLetter(index: number): string {
  return String.fromCodePoint(65 + index);
}

function QuestionCard({
  question,
  index,
  total,
  onChange,
  onMove,
  onDelete,
}: Readonly<{
  question: AdminQuestion;
  index: number;
  total: number;
  onChange: (next: AdminQuestion) => void;
  onMove: (direction: -1 | 1) => void;
  onDelete: () => void;
}>) {
  const patchOption = (optionId: string, text: string) =>
    onChange({ ...question, options: question.options.map((option) => (option.id === optionId ? { ...option, text } : option)) });

  const removeOption = (optionId: string) => {
    if (question.options.length <= QUESTION_MIN_OPTIONS) return;
    const options = question.options.filter((option) => option.id !== optionId);
    const correctOptionId = question.correctOptionId === optionId ? options[0]!.id : question.correctOptionId;
    onChange({ ...question, options, correctOptionId });
  };

  const addOption = () => {
    if (question.options.length >= QUESTION_MAX_OPTIONS) return;
    onChange({ ...question, options: [...question.options, { id: newId("opt"), text: "" }] });
  };

  return (
    <div className="border-2 border-border bg-window-body p-3 shadow-[2px_2px_0_var(--border)]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-pixel text-[9px] leading-relaxed text-foreground">
          Question {index + 1} of {total}
        </span>
        <div className="flex items-center gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move question up" className={cn(buttonClasses("secondary"), index === 0 && "pointer-events-none opacity-40")}>
            <ArrowUp aria-hidden="true" className="size-3" />
          </button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} aria-label="Move question down" className={cn(buttonClasses("secondary"), index === total - 1 && "pointer-events-none opacity-40")}>
            <ArrowDown aria-hidden="true" className="size-3" />
          </button>
          <button type="button" onClick={onDelete} aria-label="Delete question" className={buttonClasses("danger")}>
            <Trash2 aria-hidden="true" className="size-3" />
          </button>
        </div>
      </div>

      <FormField id={`q-${question.id}-prompt`} label="Prompt" required>
        <Y2kTextarea
          id={`q-${question.id}-prompt`}
          value={question.prompt}
          onChange={(event) => onChange({ ...question, prompt: event.target.value })}
        />
      </FormField>

      <fieldset className="mt-3">
        <legend className="font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Options (mark one correct)
        </legend>
        <ul className="mt-1 flex flex-col gap-2">
          {question.options.map((option, optionIndex) => (
            <li key={option.id} className="flex items-center gap-2">
              <label className="flex items-center gap-1">
                <input
                  type="radio"
                  name={`correct-${question.id}`}
                  checked={question.correctOptionId === option.id}
                  onChange={() => onChange({ ...question, correctOptionId: option.id })}
                  aria-label={`Mark option ${optionLetter(optionIndex)} correct`}
                  className="size-4 accent-[var(--sparkle)]"
                />
                <span className="font-pixel text-[9px] leading-relaxed">{optionLetter(optionIndex)}</span>
              </label>
              <Y2kInput
                value={option.text}
                onChange={(event) => patchOption(option.id, event.target.value)}
                aria-label={`Option ${optionLetter(optionIndex)} text`}
              />
              <button
                type="button"
                onClick={() => removeOption(option.id)}
                disabled={question.options.length <= QUESTION_MIN_OPTIONS}
                aria-label={`Delete option ${optionLetter(optionIndex)}`}
                className={cn(buttonClasses("ghost"), question.options.length <= QUESTION_MIN_OPTIONS && "pointer-events-none opacity-40")}
              >
                <Trash2 aria-hidden="true" className="size-3" />
              </button>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={addOption}
          disabled={question.options.length >= QUESTION_MAX_OPTIONS}
          className={cn(buttonClasses("secondary"), "mt-2", question.options.length >= QUESTION_MAX_OPTIONS && "pointer-events-none opacity-40")}
        >
          <Plus aria-hidden="true" className="size-3" /> ADD OPTION
        </button>
      </fieldset>
    </div>
  );
}

/**
 * The Quest question builder: ordered, reorderable question cards with 2–6
 * options each. Save is blocked by `validateQuestionSet` errors (rendered by
 * the caller); PREVIEW QUEST renders the read-only session shape.
 */
export function QuestionBuilder({
  questions,
  onChange,
}: Readonly<{ questions: readonly AdminQuestion[]; onChange: (next: AdminQuestion[]) => void }>) {
  const [previewOpen, setPreviewOpen] = useState(false);
  const errors = useMemo(() => validateQuestionSet(questions), [questions]);

  const replace = (index: number, next: AdminQuestion) => onChange(questions.map((question, i) => (i === index ? next : question)));
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= questions.length) return;
    const next = [...questions];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item!);
    onChange(next);
  };

  const newQuestion = (): AdminQuestion => {
    const first = { id: newId("opt"), text: "" };
    const second = { id: newId("opt"), text: "" };
    return { id: newId("q"), prompt: "", options: [first, second], correctOptionId: first.id };
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          Questions ({questions.length})
        </span>
        <Y2kButton variant="secondary" onClick={() => setPreviewOpen(true)} disabled={questions.length === 0}>
          PREVIEW QUEST
        </Y2kButton>
      </div>

      {questions.length === 0 ? (
        <p className="border-2 border-dashed border-border p-4 text-center font-body text-sm font-bold text-muted-foreground">
          No questions yet — add the first one.
        </p>
      ) : (
        <ol className="flex flex-col gap-3">
          {questions.map((question, index) => (
            <li key={question.id}>
              <QuestionCard
                question={question}
                index={index}
                total={questions.length}
                onChange={(next) => replace(index, next)}
                onMove={(direction) => move(index, direction)}
                onDelete={() => onChange(questions.filter((_, i) => i !== index))}
              />
            </li>
          ))}
        </ol>
      )}

      <Y2kButton variant="secondary" onClick={() => onChange([...questions, newQuestion()])}>
        <Plus aria-hidden="true" className="size-3" /> ADD QUESTION
      </Y2kButton>

      {errors.length > 0 && (
        <ul role="alert" className="flex flex-col gap-1 border-2 border-border bg-btn-danger/15 p-3">
          {errors.map((error) => (
            <li key={error} className="font-body text-xs font-bold text-foreground">
              {error}
            </li>
          ))}
        </ul>
      )}

      <Y2kDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title="QUEST_PREVIEW.EXE"
        className="max-w-xl"
        actions={
          <Y2kButton variant="secondary" onClick={() => setPreviewOpen(false)}>
            CLOSE
          </Y2kButton>
        }
      >
        <Window title="QUIZ" controls={false} className="w-full">
          <ol className="flex flex-col gap-4">
            {questions.map((question, index) => (
              <li key={question.id}>
                <p className="font-pixel text-[9px] leading-relaxed">
                  Question {index + 1} of {questions.length}
                </p>
                <p className="mt-1 font-body text-sm font-bold">{question.prompt || "(empty prompt)"}</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {question.options.map((option, optionIndex) => (
                    <li
                      key={option.id}
                      className="flex items-center gap-2 border-2 border-border px-2 py-1 font-body text-[13px] font-bold"
                    >
                      <span className="font-pixel text-[9px]">{optionLetter(optionIndex)}</span>
                      {option.text || "(empty option)"}
                      {option.id === question.correctOptionId && (
                        <Check aria-label="Correct answer" className="ml-auto size-3 text-[#59D98F]" />
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Window>
      </Y2kDialog>
    </div>
  );
}
