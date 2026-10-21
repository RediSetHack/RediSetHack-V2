import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { AccountWindow } from "./account-window";

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn(), openUserProfile: vi.fn() }),
}));

describe("AccountWindow (PAGES.md §14 Account)", () => {
  it("shows the name and email as read-only values", () => {
    const html = renderToStaticMarkup(
      <AccountWindow name="Jai" email="jai@example.com" />,
    );

    expect(html).toContain("Jai");
    expect(html).toContain("jai@example.com");
    expect(html).not.toContain("<input");
  });

  it("offers the account actions", () => {
    const html = renderToStaticMarkup(
      <AccountWindow name="Jai" email="jai@example.com" />,
    );

    expect(html).toContain("MANAGE ACCOUNT");
    expect(html).toContain("SIGN OUT");
  });

  it("falls back to a placeholder when the account details are missing", () => {
    const html = renderToStaticMarkup(
      <AccountWindow name={null} email={null} />,
    );

    expect(html).toContain("Not provided");
  });
});
