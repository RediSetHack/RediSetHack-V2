"use client";

import { usePathname } from "next/navigation";
import { Breadcrumb, type Crumb } from "@/components/y2k";
import { useAdminAccess } from "@/components/admin/admin-access";

/** The admin sections, keyed by their path segment. */
const RESOURCE_LABELS: Record<string, string> = {
  regions: "Regions",
  zones: "Zones",
  stages: "Stages",
  quests: "Quests",
  badges: "Badges",
  characters: "Characters",
  review: "Review Queue",
};

/**
 * Builds the title-bar breadcrumb for an admin route, e.g.
 * `ADMIN › Quests › Edit "Intro Quiz"`. The trailing segment names the
 * edited item when the page published one.
 */
export function buildAdminCrumbs(pathname: string, entityTitle?: string | null): Crumb[] {
  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Crumb[] = [{ label: "ADMIN", href: "/admin" }];

  const resource = segments[1];
  if (!resource) return crumbs;

  const label = RESOURCE_LABELS[resource] ?? resource.charAt(0).toUpperCase() + resource.slice(1);
  crumbs.push({ label, href: `/admin/${resource}` });

  const leaf = segments[2];
  if (!leaf) return crumbs;
  if (leaf === "new") {
    crumbs.push({ label: "New" });
    return crumbs;
  }
  if (resource === "review") {
    crumbs.push({ label: "Review" });
    return crumbs;
  }

  const title = entityTitle?.trim();
  crumbs.push({ label: title ? `Edit "${title}"` : "Edit" });
  return crumbs;
}

/** The shell's title-bar breadcrumb. */
export function AdminBreadcrumb() {
  const pathname = usePathname() ?? "/admin";
  const { title } = useAdminAccess();
  return <Breadcrumb items={buildAdminCrumbs(pathname, title)} />;
}
