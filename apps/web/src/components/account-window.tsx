"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut, UserCog } from "lucide-react";
import { Y2kButton } from "@/components/y2k";

/**
 * PAGES.md §14 Account window: the name and email are read-only here (Clerk
 * owns them), while MANAGE ACCOUNT and SIGN OUT hand the learner over to
 * Clerk.
 */
export function AccountWindow({
  name,
  email,
}: Readonly<{ name: string | null; email: string | null }>) {
  const { openUserProfile, signOut } = useClerk();

  const manageAccount = () => {
    if (typeof openUserProfile === "function") {
      openUserProfile();
      return;
    }
    window.open("https://accounts.clerk.dev/user", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-3">
      <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]">
          <dt className="font-pixel text-[8px] leading-relaxed text-foreground">Name</dt>
          <dd className="mt-1 font-body text-sm font-bold text-foreground">
            {name ?? "Not provided"}
          </dd>
        </div>
        <div className="border-2 border-border bg-window-body p-3 shadow-[3px_3px_0_var(--border)]">
          <dt className="font-pixel text-[8px] leading-relaxed text-foreground">Email</dt>
          <dd className="mt-1 font-body text-sm font-bold text-foreground">
            {email ?? "Not provided"}
          </dd>
        </div>
      </dl>
      <div className="flex flex-wrap items-center gap-2">
        <Y2kButton type="button" variant="secondary" onClick={manageAccount}>
          <UserCog aria-hidden="true" className="size-4" />
          MANAGE ACCOUNT
        </Y2kButton>
        <Y2kButton
          type="button"
          variant="danger"
          onClick={() => signOut({ redirectUrl: "/" })}
        >
          <LogOut aria-hidden="true" className="size-4" />
          SIGN OUT
        </Y2kButton>
      </div>
    </div>
  );
}
