import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CharacterPicker, CharacterSelector } from "./character-selector";
import type { CharacterOption } from "@/lib/api-client";

vi.mock("@clerk/nextjs", () => ({
  useAuth: () => ({ getToken: vi.fn().mockResolvedValue("tok") }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

const mockCharacters: CharacterOption[] = [
  {
    id: 1,
    name: "Ada",
    slug: "ada",
    description: "The first programmer",
    imageUrl: null, // Test checkerboard fallback
  },
  {
    id: 2,
    name: "Turing",
    slug: "turing",
    description: "Father of modern computing",
    imageUrl: "https://example.com/turing.png",
  },
];

describe("CharacterPicker (PAGES.md §4 Choose Character)", () => {
  it("renders a radio-card grid with checkerboard fallback when imageUrl is null", () => {
    const html = renderToStaticMarkup(
      <CharacterPicker characters={mockCharacters} />,
    );

    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('role="radio"');
    expect(html).toContain("Ada");
    expect(html).toContain("The first programmer");
    expect(html).toContain("y2k-checker"); // checkerboard fallback
    expect(html).toContain("Turing");
    expect(html).toContain('src="https://example.com/turing.png"');
  });

  it("disables CONFIRM CHARACTER button until a selection is made", () => {
    const html = renderToStaticMarkup(
      <CharacterPicker characters={mockCharacters} initialSelectedId={null} />,
    );

    expect(html).toContain("CONFIRM CHARACTER");
    expect(html).toContain("disabled");
    expect(html).toContain("Select a character");
  });

  it("enables CONFIRM CHARACTER button and updates PREVIEW.EXE when a character is selected", () => {
    const html = renderToStaticMarkup(
      <CharacterPicker characters={mockCharacters} initialSelectedId={1} />,
    );

    // Selected radio has aria-checked="true" and accent border
    expect(html).toContain('role="radio" aria-checked="true"');
    // Preview panel shows selected character
    expect(html).toContain("PREVIEW.EXE");
    expect(html).toContain("Ada");
    // Button is not disabled
    expect(html).not.toMatch(/disabled=""[^>]*>CONFIRM CHARACTER/);
  });

  it("shows SAVING… and disables button while saving", () => {
    const html = renderToStaticMarkup(
      <CharacterPicker
        characters={mockCharacters}
        initialSelectedId={1}
        initialLoading={true}
      />,
    );

    expect(html).toContain("SAVING…");
    expect(html).toContain("disabled");
  });

  it("shows the error copy on failure", () => {
    const html = renderToStaticMarkup(
      <CharacterPicker
        characters={mockCharacters}
        initialSelectedId={1}
        initialError="Character could not be saved. Try again."
      />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Character could not be saved. Try again.");
  });
});

describe("CharacterSelector (PAGES.md §14 Change Character)", () => {
  it("renders the radio-card grid with the current Character selected", () => {
    const html = renderToStaticMarkup(
      <CharacterSelector characters={mockCharacters} initialCharacterId={1} />,
    );

    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('role="radio" aria-checked="true"');
    expect(html).toContain("Ada");
    expect(html).toContain("The first programmer");
    expect(html).toContain("Turing");
  });

  it("offers a SAVE CHARACTER button", () => {
    const html = renderToStaticMarkup(
      <CharacterSelector characters={mockCharacters} initialCharacterId={1} />,
    );

    expect(html).toContain("SAVE CHARACTER");
  });

  it("disables SAVE CHARACTER until a Character is picked", () => {
    const html = renderToStaticMarkup(
      <CharacterSelector characters={mockCharacters} initialCharacterId={null} />,
    );

    expect(html).toMatch(/disabled=""[^>]*>SAVE CHARACTER/);
  });
});
