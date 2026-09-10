"use client";

import { useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { syncUser } from "@/lib/api-client";

interface UnregisteredUserCardProps {
  readonly email: string;
  readonly apiUrl?: string;
}

export function UnregisteredUserCard({
  email,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
}: UnregisteredUserCardProps) {
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompleteSignUp = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to obtain authentication session token");
      }
      await syncUser(apiUrl, token, { email });
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
    <div className="w-full max-w-lg mx-auto p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-md space-y-6 text-center">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-2xl mx-auto">
        ⚠️
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          No Account Found
        </h2>
        <p className="text-sm text-destructive font-medium">
          No account associated with this email, please sign up.
        </p>
        <p className="text-xs text-muted-foreground break-all">
          Signed in as: <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 rounded-lg text-xs bg-destructive/10 text-destructive border border-destructive/20"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Button
          type="button"
          onClick={handleCompleteSignUp}
          disabled={isLoading}
          className="w-full sm:w-auto px-6 font-semibold"
        >
          {isLoading ? "Creating Account..." : "Complete Sign Up"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Sign Out
        </Button>
      </div>
    </div>
  );
}
