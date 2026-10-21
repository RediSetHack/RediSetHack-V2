import type { ClassValue } from "clsx";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Lock,
  Minus,
  Star,
  Trophy,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { formatXp } from "@/lib/format";

/* ── Window ─────────────────────────────────────────────────── */

export function WindowControls() {
  return (
    <span aria-hidden="true" className="flex items-center gap-1">
      <span className="block size-3 border border-border bg-[#FF5B5B]" />
      <span className="block size-3 border border-border bg-[#FFD84D]" />
      <span className="block size-3 border border-border bg-[#59D98F]" />
    </span>
  );
}

export function Window({
  title,
  actions,
  children,
  className,
  bodyClassName,
  controls = true,
}: Readonly<{
  title: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: ClassValue;
  bodyClassName?: ClassValue;
  controls?: boolean;
}>) {
  return (
    <section
      className={cn(
        "y2k-window border-2 border-border bg-window-body shadow-[4px_4px_0_var(--border)]",
        className,
      )}
    >
      <header className="y2k-scanline flex min-h-8 items-center justify-between gap-2 border-b-2 border-border bg-title-bar px-2 py-1">
        <div className="relative z-10 flex min-w-0 items-center gap-2 font-pixel text-[9px] leading-relaxed text-foreground">
          {title}
        </div>
        <div className="relative z-10 flex items-center gap-2">
          {actions}
          {controls && <WindowControls />}
        </div>
      </header>
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/* ── Breadcrumb (title-bar segments) ────────────────────────── */

export type Crumb = { label: string; href?: string; onClick?: () => void };

export function Breadcrumb({ items }: Readonly<{ items: Crumb[] }>) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">›</span>}
            {item.href ? (
              <a
                href={item.href}
                aria-current={isLast ? "page" : undefined}
                className="font-pixel text-[9px] leading-relaxed text-foreground underline-offset-2 hover:underline"
              >
                {item.label}
              </a>
            ) : item.onClick ? (
              <button
                type="button"
                onClick={item.onClick}
                aria-current={isLast ? "page" : undefined}
                className="font-pixel text-[9px] leading-relaxed text-foreground underline-offset-2 hover:underline cursor-pointer"
              >
                {item.label}
              </button>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className="font-pixel text-[9px] leading-relaxed text-foreground"
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/* ── Button ─────────────────────────────────────────────────── */

export type Y2kButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function buttonClasses(variant: Y2kButtonVariant = "primary") {
  return cn(
    "inline-flex items-center justify-center gap-2 border-2 border-border px-4 py-2 font-pixel text-[9px] leading-relaxed text-foreground select-none",
    "transition-[transform,box-shadow] duration-[80ms] linear",
    "disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" &&
      "bg-primary shadow-[3px_3px_0_var(--border)] hover:brightness-105 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    variant === "secondary" &&
      "bg-window-body shadow-[3px_3px_0_var(--border)] hover:brightness-105 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    variant === "danger" &&
      "bg-btn-danger text-white shadow-[3px_3px_0_var(--border)] hover:brightness-105 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
    variant === "ghost" &&
      "border-transparent bg-transparent shadow-none hover:bg-accent/40",
  );
}

export function Y2kButton({
  variant = "primary",
  type = "button",
  className,
  children,
  ...props
}: Readonly<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Y2kButtonVariant;
  }
>) {
  return (
    <button type={type} className={cn(buttonClasses(variant), className)} {...props}>
      {children}
    </button>
  );
}

export const Button = Y2kButton;

/* ── Form fields ────────────────────────────────────────────── */

export function FieldLabel({
  htmlFor,
  children,
  required,
}: Readonly<{
  htmlFor: string;
  children: ReactNode;
  required?: boolean;
}>) {
  return (
    <label
      htmlFor={htmlFor}
      className="block font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
    >
      {children}
      {required && (
        <span aria-hidden="true" className="text-btn-danger">
          {" "}
          *
        </span>
      )}
    </label>
  );
}

export function FieldError({
  id,
  children,
}: Readonly<{ id: string; children: ReactNode }>) {
  if (!children) return null;
  return (
    <p id={id} role="alert" className="font-body text-xs font-bold text-btn-danger">
      {children}
    </p>
  );
}

export const inputClasses =
  "w-full border-2 border-border bg-white px-2.5 py-1.5 font-body text-[13px] font-bold text-foreground shadow-[2px_2px_0_var(--border)] outline-none focus:shadow-[2px_2px_0_var(--sparkle)] focus:border-border rounded-none disabled:opacity-60";

export interface Y2kInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
  error?: ReactNode;
  errorId?: string;
}

export function Y2kInput({
  className,
  invalid,
  error,
  errorId,
  id,
  ...props
}: Readonly<Y2kInputProps>) {
  const isInvalid = Boolean(invalid || error || props["aria-invalid"]);
  const resolvedErrorId = errorId ?? (id ? `${id}-error` : undefined);
  const describedBy = isInvalid ? (resolvedErrorId ?? props["aria-describedby"]) : props["aria-describedby"];

  const inputElement = (
    <input
      id={id}
      aria-invalid={isInvalid ? true : undefined}
      aria-describedby={describedBy}
      className={cn(inputClasses, isInvalid && "border-btn-danger", className)}
      {...props}
    />
  );

  if (error && typeof error === "string") {
    return (
      <div className="flex w-full flex-col gap-1">
        {inputElement}
        <FieldError id={resolvedErrorId ?? "input-error"}>{error}</FieldError>
      </div>
    );
  }

  return inputElement;
}

export const Input = Y2kInput;

export interface Y2kTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  monospace?: boolean;
  invalid?: boolean;
  error?: ReactNode;
  errorId?: string;
}

export function Y2kTextarea({
  className,
  monospace = true,
  invalid,
  error,
  errorId,
  id,
  ...props
}: Readonly<Y2kTextareaProps>) {
  const isInvalid = Boolean(invalid || error || props["aria-invalid"]);
  const resolvedErrorId = errorId ?? (id ? `${id}-error` : undefined);
  const describedBy = isInvalid ? (resolvedErrorId ?? props["aria-describedby"]) : props["aria-describedby"];

  const textareaElement = (
    <textarea
      id={id}
      aria-invalid={isInvalid ? true : undefined}
      aria-describedby={describedBy}
      className={cn(
        inputClasses,
        "min-h-20 leading-snug",
        monospace ? "font-mono text-sm" : "font-body text-[13px] font-bold",
        isInvalid && "border-btn-danger",
        className,
      )}
      {...props}
    />
  );

  if (error && typeof error === "string") {
    return (
      <div className="flex w-full flex-col gap-1">
        {textareaElement}
        <FieldError id={resolvedErrorId ?? "textarea-error"}>{error}</FieldError>
      </div>
    );
  }

  return textareaElement;
}

export const Textarea = Y2kTextarea;

export interface Y2kSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
  error?: ReactNode;
  errorId?: string;
}

