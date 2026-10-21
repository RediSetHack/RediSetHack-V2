"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { ShieldAlert } from "lucide-react";
import { Window, Y2kButton, buttonClasses } from "@/components/y2k";

/** The copy the dialog shows when the API itself refused the request. */
export const ADMIN_FORBIDDEN_COPY =
  "The Control Panel refused your request. You need an admin account to open it.";

/**
 * The ACCESS DENIED window (PAGES.md §15.1): a `ShieldAlert`, the reason, and
 * the BACK TO MAP / SIGN OUT buttons. Shown to non-admins on every
 * `/admin/*` route, and whenever an admin API call answers `403 Forbidden`.
 */
export function AdminAccessDenied({ reason }: Readonly<{ reason?: string }>) {
  return (
    <Window title="ACCESS_DENIED.EXE">
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <ShieldAlert aria-hidden="true" className="size-10 text-btn-danger" />
        <p className="font-pixel text-[11px] leading-relaxed text-foreground">ACCESS DENIED</p>
        <p className="font-pixel-lg text-lg leading-snug text-foreground">
          {reason ?? "You need an admin account to open the Control Panel."}
        </p>
        <div className="flex flex-wrap justify-center gap-3 border-t-2 border-border pt-4">
          <Link href="/map" className={buttonClasses("primary")}>
            BACK TO MAP
          </Link>
          <AdminSignOut />
        </div>
      </div>
    </Window>
  );
}

/** Sign-out button for the Access Denied window (Clerk needs a client boundary). */
export function AdminSignOut({ children = "SIGN OUT" }: Readonly<{ children?: React.ReactNode }>) {
  const { signOut } = useClerk();
  return (
    <Y2kButton variant="danger" onClick={() => signOut({ redirectUrl: "/" })}>
      {children}
    </Y2kButton>
  );
}
