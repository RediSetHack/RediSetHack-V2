"use client";

import type { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminBreadcrumb } from "@/components/admin/admin-breadcrumb";
import { AdminAccessDenied, ADMIN_FORBIDDEN_COPY } from "@/components/admin/access-denied";
import { AdminAccessProvider, useAdminAccess } from "@/components/admin/admin-access";

/**
 * The Control Panel chrome (PAGES.md §15.0): the CONTROL_PANEL.EXE sidebar,
 * the title-bar breadcrumb and the page's own window. The learner AppShell
 * around it already carries the wordmark, the Player chip and the ADMIN tag.
 */
export function AdminChrome({
  children,
  forbidden,
}: Readonly<{ children: ReactNode; forbidden: boolean }>) {
  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row">
      <aside className="w-full shrink-0 lg:w-60">
        <AdminSidebar />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="border-2 border-border bg-title-bar px-3 py-1.5 shadow-[4px_4px_0_var(--border)]">
          <AdminBreadcrumb />
        </div>
        <div className="min-w-0 flex-1">
          {forbidden ? <AdminAccessDenied reason={ADMIN_FORBIDDEN_COPY} /> : children}
        </div>
      </div>
    </div>
  );
}

function AdminShellChrome({ children }: Readonly<{ children: ReactNode }>) {
  const { forbidden } = useAdminAccess();
  return <AdminChrome forbidden={forbidden}>{children}</AdminChrome>;
}

/**
 * Wraps every `/admin/*` page. Owns the shared admin state, so a `403` from
 * any admin API call swaps the page for the ACCESS DENIED window.
 */
export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AdminAccessProvider>
      <AdminShellChrome>{children}</AdminShellChrome>
    </AdminAccessProvider>
  );
}
