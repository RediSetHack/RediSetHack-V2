import { describe, expect, it } from "vitest";
import { CharacterListResponseSchema, CharacterSchema } from "./character.schema.js";

describe("CharacterSchema", () => {
  it("parses a valid Character payload", () => {
    const payload = {
      id: 1,
      name: "Binary Knight",
      slug: "binary-knight",
      description: "Resilient defender of algorithms and clean code.",
      imageUrl: null,
    };

    expect(CharacterSchema.parse(payload)).toEqual(payload);
  });

  it("throws ZodError on an invalid payload", () => {
    expect(() => CharacterSchema.parse({ id: "not-a-number" })).toThrow();
  });
});

describe("CharacterListResponseSchema", () => {
  it("parses an array of Characters", () => {
    const payload = [
      { id: 1, name: "Binary Knight", slug: "binary-knight", description: null, imageUrl: null },
    ];

    expect(CharacterListResponseSchema.parse(payload)).toEqual(payload);
  });
});
