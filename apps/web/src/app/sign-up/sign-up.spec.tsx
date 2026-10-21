import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
  SignUp: (props: Record<string, unknown>) => (
    <div data-testid="clerk-sign-up" data-appearance={JSON.stringify(props.appearance)}>
      CLERK_SIGN_UP
    </div>
  ),
  useClerk: () => ({ signOut: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/sign-up",
}));

import SignUpPage from "./[[...sign-up]]/page";

describe("Sign Up Page (PAGES.md §3)", () => {
  it("renders Clerk SignUp inside a SIGN_UP.EXE Y2K window with pixel title bar", () => {
    const html = renderToStaticMarkup(<SignUpPage />);

    expect(html).toContain("SIGN_UP.EXE");
    expect(html).toContain("y2k-scanline");
    expect(html).toContain("CLERK_SIGN_UP");
  });

  it("passes Y2K appearance customization to Clerk SignUp", () => {
    const html = renderToStaticMarkup(<SignUpPage />);

    expect(html).toContain("#FFD84D"); // colorPrimary
    expect(html).toContain("#1A0A2E"); // colorText
    expect(html).toContain("var(--font-pixel)");
  });
});
