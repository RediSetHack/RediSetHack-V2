import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { AdminAccessDenied, ADMIN_FORBIDDEN_COPY } from "./access-denied";

vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
}));

describe("AdminAccessDenied", () => {
  it("renders the ACCESS DENIED window with its reason and both buttons", () => {
    const html = renderToStaticMarkup(<AdminAccessDenied />);
    expect(html).toContain("ACCESS_DENIED.EXE");
    expect(html).toContain("ACCESS DENIED");
    expect(html).toContain("You need an admin account to open the Control Panel.");
    expect(html).toContain("BACK TO MAP");
    expect(html).toContain("SIGN OUT");
    expect(html).toContain('href="/map"');
  });

  it("shows the ShieldAlert icon", () => {
    const html = renderToStaticMarkup(<AdminAccessDenied />);
    expect(html).toContain("lucide-shield-alert");
  });

  it("uses the API-refusal copy when the admin API answered 403", () => {
    const html = renderToStaticMarkup(<AdminAccessDenied reason={ADMIN_FORBIDDEN_COPY} />);
    expect(html).toContain(ADMIN_FORBIDDEN_COPY);
    expect(html).not.toContain("You need an admin account to open the Control Panel.");
  });
});