export function Y2kSelect({
  className,
  children,
  invalid,
  error,
  errorId,
  id,
  ...props
}: Readonly<Y2kSelectProps>) {
  const isInvalid = Boolean(invalid || error || props["aria-invalid"]);
  const resolvedErrorId = errorId ?? (id ? `${id}-error` : undefined);
  const describedBy = isInvalid ? (resolvedErrorId ?? props["aria-describedby"]) : props["aria-describedby"];

  const selectElement = (
    <div className="relative w-full">
      <select
        id={id}
        aria-invalid={isInvalid ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          inputClasses,
          "appearance-none pr-8 cursor-pointer",
          isInvalid && "border-btn-danger",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 text-foreground"
      />
    </div>
  );

  if (error && typeof error === "string") {
    return (
      <div className="flex w-full flex-col gap-1">
        {selectElement}
        <FieldError id={resolvedErrorId ?? "select-error"}>{error}</FieldError>
      </div>
    );
  }

  return selectElement;
}

export const Select = Y2kSelect;

export interface Y2kCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: ReactNode;
  invalid?: boolean;
  error?: ReactNode;
  errorId?: string;
}

export function Y2kCheckbox({
  id,
  label,
  checked,
  defaultChecked,
  invalid,
  error,
  errorId,
  className,
  disabled,
  ...props
}: Readonly<Y2kCheckboxProps>) {
  const isInvalid = Boolean(invalid || error || props["aria-invalid"]);
  const resolvedErrorId = errorId ?? (id ? `${id}-error` : undefined);
  const describedBy = isInvalid ? (resolvedErrorId ?? props["aria-describedby"]) : props["aria-describedby"];
  const isChecked = checked ?? defaultChecked;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={id}
        className={cn(
          "inline-flex cursor-pointer select-none items-center gap-2 font-body text-sm font-bold text-foreground",
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <span className="relative flex items-center justify-center">
          <input
            type="checkbox"
            id={id}
            checked={checked}
            defaultChecked={defaultChecked}
            disabled={disabled}
            aria-invalid={isInvalid ? true : undefined}
            aria-describedby={describedBy}
            className="peer sr-only"
            {...props}
          />
          <span
            aria-hidden="true"
            className={cn(
              "flex size-5 items-center justify-center border-2 border-border bg-white shadow-[2px_2px_0_var(--border)] transition-[box-shadow,background-color] duration-[80ms]",
              "peer-focus-visible:shadow-[2px_2px_0_var(--sparkle)] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-sparkle",
              isChecked ? "bg-primary text-foreground" : "text-transparent",
              isInvalid && "border-btn-danger",
            )}
          >
            <Check className={cn("size-3.5 stroke-[3]", isChecked ? "block" : "hidden peer-checked:block")} />
          </span>
        </span>
        {label && <span>{label}</span>}
      </label>
      {error && typeof error === "string" && (
        <FieldError id={resolvedErrorId ?? "checkbox-error"}>{error}</FieldError>
      )}
    </div>
  );
}

export const Checkbox = Y2kCheckbox;

/* ── Radio-card group ───────────────────────────────────────── */

export type RadioCardOption = {
  value: string;
  label: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  badge?: ReactNode;
};

export interface RadioCardGroupProps {
  name: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: readonly RadioCardOption[];
  className?: ClassValue;
  disabled?: boolean;
}

export function RadioCardGroup({
  name,
  label,
  value,
  defaultValue,
  onChange,
  options,
  className,
  disabled = false,
}: Readonly<RadioCardGroupProps>) {
  return (
    <fieldset
      role="radiogroup"
      aria-label={label}
      className={cn("flex flex-col gap-2 border-0 p-0 m-0", className)}
    >
      {label && (
        <legend className="font-body text-[11px] font-semibold tracking-wide text-muted-foreground uppercase mb-1">
          {label}
        </legend>
      )}
      <div className="grid gap-2">
        {options.map((option, idx) => {
          const isChecked = (value ?? defaultValue) === option.value;
          const isDisabled = disabled || option.disabled;
          return (
            <label
              key={option.value}
              className={cn(
                "group relative flex cursor-pointer select-none items-start gap-3 border-2 border-border p-3 transition-[filter,box-shadow,transform] duration-[80ms]",
                isChecked
                  ? "bg-window-body border-accent shadow-[3px_3px_0_var(--accent)]"
                  : "bg-white shadow-[3px_3px_0_var(--border)] hover:brightness-[1.03]",
                isDisabled && "pointer-events-none opacity-50",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={value !== undefined ? isChecked : undefined}
                defaultChecked={defaultValue !== undefined ? defaultValue === option.value : undefined}
                disabled={isDisabled}
                onChange={() => onChange?.(option.value)}
                className="sr-only peer"
              />
              <span
                aria-hidden="true"
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center border-2 border-border font-pixel text-[9px]",
                  isChecked ? "bg-accent text-foreground" : "bg-title-bar text-foreground",
                )}
              >
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-body text-sm font-bold text-foreground">
                    {option.label}
                  </span>
                  {option.badge}
                </div>
                {option.description && (
                  <p className="mt-0.5 font-body text-xs font-semibold text-muted-foreground">
                    {option.description}
                  </p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ── Progress bar ───────────────────────────────────────────── */

type ProgressBaseProps = {
  label?: string;
  className?: ClassValue;
  march?: boolean;
};

type DeterminateProgressProps = ProgressBaseProps & {
  indeterminate?: false;
  value: number;
  max?: number;
};

type IndeterminateProgressProps = ProgressBaseProps & {
  indeterminate: true;
  value?: never;
  max?: never;
};

export function Progress(
  props: DeterminateProgressProps | IndeterminateProgressProps,
) {
  const { label, className } = props;

  if (props.indeterminate) {
    return (
      <div
        role="progressbar"
        aria-label={label}
        aria-valuetext="Working…"
        className={cn(
          "y2k-progress-indeterminate h-[18px] w-full border-2 border-border bg-white shadow-[2px_2px_0_var(--border)]",
          className,
        )}
      />
    );
  }

  const { value, max = 100, march = true } = props;
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <progress
      role="progressbar"
      value={value}
      max={max}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={cn(
        "y2k-progress h-[18px] w-full border-2 border-border bg-white shadow-[2px_2px_0_var(--border)]",
        march && pct < 100 && "y2k-march",
        className,
      )}
    />
  );
}

/* ── Status / XP chips ──────────────────────────────────────── */

export type StageStatus = "locked" | "unlocked" | "available" | "completed";
export type QuestOutcome = "passed" | "not-passed" | "not-taken";
export type ChipStatus = StageStatus | QuestOutcome | "solved" | "bonus" | "normal";

const CHIP_STYLES: Record<
  ChipStatus,
  { label: string; className: string; icon: ReactNode }
> = {
  locked: {
    label: "Locked",
    className: "bg-muted text-muted-foreground",
    icon: <Lock aria-hidden="true" className="size-3" />,
  },
  unlocked: {
    label: "Unlocked",
    className: "bg-primary text-foreground",
    icon: <Star aria-hidden="true" className="size-3" />,
  },
  available: {
    label: "Unlocked",
    className: "bg-primary text-foreground",
    icon: <Star aria-hidden="true" className="size-3" />,
  },
  completed: {
    label: "Completed",
    className: "bg-[#59D98F] text-foreground",
    icon: <Check aria-hidden="true" className="size-3" />,
  },
  passed: {
    label: "Passed",
    className: "bg-[#59D98F] text-foreground",
    icon: <Check aria-hidden="true" className="size-3" />,
  },
  "not-passed": {
    label: "Not passed",
    className: "bg-btn-danger text-white",
    icon: <X aria-hidden="true" className="size-3" />,
  },
  "not-taken": {
    label: "Not taken",
    className: "bg-muted text-muted-foreground",
    icon: <Minus aria-hidden="true" className="size-3" />,
  },
  solved: {
    label: "Solved",
    className: "bg-[#59D98F] text-foreground",
    icon: <Check aria-hidden="true" className="size-3" />,
  },
  bonus: {
    label: "Bonus",
    className: "bg-sparkle text-white",
    icon: <Star aria-hidden="true" className="size-3" />,
  },
  normal: {
    label: "Normal",
    className: "bg-muted text-muted-foreground",
    icon: <Minus aria-hidden="true" className="size-3" />,
  },
};

export function StatusChip({
  status,
  label,
  className,
}: Readonly<{
  status: ChipStatus;
  label?: string;
  className?: ClassValue;
}>) {
  const chip = CHIP_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border-2 border-border px-2 py-0.5 font-body text-[11px] font-semibold tracking-wide uppercase",
        chip.className,
        className,
      )}
    >
      {chip.icon}
      {label ?? chip.label}
    </span>
  );
}

export function XPChip({
  xp,
  className,
}: Readonly<{ xp: number; className?: ClassValue }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 border-2 border-border bg-accent px-2 py-0.5 font-pixel-lg text-lg leading-none text-foreground",
        className,
      )}
    >
      {formatXp(xp)}
    </span>
  );
}

/* ── Segmented question tracker ─────────────────────────────── */

export function SegmentedTracker({
  total,
  current,
  answered,
  onSelect,
}: Readonly<{
  total: number;
  current: number;
  answered: ReadonlySet<number>;
  onSelect?: (index: number) => void;
}>) {
  return (
    <ol aria-label="Question tracker" className="flex flex-wrap gap-1">
      {Array.from({ length: total }, (_, i) => {
        let state: "current" | "answered" | "unanswered";
        if (i === current) state = "current";
        else if (answered.has(i)) state = "answered";
        else state = "unanswered";
        return (
          <li key={i}>
            <button
              type="button"
              disabled={!onSelect}
              onClick={() => onSelect?.(i)}
              aria-current={i === current ? "step" : undefined}
              aria-label={`Question ${i + 1}: ${state}`}
              className={cn(
                "flex size-7 items-center justify-center border-2 border-border font-pixel text-[8px]",
                state === "answered" && "bg-primary text-foreground",
                state === "current" && "bg-window-body text-foreground outline outline-2 outline-sparkle",
                state === "unanswered" && "bg-white text-muted-foreground",
              )}
            >
              {i + 1}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Table shell ────────────────────────────────────────────── */

export function Table({ children, className }: Readonly<{ children: ReactNode; className?: ClassValue }>) {
  return (
    <div className="w-full overflow-x-auto border-2 border-border bg-window-body shadow-[2px_2px_0_var(--border)]">
      <table className={cn("w-full border-collapse text-sm", className)}>{children}</table>
    </div>
  );
}

export function Thead({ children, className }: Readonly<{ children: ReactNode; className?: ClassValue }>) {
  return <thead className={cn("bg-title-bar", className)}>{children}</thead>;
}

export function Tbody({ children, className }: Readonly<{ children: ReactNode; className?: ClassValue }>) {
  return <tbody className={cn("divide-y divide-border/30", className)}>{children}</tbody>;
}

export function Tr({ children, className, ...props }: Readonly<React.HTMLAttributes<HTMLTableRowElement>>) {
  return (
    <tr
      className={cn("hover:bg-accent/10 transition-colors duration-[80ms]", className)}
      {...props}
    >
      {children}
    </tr>
  );
}

export function Th({
  children,
  sorted,
  className,
  ...props
}: Readonly<React.ThHTMLAttributes<HTMLTableCellElement> & { sorted?: "asc" | "desc" | false }>) {
  return (
    <th
      className={cn(
        "border-b-2 border-border bg-title-bar px-3 py-2 text-left font-pixel text-[9px] leading-relaxed whitespace-nowrap text-foreground",
        className,
      )}
      {...props}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        {sorted === "asc" && <span aria-hidden="true">▲</span>}
        {sorted === "desc" && <span aria-hidden="true">▼</span>}
      </span>
    </th>
  );
}

export function Td({ children, className, ...props }: Readonly<React.TdHTMLAttributes<HTMLTableCellElement>>) {
  return (
    <td className={cn("border-b border-border/40 px-3 py-2 font-body text-[13px] font-bold text-foreground", className)} {...props}>
      {children}
    </td>
  );
}

/* ── Pager ──────────────────────────────────────────────────── */

export function Pager({
  page,
  totalPages,
  hrefFor,
  onPageChange,
}: Readonly<{
  page: number;
  totalPages: number;
  hrefFor?: (page: number) => string;
  onPageChange?: (page: number) => void;
}>) {
  const label = `Page ${page} of ${totalPages}`;
  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  const prevContent = (
    <>
      <ChevronLeft aria-hidden="true" className="size-3" /> Previous
    </>
  );

  const nextContent = (
    <>
      Next <ChevronRight aria-hidden="true" className="size-3" />
    </>
  );

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
      {onPageChange ? (
        <button
          type="button"
          disabled={isFirst}
          onClick={() => onPageChange(page - 1)}
          className={cn(
            buttonClasses("secondary"),
            isFirst && "opacity-40 pointer-events-none",
          )}
        >
          {prevContent}
        </button>
      ) : !isFirst && hrefFor ? (
        <a href={hrefFor(page - 1)} className={buttonClasses("secondary")}>
          {prevContent}
        </a>
      ) : (
        <span
          aria-disabled="true"
          className={cn(buttonClasses("secondary"), "opacity-40 pointer-events-none")}
        >
          {prevContent}
        </span>
      )}

      <output className="font-pixel text-[9px] leading-relaxed">
        {label}
      </output>

      {onPageChange ? (
        <button
          type="button"
          disabled={isLast}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            buttonClasses("secondary"),
            isLast && "opacity-40 pointer-events-none",
          )}
        >
          {nextContent}
        </button>
      ) : !isLast && hrefFor ? (
        <a href={hrefFor(page + 1)} className={buttonClasses("secondary")}>
          {nextContent}
        </a>
      ) : (
        <span
          aria-disabled="true"
          className={cn(buttonClasses("secondary"), "opacity-40 pointer-events-none")}
        >
          {nextContent}
        </span>
      )}
    </nav>
  );
}

/* ── Empty / loading states ─────────────────────────────────── */

export function EmptyState({
  title,
  message,
  action,
  icon,
}: Readonly<{
  title: string;
  message?: string;
  action?: ReactNode;
  icon?: ReactNode;
}>) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <span aria-hidden="true" className="text-muted-foreground">
        {icon ?? <MonitorIcon />}
      </span>
      <p className="font-pixel text-[11px] leading-relaxed text-foreground">{title}</p>
      {message && (
        <p className="max-w-md font-body text-sm font-bold text-muted-foreground">{message}</p>
      )}
      {action}
    </div>
  );
}

function MonitorIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function SkeletonWindow({
  title = "Loading…",
  label = "Loading",
  className,
  children,
}: Readonly<{
  title?: string;
  label?: string;
  className?: ClassValue;
  children?: ReactNode;
}>) {
  return (
    <Window title={title} className={className}>
      <output aria-busy="true" aria-label={label} className="flex flex-col gap-3 py-4">
        {children ?? (
          <>
            <div className="h-[18px] w-full border-2 border-border bg-white shadow-[2px_2px_0_var(--border)]">
              <div
                className="y2k-march h-full"
                style={{
                  width: "40%",
                  backgroundImage:
                    "repeating-linear-gradient(45deg, var(--primary) 0px, var(--primary) 8px, var(--border) 8px, var(--border) 10px)",
                  backgroundSize: "14px 14px",
                }}
              />
            </div>
            <p className="font-pixel-lg text-xl text-muted-foreground">{label}…</p>
          </>
        )}
      </output>
    </Window>
  );
}

/* ── Desktop icon ───────────────────────────────────────────── */

export function DesktopIcon({
  icon,
  label,
  href,
  onClick,
  className,
}: Readonly<{
  icon: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  className?: ClassValue;
}>) {
  const content = (
    <>
      <span aria-hidden="true" className="y2k-icon flex size-8 items-center justify-center border-2 border-border bg-window-body shadow-[2px_2px_0_var(--border)]">
        {icon}
      </span>
      <span className="max-w-16 text-center font-body text-[11px] font-semibold text-foreground">
        {label}
      </span>
    </>
  );
  if (href) {
    return (
      <a href={href} className={cn("flex w-16 flex-col items-center gap-1", className)}>
        {content}
      </a>
    );
  }
  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn("flex w-16 flex-col items-center gap-1 cursor-pointer", className)}
      >
        {content}
      </button>
    );
  }
  return (
    <span className={cn("flex w-16 flex-col items-center gap-1", className)}>{content}</span>
  );
}

