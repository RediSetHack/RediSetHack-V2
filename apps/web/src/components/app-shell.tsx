import Link from "next/link";
import type { Profile, DailyEvent } from "@/lib/api-client";
import { EventBanner } from "@/components/event-banner";
import { PlayerChip } from "@/components/player-chip";
import { Taskbar } from "@/components/taskbar";
import { Decorations, Sparkle, buttonClasses } from "@/components/y2k";
import { cn } from "@/lib/utils";

export function MinimalHeader() {
  return (
    <header className="relative z-10 border-b-2 border-border bg-window-body">
      <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="flex items-center gap-2">
          <Sparkle size={16} />
          <span className="font-pixel text-[12px] leading-relaxed text-foreground">
            REDISETHACK
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className={cn(buttonClasses("secondary"), "h-7 px-2.5 text-[8px]")}
          >
            SIGN IN
          </Link>
          <Link
            href="/sign-up"
            className={cn(buttonClasses("primary"), "h-7 px-2.5 text-[8px]")}
          >
            SIGN UP
          </Link>
        </div>
      </div>
    </header>
  );
}

export function AppShell({
  profile,
  profileError,
  event,
  eventError,
  isAdmin,
  isContributor,
  children,
}: Readonly<{
  profile: Profile | null;
  profileError: boolean;
  event: DailyEvent | null;
  eventError: boolean;
  isAdmin: boolean;
  isContributor: boolean;
  children: React.ReactNode;
}>) {
  return (
    <div className="y2k-grid flex min-h-screen flex-col pb-12">
      <Decorations />
      <header className="relative z-10 border-b-2 border-border bg-window-body">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-2">
          <Link href="/" className="flex items-center gap-2">
            <Sparkle size={16} />
            <span className="font-pixel text-[12px] leading-relaxed text-foreground">
              REDISETHACK
            </span>
          </Link>
          <PlayerChip profile={profile} isAdmin={isAdmin} error={profileError} />
        </div>
      </header>

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 pt-4">
        <EventBanner event={event} error={eventError} />
      </div>

      <main className="relative z-10 mx-auto w-full max-w-[1200px] flex-1 px-4 py-4">
        {children}
      </main>

      <Taskbar isAdmin={isAdmin} isContributor={isContributor} />
    </div>
  );
}
