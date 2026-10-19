import { describe, expect, it, vi } from "vitest";

import { ApiError, submitContributorDraft, updateContributorDraft } from "./api-client";

const draft = {
  id: 1, zoneId: 2, title: "T", lessonContent: [], status: "draft", revision: 2,
  submittedRevision: null, createdAt: "2026-10-19T00:00:00Z", updatedAt: "2026-10-19T00:00:00Z", submittedAt: null,
};
const respond = (status: number, body: unknown) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe("contributor draft client", () => {
  it("sends the revision being edited and parses the saved draft", async () => {
    const fetchFn = respond(200, draft);
    const saved = await updateContributorDraft("http://api/", "tok", 1, { revision: 1, title: "T", lessonContent: [] }, fetchFn);
    expect(saved.revision).toBe(2);
    expect(fetchFn).toHaveBeenCalledWith("http://api/v1/api/contributor/drafts/1", expect.objectContaining({ method: "PUT", body: JSON.stringify({ revision: 1, title: "T", lessonContent: [] }) }));
  });

  it("surfaces every validation issue with its field path", async () => {
    const fetchFn = respond(400, { message: "x", issues: [{ path: "title", message: "Title is required" }, { path: "lessonContent.0.content", message: "Text blocks need content" }] });
    await expect(updateContributorDraft("http://api", "tok", 1, { revision: 1, title: "", lessonContent: [] }, fetchFn)).rejects.toThrow("title: Title is required; lessonContent.0.content: Text blocks need content");
  });

  it("reports a revision conflict as a 409 ApiError", async () => {
    const error = await submitContributorDraft("http://api", "tok", 1, 1, respond(409, { message: "changed" })).catch((e) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 409, message: "changed" });
  });
});
