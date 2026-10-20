"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Heart } from "lucide-react";
import { selectUserCharacter, type CharacterOption } from "@/lib/api-client";
import { SaveButton } from "@/components/y2k-dialog";
import {
  AvatarOrInitial,
  PixelHeart,
  Window,
  buttonClasses,
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
            <button
              type="button"
              key={char.id}
              disabled={isLoading}
              onClick={() => handleSelect(char)}
              className={`group relative flex flex-col gap-2 border-2 border-border bg-window-body p-3 text-left shadow-[3px_3px_0_var(--border)] transition-[transform,box-shadow] duration-[80ms] linear hover:brightness-105 active:translate-x-[3px] active:translate-y-[3px] active:shadow-none ${
                isSelected || isCurrentActive ? "outline outline-2 outline-accent" : ""
              } ${isLoading && isSelected ? "opacity-70 pointer-events-none" : ""}`}
            >
              <div className="flex items-center justify-between">
                <AvatarOrInitial src={char.imageUrl} name={char.name} className="size-10" />
                {(isSelected || isCurrentActive) && <PixelHeart size={16} />}
              </div>
              <div className="flex flex-col gap-1">
                <p className="font-pixel text-[9px] leading-relaxed">{char.name}</p>
                <p className="font-body text-xs font-bold text-muted-foreground">
                  {char.description}
                </p>
              </div>
              <span className={buttonClasses(isActive ? "primary" : "secondary") + " w-full"}>
                {isActive ? "Selected" : "Choose Avatar"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CharacterPicker({
  characters,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
}: Readonly<{
  characters: readonly CharacterOption[];
  apiUrl?: string;
}>) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = characters.find((c) => c.id === selectedId) ?? null;

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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Character could not be saved. Try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {characters.map((char) => {
            const isSelected = selectedId === char.id;
            return (
              <button
                type="button"
                key={char.id}
                onClick={() => setSelectedId(char.id)}
                className={`flex items-center gap-3 border-2 border-border bg-window-body p-3 text-left shadow-[3px_3px_0_var(--border)] ${
                  isSelected ? "outline outline-2 outline-accent" : ""
                }`}
              >
                <AvatarOrInitial src={char.imageUrl} name={char.name} className="size-10" />
                <div className="flex flex-1 flex-col">
                  <p className="font-pixel text-[9px] leading-relaxed">{char.name}</p>
                  <p className="font-body text-xs font-bold text-muted-foreground">
                    {char.description}
                  </p>
                </div>
                {isSelected && <PixelHeart size={16} />}
              </button>
            );
          })}
        </div>
        <Window title="PREVIEW.EXE">
          <div className="flex flex-col items-center gap-3 text-center">
            {selected ? (
              <>
                <AvatarOrInitial src={selected.imageUrl} name={selected.name} className="size-16" />
                <p className="font-pixel text-[9px] leading-relaxed">{selected.name}</p>
                <p className="font-body text-xs font-bold text-muted-foreground">
                  {selected.description}
                </p>
              </>
            ) : (
              <p className="font-body text-sm font-bold text-muted-foreground">
                Select a character
              </p>
            )}
          </div>
        </Window>
      </div>
      {error && (
        <div role="alert" className="border-2 border-border bg-btn-danger p-2 text-white shadow-[2px_2px_0_var(--border)]">
          <p className="flex items-center gap-2 font-body text-sm font-bold">
            <Heart aria-hidden="true" className="size-4" />
            {error}
          </p>
        </div>
      )}
      <div className="flex items-center justify-end">
        <SaveButton busy={isLoading} disabled={!selectedId || isLoading} onClick={handleConfirm}>
          CONFIRM CHARACTER
        </SaveButton>
      </div>
    </div>
  );
}
