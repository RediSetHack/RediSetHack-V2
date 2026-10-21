import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  SignIn: (props: Record<string, unknown>) => (
    <div data-testid="clerk-sign-in" data-appearance={JSON.stringify(props.appearance)}>
      CLERK_SIGN_IN
    </div>
  ),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/sign-in",
}));

import SignInPage from "./[[...sign-in]]/page";

describe("Sign In Page (PAGES.md §2)", () => {
  it("renders Clerk SignIn inside a SIGN_IN.EXE Y2K window with pixel title bar", async () => {
    const html = renderToStaticMarkup(await SignInPage({}));

    expect(html).toContain("SIGN_IN.EXE");
    expect(html).toContain("y2k-scanline");
    expect(html).toContain("CLERK_SIGN_IN");
  });

  it("passes Y2K appearance customization to Clerk SignIn", async () => {
    const html = renderToStaticMarkup(await SignInPage({}));

    expect(html).toContain("#FFD84D"); // colorPrimary / Y2K yellow
    expect(html).toContain("#1A0A2E"); // colorText
    expect(html).toContain("var(--font-pixel)");
  });

  it("renders error alert banner when error=no_account", async () => {
    const html = renderToStaticMarkup(
      await SignInPage({ searchParams: Promise.resolve({ error: "no_account" }) }),
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("No account associated with this email, please sign up.");
    expect(html).toContain('href="/sign-up"');
  });
});
