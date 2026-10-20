"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  Flag,
  FolderEdit,
  Gamepad2,
  LayoutGrid,
  LogOut,
  Map,
  Play,
  Shield,
  Terminal,
  Trophy,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { buttonClasses } from "@/components/y2k";

const WINDOW_BUTTONS = [
  { href: "/map", label: "Map", icon: Map },
  { href: "/quests", label: "Quests", icon: Flag },
  { href: "/codelab", label: "Codelab", icon: Terminal },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
] as const;

const START_ENTRIES = [
  ...WINDOW_BUTTONS.map((e) => ({ ...e, section: "app" as const })),
  { href: "/ctf", label: "CTF", icon: Flag, section: "more" as const },
  { href: "/side-quests", label: "Side Quests", icon: Gamepad2, section: "more" as const },
  { href: "/discover", label: "Discover", icon: LayoutGrid, section: "more" as const },
];

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);
  return (
    <time
      dateTime={now.toISOString()}
      className="font-pixel text-[9px] leading-relaxed text-foreground"
    >
      {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
    </time>
  );
}

export function Taskbar({
  isAdmin,
  isContributor,
}: Readonly<{ isAdmin: boolean; isContributor: boolean }>) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const [startOpen, setStartOpen] = useState(false);

  const entries = [
    ...START_ENTRIES,
    ...(isContributor
      ? [{ href: "/contribute", label: "Contribute", icon: FolderEdit, section: "more" as const }]
      : []),
    ...(isAdmin
      ? [{ href: "/admin", label: "Control Panel", icon: Shield, section: "more" as const }]
      : []),
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex h-10 items-center gap-1 border-t-2 border-border bg-title-bar px-2"
      aria-label="Taskbar"
    >
      <div className="relative">
        <button
          type="button"
          aria-expanded={startOpen}
          aria-haspopup="menu"
          onClick={() => setStartOpen((v) => !v)}
          className={cn(buttonClasses("secondary"), "h-8 px-2", startOpen && "translate-x-[2px] translate-y-[2px] shadow-none")}
        >
          <Play aria-hidden="true" className="size-3.5" />
          Start
        </button>
        {startOpen && (
          <div
            role="menu"
            aria-label="Start menu"
            className="y2k-window absolute bottom-11 left-0 z-50 min-w-52 border-2 border-border bg-window-body shadow-[4px_4px_0_var(--border)]"
          >
            <p className="border-b-2 border-border bg-sparkle px-3 py-1.5 font-pixel text-[9px] leading-relaxed text-white">
              Programs
            </p>
            <ul>
              {entries.map((entry) => (
                <li key={entry.href}>
                  <Link
                    role="menuitem"
                    href={entry.href}
                    onClick={() => setStartOpen(false)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 font-body text-[11px] font-semibold tracking-wide uppercase hover:bg-accent/40",
                      pathname.startsWith(entry.href) && "bg-accent/60",
                    )}
                  >
                    <entry.icon aria-hidden="true" className="size-4" />
                    {entry.label}
                  </Link>
                </li>
              ))}
              <li className="border-t border-border/40">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="flex w-full items-center gap-2 px-3 py-2 font-body text-[11px] font-semibold tracking-wide text-btn-danger uppercase hover:bg-accent/40"
                >
                  <LogOut aria-hidden="true" className="size-4" />
                  Sign out
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      <ul className="mx-auto flex items-center gap-1 overflow-x-auto">
        {WINDOW_BUTTONS.map((button) => {
          const active = pathname.startsWith(button.href);
          return (
            <li key={button.href}>
              <Link
                href={button.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  buttonClasses("secondary"),
                  "h-8 gap-1.5 px-2",
                  active && "translate-x-[2px] translate-y-[2px] shadow-none",
                )}
              >
                <button.icon aria-hidden="true" className="size-3.5" />
                <span className="hidden sm:inline">{button.label}</span>
                <span className="sr-only sm:hidden">{button.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="ml-auto hidden sm:block">
        <Clock />
      </div>
    </nav>
  );
}
