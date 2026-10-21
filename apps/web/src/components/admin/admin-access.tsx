"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { isForbidden } from "@/lib/admin-helpers";

type AdminAccessValue = Readonly<{
  /** `true` once an admin API call came back `403 Forbidden`. */
  forbidden: boolean;
  /**
   * Reports a failed API call. Returns `true` when the failure was a `403`,
   * i.e. when the shell swapped itself for the ACCESS DENIED window.
   */
  report: (cause: unknown) => boolean;
  /** The edited item's name, shown as the last breadcrumb segment. */
  title: string | null;
  setTitle: (title: string | null) => void;
}>;

const AdminAccessContext = createContext<AdminAccessValue>({
  forbidden: false,
  report: () => false,
  title: null,
  setTitle: () => {},
});

/**
 * Holds the admin-only state the whole Control Panel shares: whether an
 * admin API call was refused, and the name of the item being edited.
 */
export function AdminAccessProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [forbidden, setForbidden] = useState(false);
  const [title, setTitle] = useState<string | null>(null);

  const report = useCallback((cause: unknown) => {
    if (!isForbidden(cause)) return false;
    setForbidden(true);
    return true;
  }, []);

  const value = useMemo<AdminAccessValue>(
    () => ({ forbidden, report, title, setTitle }),
    [forbidden, report, title],
  );

  return <AdminAccessContext.Provider value={value}>{children}</AdminAccessContext.Provider>;
}

export function useAdminAccess(): AdminAccessValue {
  return useContext(AdminAccessContext);
}

/**
 * Publishes the edited item's name so the shell's breadcrumb can read
 * `ADMIN › Quests › Edit "Intro Quiz"`. Renders nothing.
 */
export function AdminPageTitle({ title }: Readonly<{ title: string }>) {
  const { setTitle } = useAdminAccess();

  useEffect(() => {
    setTitle(title);
    return () => setTitle(null);
  }, [title, setTitle]);

  return null;
}
