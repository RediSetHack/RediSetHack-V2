"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import { Flag } from "lucide-react";
import {
  ApiError,
  getCtfArtifact,
  getCtfChallenge,
  submitCtfFlag,
  type CtfArtifact,
  type CtfAttempt,
  type CtfChallenge,
} from "@/lib/api-client";
import { StatusChip, Window, XPChip, Y2kButton, Y2kInput } from "@/components/y2k";

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

  if (error) return <p role="alert" className="font-body text-sm font-bold text-btn-danger">{error}</p>;
  if (!challenge || !artifact) return <p className="font-body text-sm font-bold text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-4">
      <Window title={challenge.title}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-body text-sm font-bold">{challenge.category} · {challenge.difficulty}</span>
          <XPChip xp={challenge.xpReward} />
          {challenge.solved && <StatusChip status="solved" />}
        </div>
        <p className="mt-2 font-body text-sm font-bold">{challenge.brief}</p>
      </Window>

      <Window title={artifact.name}>
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm">{artifact.content}</pre>
      </Window>

      <Window title="Flag Submission">
        <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 items-center gap-2">
            <Flag aria-hidden="true" className="size-4" />
            <Y2kInput
              aria-label="Flag"
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              maxLength={200}
              placeholder="RSH{...}"
              className="flex-1"
            />
          </div>
          <Y2kButton type="submit" disabled={flag.trim() === ""}>SUBMIT</Y2kButton>
        </form>
        {message && <p role="status" className="mt-2 font-body text-sm font-bold">{message}</p>}
      </Window>
    </div>
  );
}
