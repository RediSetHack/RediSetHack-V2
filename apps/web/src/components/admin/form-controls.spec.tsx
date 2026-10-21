import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DeleteMessage } from "./form-controls";

describe("DeleteMessage", () => {
  it("uses the ADR-0005 copy, never cascade wording", () => {
    const html = renderToStaticMarkup(<DeleteMessage name="Core" />);
    expect(html).toContain("Delete Core? This cannot be undone.");
    expect(html).toContain(
      "If learners have progress, Results or XP on this content it will be archived and hidden from learners; otherwise it is deleted.",
    );
    expect(html.toLowerCase()).not.toContain("cascade");
    expect(html).not.toContain("Results deleted");
  });
});