/* ── Badge tile / Character card / Stage node ──────────────── */

export function AvatarOrInitial({
  src,
  name,
  className,
}: Readonly<{ src?: string | null; name: string; className?: ClassValue }>) {
  if (src) {
    /* eslint-disable-next-line @next/next/no-img-element -- admin-controlled image hosts; remote patterns unknown */
    return <img src={src} alt="" className={cn("border-2 border-border bg-white object-cover", className)} />;
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "y2k-checker flex items-center justify-center border-2 border-border font-pixel text-sm text-foreground",
        className,
      )}
    >
      <span className="border-2 border-border bg-title-bar px-2 py-1">{name.charAt(0).toUpperCase()}</span>
    </span>
  );
}

export function BadgeTile({
  name,
  description,
  imageUrl,
  earnedCount,
}: Readonly<{
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  earnedCount: number;
}>) {
  return (
    <li
      title={description ?? undefined}
      className="flex items-start gap-3 border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]"
    >
      <AvatarOrInitial src={imageUrl} name={name} className="size-12 shrink-0" />
      <div className="min-w-0">
        <p className="font-pixel text-[9px] leading-relaxed text-foreground">{name}</p>
        {description && (
          <p className="mt-1 font-body text-xs font-bold text-muted-foreground">{description}</p>
        )}
        <p className="mt-1 font-pixel-lg text-lg leading-none text-foreground">
          Earned ×{earnedCount}
        </p>
      </div>
    </li>
  );
}

