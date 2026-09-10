"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  DEFAULT_CHARACTERS,
  selectUserCharacter,
  type CharacterOption,
} from "@/lib/api-client";

interface CharacterSelectorProps {
  readonly initialCharacterId?: number | null;
  readonly apiUrl?: string;
}

function getButtonLabel(
  isLoading: boolean,
  isSelected: boolean,
  isActive: boolean,
): string {
  if (isLoading && isSelected) {
    return "Updating...";
  }
  if (isActive) {
    return "Selected";
  }
  return "Choose Avatar";
}

export function CharacterSelector({
  initialCharacterId = null,
  apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
}: CharacterSelectorProps) {
  const { getToken } = useAuth();
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
    <div className="w-full max-w-4xl space-y-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Choose Your Character</h2>
        <p className="text-muted-foreground text-sm">
          Select an avatar identity for your RediSetHack learning progression.
          Your choice determines your persona across quests, leaderboards, and code labs.
        </p>
      </div>

      {message && (
        <div
          role="alert"
          className={`p-4 rounded-lg text-sm border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
              : "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:border-destructive/30"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {DEFAULT_CHARACTERS.map((char) => {
          const isCurrentActive = activeCharacterId === char.id;
          const isSelected = selectedId === char.id;
          const buttonLabel = getButtonLabel(isLoading, isSelected, isCurrentActive);

          return (
            <button
              type="button"
              key={char.id}
              disabled={isLoading}
              onClick={() => handleSelect(char)}
              className={`group relative flex flex-col text-left p-5 rounded-xl border transition-all cursor-pointer select-none ${
                isCurrentActive
                  ? "border-primary bg-primary/5 ring-2 ring-primary/30 shadow-md"
                  : "border-border hover:border-foreground/30 hover:bg-muted/40"
              } ${isLoading && isSelected ? "opacity-70 pointer-events-none" : ""}`}
            >
              <div className="flex items-center justify-between gap-2 mb-3 w-full">
                <span className="text-3xl" role="img" aria-label={char.name}>
                  {char.avatarIcon}
                </span>
                {isCurrentActive && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                    Active
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-1">
                {char.name}
              </h3>
              <p className="text-xs text-muted-foreground flex-1 leading-relaxed">
                {char.description}
              </p>
              <div className="mt-4 pt-3 border-t border-border/50 w-full">
                <span
                  className={`inline-flex items-center justify-center w-full rounded-lg text-xs font-medium py-1.5 transition-colors ${
                    isCurrentActive
                      ? "bg-primary text-primary-foreground"
                      : "border border-input bg-background hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {buttonLabel}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
