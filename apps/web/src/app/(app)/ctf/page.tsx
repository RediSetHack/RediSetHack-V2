import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { ChevronLeft } from "lucide-react";
import { CtfChallengeView } from "@/components/ctf-challenge";
import { CtfChallengeList } from "@/components/ctf-challenge-list";
import { getCtfChallenges, type CtfSummary } from "@/lib/api-client";
import { Breadcrumb, Sparkle, Window, buttonClasses } from "@/components/y2k";

export default async function CtfPage({
  searchParams,
}: Readonly<{ searchParams: Promise<{ challenge?: string }> }>) {
  const { challenge } = await searchParams;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const id = Number(challenge) > 0 ? Number(challenge) : undefined;
  if (id) {
    return (
      <div className="mx-auto w-full max-w-4xl flex-1 space-y-4 p-6 sm:p-10">
        <Link href="/ctf" className={buttonClasses("ghost")}>
          <ChevronLeft aria-hidden="true" className="size-3" /> ALL CHALLENGES
        </Link>
        <CtfChallengeView apiUrl={apiUrl} challengeId={id} />
      </div>
    );
  }

  const { getToken } = await auth();
  let challenges: CtfSummary[] | null = null;
  try {
    challenges = await getCtfChallenges(apiUrl, (await getToken()) ?? "");
  } catch {
    challenges = null;
  }

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-6 sm:p-10">
      <Window title={<Breadcrumb items={[{ label: "CTF" }]} />}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-pixel text-xl leading-relaxed text-foreground">
              CTF
            </h1>
            <p className="mt-2 font-body text-sm font-bold text-muted-foreground">
              Capture the flag. Solve a challenge to earn XP.
            </p>
          </div>
          <Sparkle size={20} />
        </div>
      </Window>
      <CtfChallengeList challenges={challenges} error={challenges === null} />
    </div>
  );
}
