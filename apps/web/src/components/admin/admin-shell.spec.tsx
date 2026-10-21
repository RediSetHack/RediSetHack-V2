import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AdminChrome } from "./admin-shell";
import { buildAdminCrumbs } from "./admin-breadcrumb";

const mocks = vi.hoisted(() => ({ pathname: "/admin" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
}));

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}));

beforeEach(() => {
  mocks.pathname = "/admin";
});

describe("AdminChrome", () => {
  it("renders the Control Panel window, the breadcrumb and the Back to app link", () => {
    const html = renderToStaticMarkup(
      <AdminChrome forbidden={false}>
        <div data-testid="page">Dashboard</div>
      </AdminChrome>,
    );
    expect(html).toContain("CONTROL_PANEL.EXE");
    expect(html).toContain('aria-label="Breadcrumb"');
    expect(html).toContain("Back to app");
    expect(html).toContain('href="/map"');
    expect(html).toContain("Dashboard");
  });

  it("marks the current section in the sidebar", () => {
    mocks.pathname = "/admin/quests";
    const html = renderToStaticMarkup(
      <AdminChrome forbidden={false}>
        <div />
      </AdminChrome>,
    );
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/admin\/quests"/);
    expect(html).not.toMatch(/<a[^>]*aria-current="page"[^>]*href="\/admin\/regions"/);
    // The current icon reads as pressed.
    expect(html).toContain("translate-x-[2px]");
  });

  it("marks the Dashboard as current on the dashboard route", () => {
    const html = renderToStaticMarkup(
      <AdminChrome forbidden={false}>
        <div />
      </AdminChrome>,
    );
    expect(html).toMatch(/<a[^>]*aria-current="page"[^>]*href="\/admin"/);
  });

  it("collapses the sidebar to a dropdown below the lg breakpoint", () => {
    const html = renderToStaticMarkup(
      <AdminChrome forbidden={false}>
        <div />
      </AdminChrome>,
    );
    // The mobile dropdown is shown until the lg breakpoint, the pinned
    // sidebar only from it on.
    expect(html).toContain("lg:hidden");
    expect(html).toContain("hidden lg:block");
    expect(html).toContain("<details");
  });

  it("swaps the page for the ACCESS DENIED window when the API refused it", () => {
    const html = renderToStaticMarkup(
      <AdminChrome forbidden>
        <div data-testid="page">Dashboard content</div>
      </AdminChrome>,
    );
    expect(html).toContain("ACCESS DENIED");
    expect(html).toContain("BACK TO MAP");
    expect(html).toContain("SIGN OUT");
    expect(html).not.toContain("Dashboard content");
  });
});

describe("buildAdminCrumbs", () => {
  it("starts every route at ADMIN", () => {
    expect(buildAdminCrumbs("/admin")).toEqual([{ label: "ADMIN", href: "/admin" }]);
  });

  it("names the section a list page shows", () => {
    expect(buildAdminCrumbs("/admin/quests")).toEqual([
      { label: "ADMIN", href: "/admin" },
      { label: "Quests", href: "/admin/quests" },
    ]);
  });

  it("names the Review Queue section", () => {
    expect(buildAdminCrumbs("/admin/review")[1]).toEqual({
      label: "Review Queue",
      href: "/admin/review",
    });
  });

  it("marks a New page", () => {
    expect(buildAdminCrumbs("/admin/regions/new").at(-1)).toEqual({ label: "New" });
  });

  it("names the edited item when the page published one", () => {
    expect(buildAdminCrumbs("/admin/quests/12", "Intro Quiz").at(-1)).toEqual({
      label: 'Edit "Intro Quiz"',
    });
  });

  it("falls back to a plain Edit when the item has no name yet", () => {
    expect(buildAdminCrumbs("/admin/quests/12").at(-1)).toEqual({ label: "Edit" });
    expect(buildAdminCrumbs("/admin/quests/12", "   ").at(-1)).toEqual({ label: "Edit" });
  });

  it("labels a review detail as Review", () => {
    expect(buildAdminCrumbs("/admin/review/7").at(-1)).toEqual({ label: "Review" });
  });
});
