import type { ClassValue } from "clsx";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
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

export type Crumb = { label: string; href?: string };

export function Breadcrumb({ items }: Readonly<{ items: Crumb[] }>) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden="true">›</span>}
          {item.href ? (
            <a
              href={item.href}
              className="font-pixel text-[9px] leading-relaxed text-foreground underline-offset-2 hover:underline"
            >
              {item.label}
            </a>
          ) : (
            <span className="font-pixel text-[9px] leading-relaxed text-foreground">
              {item.label}
            </span>
          )}
        </span>
      ))}
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
  className,
  children,
  ...props
}: Readonly<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: Y2kButtonVariant;
  }
>) {
  return (
    <button className={cn(buttonClasses(variant), className)} {...props}>
      {children}
    </button>
  );
}

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
  "w-full border-2 border-border bg-white px-2.5 py-1.5 font-body text-[13px] font-bold text-foreground shadow-[2px_2px_0_var(--border)] outline-none focus:shadow-[2px_2px_0_var(--sparkle)] rounded-none disabled:opacity-60";

export function Y2kInput({
  className,
  ...props
}: Readonly<React.InputHTMLAttributes<HTMLInputElement>>) {
  return <input className={cn(inputClasses, className)} {...props} />;
}

export function Y2kTextarea({
  className,
  ...props
}: Readonly<React.TextareaHTMLAttributes<HTMLTextAreaElement>>) {
  return (
    <textarea
      className={cn(inputClasses, "min-h-20 font-mono text-base leading-snug", className)}
      {...props}
    />
  );
}

export function Y2kSelect({
  className,
  children,
  ...props
}: Readonly<React.SelectHTMLAttributes<HTMLSelectElement>>) {
  return (
    <select className={cn(inputClasses, "appearance-none", className)} {...props}>
      {children}
    </select>
  );
}

/* ── Progress bar ───────────────────────────────────────────── */

export function Progress({
  value,
  max = 100,
  label,
  className,
  march = true,
}: Readonly<{
  value: number;
  max?: number;
  label?: string;
  className?: ClassValue;
  march?: boolean;
}>) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <progress
      value={value}
      max={max}
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

export type StageStatus = "locked" | "unlocked" | "completed";
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
        const state = i === current ? "current" : answered.has(i) ? "answered" : "unanswered";
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

export function Th({
  children,
  sorted,
  ...props
}: Readonly<React.ThHTMLAttributes<HTMLTableCellElement> & { sorted?: "asc" | "desc" | false }>) {
  return (
    <th
      className="border-b-2 border-border bg-title-bar px-3 py-2 text-left font-pixel text-[9px] leading-relaxed whitespace-nowrap"
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
    <td className={cn("border-b border-border/40 px-3 py-2 font-body text-[13px] font-bold", className)} {...props}>
      {children}
    </td>
  );
}

/* ── Pager ──────────────────────────────────────────────────── */

export function Pager({
  page,
  totalPages,
  hrefFor,
}: Readonly<{ page: number; totalPages: number; hrefFor: (page: number) => string }>) {
  const label = `Page ${page} of ${totalPages}`;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-3">
      {page > 1 ? (
        <a href={hrefFor(page - 1)} className={buttonClasses("secondary")}>
          <ChevronLeft aria-hidden="true" className="size-3" /> Previous
        </a>
      ) : (
        <span className={cn(buttonClasses("secondary"), "opacity-40 pointer-events-none")}>
          <ChevronLeft aria-hidden="true" className="size-3" /> Previous
        </span>
      )}
      <span role="status" className="font-pixel text-[9px] leading-relaxed">
        {label}
      </span>
      {page < totalPages ? (
        <a href={hrefFor(page + 1)} className={buttonClasses("secondary")}>
          Next <ChevronRight aria-hidden="true" className="size-3" />
        </a>
      ) : (
        <span className={cn(buttonClasses("secondary"), "opacity-40 pointer-events-none")}>
          Next <ChevronRight aria-hidden="true" className="size-3" />
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
    <svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

export function SkeletonWindow({
  title = "Loading…",
  label = "Loading",
}: Readonly<{ title?: string; label?: string }>) {
  return (
    <Window title={title}>
      <div role="status" aria-label={label} className="flex flex-col gap-3 py-4">
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
      </div>
    </Window>
  );
}

/* ── Desktop icon ───────────────────────────────────────────── */

export function DesktopIcon({
  icon,
  label,
  href,
  className,
}: Readonly<{
  icon: ReactNode;
  label: string;
  href?: string;
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
  return href ? (
    <a href={href} className={cn("flex w-16 flex-col items-center gap-1", className)}>
      {content}
    </a>
  ) : (
    <span className={cn("flex w-16 flex-col items-center gap-1", className)}>{content}</span>
  );
}

/* ── Badge tile / Character card ────────────────────────────── */

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
