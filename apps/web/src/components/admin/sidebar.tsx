"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  ClipboardCheck,
  Flag,
  Globe,
  LayoutDashboard,
  Layers,
  MapPin,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Window, buttonClasses } from "@/components/y2k";

type SidebarItem = Readonly<{ href: string; label: string; icon: LucideIcon }>;

const ITEMS: readonly SidebarItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/regions", label: "Regions", icon: Globe },
  { href: "/admin/zones", label: "Zones", icon: Layers },
  { href: "/admin/stages", label: "Stages", icon: MapPin },
  { href: "/admin/quests", label: "Quests", icon: Flag },
  { href: "/admin/badges", label: "Badges", icon: Award },
  { href: "/admin/characters", label: "Characters", icon: Users },
  { href: "/admin/review", label: "Review Queue", icon: ClipboardCheck },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(`${href}/`);
}

function SidebarLink({ item, active, onClick }: Readonly<{ item: SidebarItem; active: boolean; onClick?: () => void }>) {
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 border-2 border-transparent px-2 py-2 font-body text-[11px] font-semibold tracking-wide uppercase",
        "hover:bg-accent/40",
        active && "translate-x-[2px] translate-y-[2px] border-border bg-window-body shadow-[2px_2px_0_var(--border)]",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "y2k-icon flex size-7 shrink-0 items-center justify-center border-2 border-border bg-window-body shadow-[2px_2px_0_var(--border)]",
          active && "shadow-none",
        )}
      >
        <item.icon className="size-4" />
      </span>
      <span className="min-w-0 truncate">{item.label}</span>
    </Link>
  );
}

function BackToApp({ onClick }: Readonly<{ onClick?: () => void }>) {
  return (
    <Link href="/map" onClick={onClick} className={cn(buttonClasses("ghost"), "w-full justify-start")}>
      Back to app
    </Link>
  );
}

/** The CONTROL_PANEL.EXE window: desktop-icon nav on lg, a `<details>` dropdown on mobile. */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile: collapses to a top dropdown. */}
      <details className="border-2 border-border bg-window-body shadow-[4px_4px_0_var(--border)] lg:hidden">
        <summary className="cursor-pointer bg-title-bar px-3 py-2 font-pixel text-[9px] leading-relaxed text-foreground">
          CONTROL_PANEL.EXE
        </summary>
        <nav aria-label="Admin" className="flex flex-col gap-1 border-t-2 border-border p-2">
          {ITEMS.map((item) => (
            <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
          ))}
          <BackToApp />
        </nav>
      </details>

      {/* Desktop: pinned sidebar window. */}
      <div className="hidden lg:block">
        <Window title="CONTROL_PANEL.EXE" bodyClassName="p-2">
          <nav aria-label="Admin" className="flex flex-col gap-1">
            {ITEMS.map((item) => (
              <SidebarLink key={item.href} item={item} active={isActive(pathname, item.href)} />
            ))}
          </nav>
          <div className="mt-2 border-t-2 border-border/40 pt-2">
            <BackToApp />
          </div>
        </Window>
      </div>
    </>
  );
}
