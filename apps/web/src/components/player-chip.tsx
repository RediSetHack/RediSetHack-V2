"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { ChevronDown, LogOut, Shield, User } from "lucide-react";
import type { Profile } from "@/lib/api-client";
import { formatXp, levelProgress } from "@/lib/format";
import { AvatarOrInitial, Progress } from "@/components/y2k";

export function PlayerChip({
  profile,
  isAdmin = false,
  error = false,
}: Readonly<{
  profile: Profile | null;
  isAdmin?: boolean;
  error?: boolean;
}>) {
  const { signOut } = useClerk();

  if (error) {
    return (
      <p role="alert" className="font-body text-xs font-bold text-btn-danger">
        Your profile could not be loaded.
      </p>
    );
  }

  if (!profile) {
    return null;
  }

  const { level, intoLevel, span } = levelProgress(profile.totalXp);

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <span
          data-testid="admin-chip"
          className="inline-flex items-center gap-1 border-2 border-border bg-sparkle px-2 py-0.5 font-pixel text-[8px] leading-relaxed text-white"
        >
          <Shield aria-hidden="true" className="size-3" />
          ADMIN
        </span>
      )}
      <details className="relative">
        <summary className="flex list-none items-center gap-2 border-2 border-border bg-window-body px-2 py-1 shadow-[2px_2px_0_var(--border)]">
          <AvatarOrInitial
            src={profile.character?.imageUrl}
            name={profile.character?.name ?? "?"}
            className="size-8"
          />
          <span className="hidden text-left sm:block">
            <span className="block font-body text-[11px] font-extrabold text-foreground">
              {profile.character?.name ?? "Adventurer"}
            </span>
            <span className="block font-pixel text-[8px] leading-relaxed text-muted-foreground">
              LV {level}
            </span>
            <Progress
              value={intoLevel}
              max={span}
              label="XP to next Level"
              className="mt-0.5 h-2 w-28 shadow-none"
              march={false}
            />
            <span className="block font-pixel-lg text-base leading-none text-foreground">
              {formatXp(profile.totalXp)}
            </span>
          </span>
          <ChevronDown aria-hidden="true" className="size-3" />
        </summary>
        <div className="absolute right-0 z-40 mt-1 w-44 border-2 border-border bg-window-body shadow-[4px_4px_0_var(--border)]">
          <Link
            href="/profile"
            className="flex items-center gap-2 border-b border-border/40 px-3 py-2 font-body text-[11px] font-semibold tracking-wide uppercase hover:bg-accent/40"
          >
            <User aria-hidden="true" className="size-4" /> Profile
          </Link>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex w-full items-center gap-2 px-3 py-2 font-body text-[11px] font-semibold tracking-wide text-btn-danger uppercase hover:bg-accent/40"
          >
            <LogOut aria-hidden="true" className="size-4" /> Sign out
          </button>
        </div>
      </details>
    </div>
  );
}
