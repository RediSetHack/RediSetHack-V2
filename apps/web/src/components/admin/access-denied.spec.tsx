import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminAccessDenied, ACCESS_DENIED_COPY } from "./access-denied";

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}));

describe("AdminAccessDenied", () => {
  it("renders the ACCESS DENIED window with its reason and both buttons", () => {
    const html = renderToStaticMarkup(<AdminAccessDenied />);
    expect(html).toContain("ACCESS_DENIED.EXE");
    expect(html).toContain("ACCESS DENIED");
    expect(html).toContain(ACCESS_DENIED_COPY);
    expect(html).toContain("BACK TO MAP");
    expect(html).toContain("SIGN OUT");
    expect(html).toContain('href="/map"');
  });

  it("uses the copy PAGES.md §15.1 specifies", () => {
    expect(ACCESS_DENIED_COPY).toBe("You need an admin account to open the Control Panel.");
  });

  it("shows the ShieldAlert icon", () => {
    const html = renderToStaticMarkup(<AdminAccessDenied />);
    expect(html).toContain("lucide-shield-alert");
  });
});
