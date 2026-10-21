"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ShieldAlert } from "lucide-react";
import { FieldError, FieldLabel, Window, buttonClasses, SkeletonWindow } from "@/components/y2k";
import { AdminPageTitle } from "@/components/admin/admin-access";

/**
 * One labeled admin form field: uppercased label, the control, then its
 * inline validation message.
 */
export function FormField({
  id,
  label,
  required,
  error,
  children,
  hint,
}: Readonly<{
  id: string;
  label: string;
  required?: boolean;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
}>) {
  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={id} required={required}>
        {label}
      </FieldLabel>
      {children}
      {hint}
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/**
 * The window every New/Edit page wraps its fields in. `entityName` publishes
 * the edited item's name, so the shell's breadcrumb can read
 * `ADMIN › Quests › Edit "Intro Quiz"`.
 */
export function FormShell({
  title,
  entityName,
  children,
}: Readonly<{ title: string; entityName?: string; children: ReactNode }>) {
  return (
    <Window title={title}>
      {entityName ? <AdminPageTitle title={entityName} /> : null}
      {children}
    </Window>
  );
}

export function FormActions({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="flex flex-wrap justify-end gap-3 border-t-2 border-border pt-4">{children}</div>;
}

/** Red alert window for a whole-form failure (unattributable API message). */
export function FormErrorAlert({ message }: Readonly<{ message: string }>) {
  return (
    <div role="alert" className="flex items-start gap-2 border-2 border-border bg-btn-danger/15 p-3">
      <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-btn-danger" />
      <p className="font-body text-sm font-bold text-foreground">{message}</p>
    </div>
  );
}

/** Edit-page load states: loading skeleton, not-found window, error window. */
export function EditLoadState({
  loading,
  notFound,
  error,
  resource,
  onRetry,
}: Readonly<{
  loading?: boolean;
  notFound?: boolean;
  error?: boolean;
  resource: string;
  onRetry?: () => void;
}>) {
  if (loading) return <SkeletonWindow title="Loading…" />;
  if (notFound) {
    return (
      <Window title="NOT_FOUND.EXE">
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <ShieldAlert aria-hidden="true" className="size-8 text-muted-foreground" />
          <p className="font-pixel text-[11px] leading-relaxed text-foreground">{resource} not found</p>
          <a href=".." className={buttonClasses("secondary")}>
            BACK TO LIST
          </a>
        </div>
      </Window>
    );
  }
  if (error) {
    return (
      <div role="alert" className="flex flex-col items-start gap-3 border-2 border-border bg-window-body p-4 shadow-[4px_4px_0_var(--border)]">
        <p className="flex items-center gap-2 font-pixel-lg text-lg leading-snug text-foreground">
          <AlertTriangle aria-hidden="true" className="size-5 shrink-0 text-btn-danger" />
          This {resource.toLowerCase()} could not be loaded. Try again.
        </p>
        {onRetry && (
          <button type="button" onClick={onRetry} className={buttonClasses("primary")}>
            Try again
          </button>
        )}
      </div>
    );
  }
  return null;
}

/** ADR-0005: deleting content may archive it instead, so the copy never says "cascade". */
export const DELETE_COPY =
  "If learners have progress, Results or XP on this content it will be archived and hidden from learners; otherwise it is deleted.";

/** The body of every admin delete confirmation. */
export function DeleteMessage({ name, cascadeWarning }: Readonly<{ name: string; cascadeWarning?: string }>) {
  return (
    <>
      <p>{`Delete ${name}? This cannot be undone.`}</p>
      {cascadeWarning && <p className="mt-2">{cascadeWarning}</p>}
      <p className="mt-2 text-sm text-muted-foreground">{DELETE_COPY}</p>
    </>
  );
}
