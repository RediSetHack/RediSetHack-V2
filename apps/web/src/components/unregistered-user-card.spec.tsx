import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { UnregisteredUserCard } from "./unregistered-user-card";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("tok") }),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("UnregisteredUserCard (PAGES.md §4 variant)", () => {
  it("renders as a dialog with SETUP.EXE title and signed in email", () => {
    const html = renderToStaticMarkup(
      <UnregisteredUserCard email="newbie@example.com" />,
    );

    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain("SETUP.EXE");
    expect(html).toContain("We&#x27;re still setting up your account");
    expect(html).toContain("Signed in as: newbie@example.com");
  });

  it("renders RETRY SYNC button and SIGN OUT link/button", () => {
    const html = renderToStaticMarkup(
      <UnregisteredUserCard email="newbie@example.com" />,
    );

    expect(html).toContain("RETRY SYNC");
    expect(html).toContain("SIGN OUT");
  });

  it("shows SAVING… while loading and disables buttons", () => {
    const html = renderToStaticMarkup(
      <UnregisteredUserCard email="newbie@example.com" initialLoading={true} />,
    );

    expect(html).toContain("SAVING…");
    expect(html).toContain("disabled");
  });

  it("renders error alert copy when registration fails", () => {
    const html = renderToStaticMarkup(
      <UnregisteredUserCard
        email="newbie@example.com"
        initialError="Failed to register account"
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Failed to register account");
  });
});
