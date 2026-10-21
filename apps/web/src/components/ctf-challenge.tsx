"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@clerk/nextjs";
import { Check, Download, Flag, X } from "lucide-react";
import {
  ApiError,
  getCtfArtifact,
  getCtfChallenge,
  submitCtfFlag,
  type CtfArtifact,
  type CtfChallenge,
} from "@/lib/api-client";
import { artifactFileName, flagVerdict } from "@/lib/ctf";
import { CtfChallengeFacts } from "@/components/ctf-challenge-facts";
import { StatusChip, Window, Y2kButton, Y2kInput } from "@/components/y2k";
import { FeedbackState } from "@/components/y2k-dialog";

/** Saves the artifact to the learner's machine. */
function downloadArtifact(name: string, content: string) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = artifactFileName(name);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function CtfChallengeView({ apiUrl, challengeId }: Readonly<{ apiUrl: string; challengeId: number }>) {
  const { getToken } = useAuth();
  const [challenge, setChallenge] = useState<CtfChallenge | null>(null);
  const [artifact, setArtifact] = useState<CtfArtifact | null>(null);
  const [flag, setFlag] = useState("");
  const [verdict, setVerdict] = useState<ReturnType<typeof flagVerdict> | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const token = (await getToken()) ?? "";
        const [c, a] = await Promise.all([getCtfChallenge(apiUrl, token, challengeId), getCtfArtifact(apiUrl, token, challengeId)]);
        setChallenge(c);
        setArtifact(a);
      } catch (e) {
        setLoadError(e instanceof ApiError && e.status === 403 ? "This challenge is locked until you finish the earlier Stage." : "Could not load this challenge.");
      }
    })();
  }, [apiUrl, challengeId, getToken]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setVerdict(null);
    setSubmitError(null);
    setSubmitting(true);
    try {
      const result = await submitCtfFlag(apiUrl, (await getToken()) ?? "", challengeId, flag);
      setVerdict(flagVerdict(result));
      if (result.correct) setChallenge((c) => (c ? { ...c, solved: true } : c));
    } catch (e) {
      setSubmitError(e instanceof ApiError && e.status === 429 ? e.message : "Could not submit the flag.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError) {
    return (
      <FeedbackState error errorMessage={loadError}>
        {null}
      </FeedbackState>
    );
  }

  if (!challenge || !artifact) {
    return (
      <FeedbackState
        loading
        loadingTitle="CTF.EXE"
        loadingLabel="Loading challenge"
      >
        {null}
      </FeedbackState>
    );
  }

  return (
    <div className="space-y-4">
      <Window
        title={challenge.title}
        actions={
          challenge.solved ? (
            <StatusChip status="solved" />
          ) : (
            <StatusChip status="not-taken" label="Unsolved" />
          )
        }
      >
        <CtfChallengeFacts challenge={challenge} />
        <p className="mt-3 font-body text-sm font-bold text-foreground">{challenge.brief}</p>
      </Window>

      <Window
        title={artifact.name}
        actions={
          <Y2kButton
            variant="secondary"
            onClick={() => downloadArtifact(artifact.name, artifact.content)}
          >
            <Download aria-hidden="true" className="size-3" /> DOWNLOAD
          </Y2kButton>
        }
      >
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-sm text-foreground">{artifact.content}</pre>
      </Window>

      <Window title="FLAG SUBMISSION">
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
          <Y2kButton type="submit" disabled={flag.trim() === "" || submitting}>
            {submitting ? "SUBMITTING…" : "SUBMIT"}
          </Y2kButton>
        </form>
        {verdict && (
          <output
            className={`mt-3 flex items-start gap-2 font-body text-sm font-bold ${verdict.tone === "success" ? "text-success" : "text-btn-danger"}`}
          >
            {verdict.tone === "success" ? (
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            ) : (
              <X aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            )}
            {verdict.message}
          </output>
        )}
        {submitError && (
          <p role="alert" className="mt-3 font-body text-sm font-bold text-btn-danger">
            {submitError}
          </p>
        )}
      </Window>
    </div>
  );
}
