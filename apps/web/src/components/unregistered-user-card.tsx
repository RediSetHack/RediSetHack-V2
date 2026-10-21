"use client";

import { useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { syncUser } from "@/lib/api-client";
import { Y2kButton, buttonClasses } from "@/components/y2k";

interface UnregisteredUserCardProps {
  readonly email: string;
  readonly apiUrl?: string;
  readonly initialLoading?: boolean;
  readonly initialError?: string | null;
}

export function UnregisteredUserCard({
  email,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  initialLoading = false,
  initialError = null,
}: UnregisteredUserCardProps) {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);

  const handleCompleteSignUp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to obtain authentication session token");
      }
      await syncUser(apiUrl, token);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register account");
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut({ redirectUrl: "/sign-in" });
  };

  return (
    <section
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-dialog-title"
      className="w-full max-w-md border-2 border-border bg-window-body shadow-[6px_6px_0_var(--border)]"
    >
      <header className="y2k-scanline flex min-h-8 items-center border-b-2 border-border bg-title-bar px-2 py-1">
        <span className="relative z-10 font-pixel text-[9px] leading-relaxed">
          SETUP.EXE
        </span>
      </header>
      <div className="flex flex-col items-center gap-4 p-4 text-center">
        <AlertTriangle aria-hidden="true" className="size-6 text-btn-danger" />
        <div className="flex flex-col gap-2">
          <p id="setup-dialog-title" className="font-pixel-lg text-lg leading-snug">
            We&apos;re still setting up your account
          </p>
          <p className="font-body text-sm font-bold text-muted-foreground break-all">
            Signed in as: {email}
          </p>
        </div>
        {error && (
          <div
            role="alert"
            className="w-full border-2 border-border bg-btn-danger p-2 text-left text-white shadow-[2px_2px_0_var(--border)]"
          >
            <p className="font-body text-sm font-bold">{error}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Y2kButton variant="primary" onClick={handleCompleteSignUp} disabled={isLoading}>
            {isLoading ? "SAVING…" : "RETRY SYNC"}
          </Y2kButton>
          <button type="button" onClick={handleSignOut} className={buttonClasses("ghost")} disabled={isLoading}>
            SIGN OUT
          </button>
        </div>
      </div>
    </section>
  );
}
