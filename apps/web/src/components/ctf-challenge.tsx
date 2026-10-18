"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  ApiError,
  getCtfArtifact,
  getCtfChallenge,
  submitCtfFlag,
  type CtfArtifact,
  type CtfAttempt,
  type CtfChallenge,
} from "@/lib/api-client";

function verdict(result: CtfAttempt): string {
  if (!result.correct) return "Not the flag. Check the artifact and try again.";
  return result.alreadySolved ? "Correct — you already solved this one." : `Correct! +${result.xpAwarded} XP earned.`;
}

export function CtfChallengeView({ apiUrl, challengeId }: Readonly<{ apiUrl: string; challengeId: number }>) {
  const { getToken } = useAuth();
  const [challenge, setChallenge] = useState<CtfChallenge | null>(null);
  const [artifact, setArtifact] = useState<CtfArtifact | null>(null);
  const [flag, setFlag] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        const token = (await getToken()) ?? "";
        const [c, a] = await Promise.all([getCtfChallenge(apiUrl, token, challengeId), getCtfArtifact(apiUrl, token, challengeId)]);
        setChallenge(c);
        setArtifact(a);
      } catch (e) {
        setError(e instanceof ApiError && e.status === 403 ? "This challenge is locked until you finish the earlier stage." : "Could not load this challenge.");
      }
    })();
  }, [apiUrl, challengeId, getToken]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    try {
      const result = await submitCtfFlag(apiUrl, (await getToken()) ?? "", challengeId, flag);
      setMessage(verdict(result));
      if (result.correct) setChallenge((c) => (c ? { ...c, solved: true } : c));
    } catch (e) {
      setMessage(e instanceof ApiError && e.status === 429 ? e.message : "Could not submit the flag.");
    }
  }

  if (error) return <p role="alert" className="text-sm text-destructive">{error}</p>;
  if (!challenge || !artifact) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{challenge.title}</h1>
      <p className="text-sm text-muted-foreground">
        {challenge.category} · {challenge.difficulty} · {challenge.xpReward} XP{challenge.solved ? " · Solved" : ""}
      </p>
      <p>{challenge.brief}</p>
      <div className="rounded-md border border-border bg-card font-mono text-sm">
        <div className="border-b border-border/60 px-4 py-2 text-xs font-medium text-muted-foreground">{artifact.name}</div>
        <pre className="overflow-x-auto whitespace-pre-wrap p-4">{artifact.content}</pre>
      </div>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          aria-label="Flag"
          value={flag}
          onChange={(e) => setFlag(e.target.value)}
          maxLength={200}
          placeholder="RSH{...}"
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-sm"
        />
        <Button type="submit" disabled={flag.trim() === ""}>Submit flag</Button>
      </form>
      {message && <p role="status" className="text-sm font-medium">{message}</p>}
    </div>
  );
}