export function CharacterCard({
  name,
  description,
  imageUrl,
  selected = false,
  active = false,
  disabled = false,
  onClick,
  className,
  actionLabel,
}: Readonly<{
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  selected?: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: ClassValue;
  actionLabel?: string;
}>) {
  const isSelected = selected || active;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "group relative flex flex-col gap-2 border-2 border-border bg-window-body p-3 text-left shadow-[3px_3px_0_var(--border)]",
        "transition-[transform,box-shadow] duration-[80ms] linear hover:brightness-105 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none",
        isSelected && "border-accent outline outline-2 outline-accent shadow-[3px_3px_0_var(--accent)]",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <AvatarOrInitial src={imageUrl} name={name} className="size-10" />
        {isSelected && <PixelHeart size={16} />}
      </div>
      <div className="flex flex-col gap-1">
        <p className="font-pixel text-[9px] leading-relaxed text-foreground">{name}</p>
        {description && (
          <p className="font-body text-xs font-bold text-muted-foreground">{description}</p>
        )}
      </div>
      <span className={cn(buttonClasses(isSelected ? "primary" : "secondary"), "w-full pointer-events-none")}>
        {actionLabel ?? (isSelected ? "Selected" : "Choose Avatar")}
      </span>
    </button>
  );
}

export function StageNode({
  stageNumber,
  title,
  xpReward,
  status = "locked",
  href,
  onClick,
  className,
}: Readonly<{
  stageNumber: number;
  title: string;
  xpReward: number;
  status: StageStatus;
  href?: string;
  onClick?: () => void;
  className?: ClassValue;
}>) {
  const isLocked = status === "locked";
  const isCompleted = status === "completed";

  if (isLocked) {
    return (
      <div
        aria-disabled="true"
        title="Locked — finish the previous Stage first."
        className={cn(
          "flex items-center gap-3 border-2 border-border bg-muted/60 p-3 opacity-70 shadow-[2px_2px_0_var(--border)]",
          className,
        )}
      >
        <span className="sr-only">Locked — finish the previous Stage first.</span>
        <div className="flex size-8 shrink-0 items-center justify-center border-2 border-border bg-window-body font-pixel text-[10px]">
          {stageNumber}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-pixel text-[9px] leading-relaxed text-foreground">{title}</span>
            <XPChip xp={xpReward} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusChip status="locked" />
          <Lock aria-hidden="true" className="size-4 text-muted-foreground" />
        </div>
      </div>
    );
  }

  const content = (
    <>
      <div className="flex size-8 shrink-0 items-center justify-center border-2 border-border bg-title-bar font-pixel text-[10px]">
        {stageNumber}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-pixel text-[9px] leading-relaxed text-foreground">{title}</span>
          <XPChip xp={xpReward} />
        </div>
      </div>
      <StatusChip status={isCompleted ? "completed" : "unlocked"} />
    </>
  );

  const nodeClasses = cn(
    "flex w-full items-center gap-3 border-2 border-border bg-window-body p-3 shadow-[4px_4px_0_var(--border)]",
    "transition-[transform,box-shadow] duration-[80ms] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--border)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none",
    className,
  );

  if (href) {
    return (
      <a
        href={href}
        aria-label={`${title}, ${isCompleted ? "Completed" : "Unlocked"}, ${xpReward} XP`}
        className={nodeClasses}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${title}, ${isCompleted ? "Completed" : "Unlocked"}, ${xpReward} XP`}
      className={nodeClasses}
    >
      {content}
    </button>
  );
}

/* ── Toast ──────────────────────────────────────────────────── */

export type ToastVariant = "success" | "error" | "info";

export function Toast({
  message,
  variant = "success",
  onClose,
  className,
}: Readonly<{
  message: ReactNode;
  variant?: ToastVariant;
  onClose?: () => void;
  className?: ClassValue;
}>) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "y2k-toast flex items-center justify-between gap-2 border-2 border-border px-3 py-2 font-body text-sm font-bold shadow-[4px_4px_0_var(--border)]",
        variant === "success" && "bg-[#59D98F] text-foreground",
        variant === "error" && "bg-btn-danger text-white",
        variant === "info" && "bg-title-bar text-foreground",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {variant === "success" && <Check aria-hidden="true" className="size-4 shrink-0" />}
        {variant === "error" && <X aria-hidden="true" className="size-4 shrink-0" />}
        {variant === "info" && <Info aria-hidden="true" className="size-4 shrink-0" />}
        <span>{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="ml-2 inline-flex size-4 items-center justify-center hover:opacity-80"
        >
          <X aria-hidden="true" className="size-3" />
        </button>
      )}
    </div>
  );
}

/* ── Decorations ────────────────────────────────────────────── */

export function Sparkle({ size = 20, className }: Readonly<{ size?: number; className?: ClassValue }>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={cn("y2k-sparkle text-sparkle", className)}
      fill="currentColor"
    >
      <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
    </svg>
  );
}

export function PixelHeart({ size = 16, className }: Readonly<{ size?: number; className?: ClassValue }>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 5 4"
      width={size}
      height={(size / 5) * 4}
      className={cn("text-sparkle", className)}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <path d="M1 0h1v1h1V0h1v1h1v1h-1v1h-1v1H2V3H1V2H0V1h1z" />
    </svg>
  );
}

export function PixelCloud({ size = 28, className }: Readonly<{ size?: number; className?: ClassValue }>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 7 4"
      width={size}
      height={(size / 7) * 4}
      className={cn("text-white/80", className)}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <path d="M2 0h3v1h1v2H1V1h1zM0 2h7v1H0z" />
    </svg>
  );
}

/**
 * Pixel-art trophy on a 10x9 grid: rim, tapering cup, stem and base. The dark
 * copy behind the gold one is a 1px pixel shadow, so the cup keeps its edge on
 * the cream window body.
 */
const PIXEL_TROPHY_PATH =
  "M3 0h6v1H3zM2 1h8v2H2zM3 3h6v1H3zM4 4h4v1H4zM5 5h2v2H5zM3 7h6v1H3zM2 8h8v1H2z";

export function PixelTrophy({
  size = 28,
  className,
}: Readonly<{ size?: number; className?: ClassValue }>) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 11 10"
      width={size}
      height={(size / 11) * 10}
      className={cn("text-primary", className)}
      fill="currentColor"
      shapeRendering="crispEdges"
    >
      <path
        d={PIXEL_TROPHY_PATH}
        transform="translate(1 1)"
        style={{ fill: "var(--border)" }}
      />
      <path d={PIXEL_TROPHY_PATH} />
    </svg>
  );
}

export function Decorations() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <Sparkle size={22} className="absolute top-16 left-[8%]" />
      <Sparkle size={14} className="absolute top-40 right-[12%]" />
      <Sparkle size={28} className="absolute bottom-24 left-[22%]" />
      <Sparkle size={16} className="absolute right-[30%] bottom-40" />
      <PixelCloud size={36} className="absolute top-24 right-[6%]" />
      <PixelCloud size={28} className="absolute bottom-16 left-[4%]" />
      <PixelHeart size={18} className="absolute top-1/2 right-[8%]" />
    </div>
  );
}

/* ── Misc helpers ───────────────────────────────────────────── */

export function ClockDisplay({ label = "Time remaining" }: Readonly<{ label?: string }>) {
  return (
    <span className="inline-flex items-center gap-1 font-pixel text-[9px] leading-relaxed">
      <Clock aria-hidden="true" className="size-4" />
      <span className="sr-only">{label}:</span>
    </span>
  );
}

export function TrophyIcon({ className }: Readonly<{ className?: ClassValue }>) {
  return <Trophy aria-hidden="true" className={cn("text-primary", className)} />;
}
