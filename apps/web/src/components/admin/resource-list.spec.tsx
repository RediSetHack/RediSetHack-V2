import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { ResourceList } from "./resource-list";
import { DeleteMessage } from "./form-controls";

vi.mock("@/components/y2k-dialog", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/y2k-dialog")>()),
  useToast: () => ({ push: vi.fn() }),
}));
vi.mock("@/components/admin/use-catalog", () => ({ API_URL: "http://api.test", useToken: () => ({ token: "t", settled: true }) }));
vi.mock("@/components/admin/admin-access", () => ({ useAdminAccess: () => ({ report: () => false }) }));

const renderList = (rows: { id: number; name: string }[]) =>
  renderToStaticMarkup(
    <ResourceList
      title="REGIONS.EXE"
      rows={rows}
      columns={[{ key: "name", header: "Name", render: (row) => row.name }]}
      searchPlaceholder="Search Regions…"
      haystack={(row) => row.name}
      newHref="/admin/regions/new"
      newLabel="NEW REGION"
      emptyMessage="No Regions yet — create the first one."
      deleteItem={async () => {}}
      deleteName={(row) => row.name}
    />,
  );

describe("ResourceList", () => {
  it("shows the empty state with a NEW button when there are no rows", () => {
    const html = renderList([]);
    expect(html).toContain("No Regions yet — create the first one.");
    expect(html).toContain('href="/admin/regions/new"');
  });

  it("lists rows with EDIT and DELETE actions", () => {
    const html = renderList([{ id: 3, name: "Core" }]);
    expect(html).toContain('href="/admin/regions/3"');
    expect(html).toContain("Delete Core");
  });
});

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
