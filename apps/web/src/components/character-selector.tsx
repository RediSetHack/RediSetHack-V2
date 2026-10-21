"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { AlertTriangle } from "lucide-react";
import { selectUserCharacter, type CharacterOption } from "@/lib/api-client";
import {
  AvatarOrInitial,
  PixelHeart,
  Window,
  Y2kButton,
} from "@/components/y2k";
import { SaveButton, useToast } from "@/components/y2k-dialog";

interface CharacterSelectorProps {
  readonly characters: readonly CharacterOption[];
  readonly initialCharacterId?: number | null;
  readonly apiUrl?: string;
}

/**
 * PAGES.md §4 radio-card grid: image (checkerboard placeholder when missing),
 * name, description, and an accent border + pixel heart on the selected card.
 * Shared by the onboarding picker and the Profile's Change Character section.
 */
export function CharacterRadioGrid({
  characters,
  selectedId,
  onSelect,
  onHoverChange,
  disabled = false,
  label = "Pick your character",
  columns = "grid-cols-1 gap-3 sm:grid-cols-2",
}: Readonly<{
  characters: readonly CharacterOption[];
  selectedId: number | null;
  onSelect: (character: CharacterOption) => void;
  onHoverChange?: (character: CharacterOption | null) => void;
  disabled?: boolean;
  label?: string;
  columns?: string;
}>) {
  return (
    <div role="radiogroup" aria-label={label} className={`grid ${columns}`}>
      {characters.map((char) => {
        const isSelected = selectedId === char.id;
        return (
          <button
            type="button"
            key={char.id}
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onSelect(char)}
            onMouseEnter={() => onHoverChange?.(char)}
            onMouseLeave={() => onHoverChange?.(null)}
            onFocus={() => onHoverChange?.(char)}
            onBlur={() => onHoverChange?.(null)}
            className={`group relative flex items-center gap-3 border-2 border-border bg-window-body p-3 text-left shadow-[3px_3px_0_var(--border)] transition-[box-shadow,transform] duration-[80ms] hover:brightness-[1.08] active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
              isSelected
                ? "border-accent shadow-[3px_3px_0_var(--accent)] outline outline-2 outline-accent"
                : ""
            }`}
          >
            <AvatarOrInitial
              src={char.imageUrl}
              name={char.name}
              className="size-10 shrink-0"
            />
            <div className="flex flex-1 flex-col">
              <p className="font-pixel text-[9px] leading-relaxed text-foreground">
                {char.name}
              </p>
              {char.description && (
                <p className="font-body text-xs font-bold text-muted-foreground">
                  {char.description}
                </p>
              )}
            </div>
            {isSelected && <PixelHeart size={16} />}
          </button>
        );
      })}
    </div>
  );
}

/**
 * PAGES.md §14 Change Character: the same radio-card grid as onboarding, saved
 * with SAVE CHARACTER. Success raises the "Character updated." toast, failure
 * shows an error alert.
 */
export function CharacterSelector({
  characters,
  initialCharacterId = null,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
}: CharacterSelectorProps) {
  const { getToken } = useAuth();
  const { push } = useToast();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(initialCharacterId);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (selectedId === null) return;
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to obtain authentication session token");
      }

      await selectUserCharacter(apiUrl, token, selectedId);
      push("Character updated.");
      router.refresh();
    } catch {
      setError("Character could not be saved. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-pixel text-[11px] leading-relaxed">Change Character</h2>
        <p className="font-body text-sm font-bold text-muted-foreground">
          Pick a new identity for your learning journey — your XP, Badges and
          progress stay the same.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 border-2 border-border bg-btn-danger p-3 text-white shadow-[2px_2px_0_var(--border)]"
        >
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          <p className="font-body text-sm font-bold">{error}</p>
        </div>
      )}

      <CharacterRadioGrid
        characters={characters}
        selectedId={selectedId}
        onSelect={(character) => {
          setSelectedId(character.id);
          setError(null);
        }}
        disabled={isLoading}
        label="Change Character"
        columns="grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      />

      <div className="flex items-center justify-end">
        <SaveButton
          busy={isLoading}
          onClick={handleSave}
          disabled={selectedId === null || isLoading}
        >
          SAVE CHARACTER
        </SaveButton>
      </div>
    </div>
  );
}

export function CharacterPicker({
  characters,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  initialSelectedId = null,
  initialLoading = false,
  initialError = null,
}: Readonly<{
  characters: readonly CharacterOption[];
  apiUrl?: string;
  initialSelectedId?: number | null;
  initialLoading?: boolean;
  initialError?: string | null;
}>) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(initialSelectedId);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(initialError);

  const activeChar =
    characters.find((c) => c.id === (hoveredId ?? selectedId)) ?? null;

  const handleConfirm = async () => {
    if (!selectedId) return;
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to obtain authentication session token");
      }
      await selectUserCharacter(apiUrl, token, selectedId);
      router.push("/map");
      router.refresh();
    } catch {
      setError("Character could not be saved. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <CharacterRadioGrid
          characters={characters}
          selectedId={selectedId}
          onSelect={(character) => {
            setSelectedId(character.id);
            setError(null);
          }}
          onHoverChange={(character) => setHoveredId(character?.id ?? null)}
        />
        <Window title="PREVIEW.EXE">
          <div className="flex flex-col items-center gap-3 p-2 text-center">
            {activeChar ? (
              <>
                <AvatarOrInitial
                  src={activeChar.imageUrl}
                  name={activeChar.name}
                  className="size-20"
                />
                <p className="font-pixel text-[10px] leading-relaxed text-foreground">
                  {activeChar.name}
                </p>
                {activeChar.description && (
                  <p className="font-body text-xs font-bold text-muted-foreground">
                    {activeChar.description}
                  </p>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-6 text-muted-foreground">
                <p className="font-pixel text-[9px]">Select a character</p>
                <p className="font-body text-xs font-bold">
                  Choose an avatar to preview
                </p>
              </div>
            )}
          </div>
        </Window>
      </div>
      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 border-2 border-border bg-btn-danger p-3 text-white shadow-[2px_2px_0_var(--border)]"
        >
          <AlertTriangle aria-hidden="true" className="size-4 shrink-0" />
          <p className="font-body text-sm font-bold">{error}</p>
        </div>
      )}
      <div className="flex items-center justify-end">
        <Y2kButton
          variant="primary"
          disabled={!selectedId || isLoading}
          onClick={handleConfirm}
        >
          {isLoading ? "SAVING…" : "CONFIRM CHARACTER"}
        </Y2kButton>
      </div>
    </div>
  );
}
