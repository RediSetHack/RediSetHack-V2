import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Window, Sparkle, buttonClasses } from "@/components/y2k";
import { AdminSidebar, AdminSignOut } from "@/components/admin/sidebar";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? "user";

  if (role !== "admin") {
    return (
      <div className="y2k-grid flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Window title="ACCESS_DENIED.EXE">
            <div className="flex flex-col items-center gap-4 py-2 text-center">
              <ShieldAlert aria-hidden="true" className="size-10 text-btn-danger" />
              <p className="font-pixel text-[11px] leading-relaxed text-foreground">ACCESS DENIED</p>
              <p className="font-pixel-lg text-lg leading-snug text-foreground">
                You need an admin account to open the Control Panel.
              </p>
              <div className="flex flex-wrap justify-center gap-3 border-t-2 border-border pt-4">
                <Link href="/map" className={buttonClasses("primary")}>
                  BACK TO MAP
                </Link>
                <AdminSignOut />
              </div>
            </div>
          </Window>
        </div>
      </div>
    );
  }

  // Admin-only surface: no profile fetch, no onboarding redirect — the shell
  // here is the Control Panel itself, not the learner AppShell.
  const now = new Date();
  const clock = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="y2k-grid flex min-h-screen flex-col">
      <header className="relative z-10 border-b-2 border-border bg-window-body">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-2">
          <span className="flex items-center gap-2">
            <Sparkle size={16} />
            <span className="font-pixel text-[12px] leading-relaxed text-foreground">REDISETHACK</span>
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="border-2 border-border bg-sparkle px-2 py-0.5 font-pixel text-[9px] leading-relaxed text-white">
              ADMIN
            </span>
            <time className="font-pixel text-[9px] leading-relaxed text-foreground">{clock}</time>
          </span>
        </div>
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-4 p-4 lg:flex-row">
        <aside className="w-full shrink-0 lg:w-60">
          <AdminSidebar />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
