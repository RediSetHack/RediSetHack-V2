"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Dialog } from "@base-ui/react/dialog";
import { AlertTriangle, Check, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  SkeletonWindow,
  Toast,
  Window,
  Y2kButton,
  type Y2kButtonVariant,
} from "@/components/y2k";

/* ── Dialog / Alert ─────────────────────────────────────────── */

let toastCounter = 0;
const nextToastId = () => {
  toastCounter += 1;
  return toastCounter;
};

function DialogShell({
  title,
  children,
  className,
}: Readonly<{ title: string; children: React.ReactNode; className?: string }>) {
  return (
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/50" />
      <Dialog.Popup
        className={cn(
          "y2k-window fixed top-1/2 left-1/2 z-50 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 border-2 border-border bg-window-body shadow-[6px_6px_0_var(--border)]",
          className,
        )}
      >
        <header className="y2k-scanline flex min-h-8 items-center justify-between border-b-2 border-border bg-title-bar px-2 py-1">
          <Dialog.Title className="relative z-10 font-pixel text-[9px] leading-relaxed text-foreground">
            {title}
          </Dialog.Title>
          <Dialog.Close aria-label="Close" className="relative z-10">
            <span
              aria-hidden="true"
              className="block size-3 border border-border bg-[#FF5B5B]"
            />
          </Dialog.Close>
        </header>
        {children}
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

export function Y2kDialog({
  open,
  onOpenChange,
  title,
  children,
  actions,
  className,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}>) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <DialogShell title={title} className={className}>
        <div className="flex items-start gap-3 p-4 font-pixel-lg text-lg leading-snug text-foreground">
          {children}
        </div>
        {actions && (
          <div className="flex justify-end gap-2 border-t-2 border-border px-4 py-3">
            {actions}
          </div>
        )}
      </DialogShell>
    </Dialog.Root>
  );
}

export function Y2kAlert({
  open,
  onOpenChange,
  title,
  icon = "alert",
  children,
  actions,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  icon?: "alert" | "info" | "success";
  children: React.ReactNode;
  actions?: React.ReactNode;
}>) {
  return (
    <Y2kDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      actions={actions}
      className="max-w-sm"
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 shrink-0",
          icon === "alert" && "text-btn-danger",
          icon === "info" && "text-accent",
          icon === "success" && "text-success",
        )}
      >
        {icon === "alert" && <AlertTriangle className="size-5" />}
        {icon === "info" && <Info className="size-5" />}
        {icon === "success" && <Check className="size-5" />}
      </span>
      <span>{children}</span>
    </Y2kDialog>
  );
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger,
  onConfirm,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
}>) {
  return (
    <Y2kAlert
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      icon={danger ? "alert" : "info"}
      actions={
        <>
          <Y2kButton variant="secondary" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </Y2kButton>
          <Y2kButton
            variant={danger ? "danger" : "primary"}
            onClick={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            {confirmLabel}
          </Y2kButton>
        </>
      }
    >
      {message}
    </Y2kAlert>
  );
}

/* ── Error alert with retry (pattern for data pages) ────────── */

export function ErrorAlert({
  title,
  message,
  detail,
  onRetry,
  retryLabel = "Try again",
}: Readonly<{
  title?: string;
  message: string;
  detail?: string | null;
  onRetry?: () => void;
  retryLabel?: string;
}>) {
  const router = useRouter();
  return (
    <div
      role="alert"
      className="flex flex-col items-start gap-3 border-2 border-border bg-window-body p-4 shadow-[4px_4px_0_var(--border)]"
    >
      <div className="flex flex-col gap-1">
        {title && (
          <p className="font-pixel text-[9px] leading-relaxed text-foreground">
            {title}
          </p>
        )}
        <p className="flex items-center gap-2 font-pixel-lg text-lg leading-snug text-foreground">
          <AlertTriangle
            aria-hidden="true"
            className="size-5 shrink-0 text-btn-danger"
          />
          {message}
        </p>
        {detail && (
          <p className="font-body text-xs font-bold text-muted-foreground">
            {detail}
          </p>
        )}
      </div>
      <Y2kButton
        variant="primary"
        onClick={() => (onRetry ?? (() => router.refresh()))()}
      >
        {retryLabel}
      </Y2kButton>
    </div>
  );
}

/* ── FeedbackState: loading / empty / error-with-retry ──────── */

export function FeedbackState({
  loading,
  error,
  empty,
  emptyTitle = "Nothing here yet",
  emptyMessage,
  emptyAction,
  errorMessage = "Something went wrong. Please try again.",
  onRetry,
  loadingTitle,
  loadingLabel,
  children,
}: Readonly<{
  loading?: boolean;
  error?: boolean;
  empty?: boolean;
  emptyTitle?: React.ReactNode;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  errorMessage?: string;
  onRetry?: () => void;
  loadingTitle?: string;
  loadingLabel?: string;
  children: React.ReactNode;
}>) {
  if (loading) {
    return (
      <SkeletonWindow title={loadingTitle ?? "Loading…"} label={loadingLabel} />
    );
  }
  if (error) {
    return <ErrorAlert message={errorMessage} onRetry={onRetry} />;
  }
  if (empty) {
    return (
      <Window title={emptyTitle}>
        <div className="flex flex-col items-center gap-3 py-6 text-center">
          <p className="font-body text-sm font-bold text-muted-foreground">
            {emptyMessage}
          </p>
          {emptyAction}
        </div>
      </Window>
    );
  }
  return <>{children}</>;
}

/* ── Toasts ─────────────────────────────────────────────────── */

type Toast = { id: number; message: string; variant: "success" | "error" };

const ToastContext = createContext<{
  push: (message: string, variant?: Toast["variant"]) => void;
}>({
  push: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback(
    (message: string, variant: Toast["variant"] = "success") => {
      const id = nextToastId();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    },
    [],
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="fixed right-4 bottom-14 z-[60] flex flex-col gap-2"
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            message={toast.message}
            variant={toast.variant}
            onClose={() =>
              setToasts((prev) => prev.filter((t) => t.id !== toast.id))
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/* ── Loading button helper ──────────────────────────────────── */

export function SaveButton({
  busy,
  children,
  variant = "primary",
  ...props
}: Readonly<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    busy?: boolean;
    variant?: Y2kButtonVariant;
  }
>) {
  return (
    <Y2kButton variant={variant} disabled={busy} {...props}>
      {busy ? "SAVING…" : children}
    </Y2kButton>
  );
}

export { buttonClasses, Toast, type ToastVariant } from "@/components/y2k";
