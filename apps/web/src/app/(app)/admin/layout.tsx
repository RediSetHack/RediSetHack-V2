import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { AdminAccessDenied } from "@/components/admin/access-denied";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const role = (user?.publicMetadata?.role as string | undefined) ?? "user";

  // Non-admins never see the Control Panel: the ACCESS DENIED window stands
  // in for every `/admin/*` route.
  if (role !== "admin") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <AdminAccessDenied />
        </div>
      </div>
    );
  }

  // Admin-only surface: the Control Panel replaces the page area with its own
  // chrome — the sidebar, the title-bar breadcrumb and the shared admin state
  // that turns a `403` from the API into the ACCESS DENIED window.
  return <AdminShell>{children}</AdminShell>;
}
