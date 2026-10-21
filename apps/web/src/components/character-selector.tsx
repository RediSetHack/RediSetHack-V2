"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { AlertTriangle } from "lucide-react";
import { selectUserCharacter, type CharacterOption } from "@/lib/api-client";
import {
  AvatarOrInitial,
  CharacterCard,
  PixelHeart,
  Window,
  Y2kButton,
} from "@/components/y2k";

interface CharacterSelectorProps {
  readonly characters: readonly CharacterOption[];
  readonly initialCharacterId?: number | null;
  readonly apiUrl?: string;
}

export function CharacterSelector({
  characters,
  initialCharacterId = null,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
}: CharacterSelectorProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(initialCharacterId);
  const [activeCharacterId, setActiveCharacterId] = useState<number | null>(
    initialCharacterId,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{
    readonly type: "success" | "error";
    readonly text: string;
  } | null>(null);

  const handleSelect = async (character: CharacterOption) => {
    const isFirstCharacter = activeCharacterId === null;
    setSelectedId(character.id);
    setIsLoading(true);
    setMessage(null);

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Unable to obtain authentication session token");
      }

      await selectUserCharacter(apiUrl, token, character.id);
      setActiveCharacterId(character.id);
      setMessage({
        type: "success",
        text: `Avatar successfully updated to ${character.name}!`,
      });
      router.refresh();
      if (isFirstCharacter) {
        router.push("/map");
      }
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to select character";
      setMessage({
        type: "error",
        text: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-1">
        <h2 className="font-pixel text-sm leading-relaxed">Choose Your Character</h2>
        <p className="font-body text-sm font-bold text-muted-foreground">
          Select an avatar identity for your RediSetHack learning progression.
        </p>
      </div>

      {message && (
        <div
          role="alert"
          className={`border-2 border-border p-3 font-body text-sm font-bold shadow-[2px_2px_0_var(--border)] ${
            message.type === "success"
              ? "bg-[#59D98F]"
              : "bg-btn-danger text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        {characters.map((char) => {
          const isCurrentActive = activeCharacterId === char.id;
          const isSelected = selectedId === char.id;
          const isActive = isCurrentActive;

          return (
            <CharacterCard
              key={char.id}
              name={char.name}
              description={char.description}
              imageUrl={char.imageUrl}
              selected={isSelected || isCurrentActive}
              disabled={isLoading}
              actionLabel={isActive ? "Selected" : "Choose Avatar"}
              onClick={() => handleSelect(char)}
            />
          );
        })}
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
    characters.find((c) => c.id === (hoveredId ?? selectedId)) ??
    characters.find((c) => c.id === selectedId) ??
    null;

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
        <div
          role="radiogroup"
          aria-label="Pick your character"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          {characters.map((char) => {
            const isSelected = selectedId === char.id;
            return (
              <button
                type="button"
                key={char.id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => {
                  setSelectedId(char.id);
                  setError(null);
                }}
                onMouseEnter={() => setHoveredId(char.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(char.id)}
                onBlur={() => setHoveredId(null)}
                className={`group relative flex items-center gap-3 border-2 border-border bg-window-body p-3 text-left shadow-[3px_3px_0_var(--border)] transition-[box-shadow,transform] duration-[80ms] hover:brightness-[1.03] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${
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
