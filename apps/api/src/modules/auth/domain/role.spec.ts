import { describe, expect, it } from "vitest";

import { roleFromPublicMetadata } from "./role.js";

describe("roleFromPublicMetadata", () => {
  it.each([
    [{ role: "admin" }, "admin"],
    [{ role: "contributor" }, "contributor"],
    [{ role: "superuser" }, "user"],
    [{}, "user"],
    [null, "user"],
    [undefined, "user"],
  ])("%j -> %s", (metadata, role) => {
    expect(roleFromPublicMetadata(metadata)).toBe(role);
  });
});
