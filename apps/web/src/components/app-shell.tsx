import Link from "next/link";
import type { Profile, DailyEvent } from "@/lib/api-client";
import { EventBanner } from "@/components/event-banner";

const NAV_LINKS = [
  { href: "/map", label: "Map" },
  { href: "/quests", label: "Quests" },
  { href: "/codelab", label: "Codelab" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/profile", label: "Profile" },
];

function NavLinks({ className }: Readonly<{ className: string }>) {
  return (
    <nav aria-label="Main" className={className}>
      {NAV_LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

function ProfileSummary({
  profile,
  error,
}: Readonly<{
  profile: Profile | null;
  error: boolean;
}>) {
  if (error) {
    return (
      <p role="alert" className="text-xs text-destructive">
        Your profile could not be loaded.
      </p>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <p className="text-xs text-muted-foreground">
      {profile.character?.name ?? "No Character"} • Level {profile.level} •{" "}
      {profile.totalXp} XP
    </p>
  );
}

export function AppShell({
  profile,
  profileError,
  event,
  eventError,
  children,
}: Readonly<{
  profile: Profile | null;
  profileError: boolean;
  event: DailyEvent | null;
  eventError: boolean;
  children: React.ReactNode;
}>) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b border-border/60 bg-background">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <NavLinks className="hidden sm:flex sm:items-center sm:gap-1" />
            <details className="sm:hidden">
              <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
                Menu
              </summary>
              <NavLinks className="flex flex-col gap-1 pt-1" />
            </details>
            <ProfileSummary profile={profile} error={profileError} />
          </div>
          <EventBanner event={event} error={eventError} />
        </div>
      </div>
      <div className="flex-1 flex flex-col">{children}</div>
    </div>
  );
}
