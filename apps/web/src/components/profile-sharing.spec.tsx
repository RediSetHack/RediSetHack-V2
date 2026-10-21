import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { ProfileSharing } from "./profile-sharing";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("tok") }),
}));

describe("ProfileSharing (PAGES.md §14 Shared Profile)", () => {
  it("keeps sharing off by default and offers the SHARE action", () => {
    const html = renderToStaticMarkup(
      <ProfileSharing initialShareId={null} apiUrl="http://localhost:3001" />,
    );

    expect(html).toContain("SHARE");
    expect(html).toContain("Your profile is private.");
    expect(html).not.toContain("REVOKE");
    expect(html).not.toContain("/shared/");
  });

  it("shows the public link and the revoke action once sharing is on", () => {
    const html = renderToStaticMarkup(
      <ProfileSharing
        initialShareId="11111111-2222-3333-4444-555555555555"
        apiUrl="http://localhost:3001"
      />,
    );

    expect(html).toContain("REVOKE");
    expect(html).toContain("Your profile is shared.");
    expect(html).toContain("href=\"/shared/11111111-2222-3333-4444-555555555555\"");
    expect(html).toContain("COPY LINK");
  });
});
