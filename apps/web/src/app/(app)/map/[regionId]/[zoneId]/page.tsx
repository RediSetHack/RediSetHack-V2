import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStages, type Stage } from "@/lib/api-client";

const STATUS_LABEL: Record<Stage["status"], string> = {
  locked: "Locked",
  available: "Available",
  completed: "Completed",
};

function StatusBadge({ status }: Readonly<{ status: Stage["status"] }>) {
  const styles: Record<Stage["status"], string> = {
    locked: "bg-muted text-muted-foreground",
    available: "bg-primary/10 text-primary",
    completed: "bg-green-500/10 text-green-600 dark:text-green-400",
  };

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function StageCard({
  stage,
  href,
}: Readonly<{ stage: Stage; href: string }>) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="font-medium">{stage.title}</p>
        <StatusBadge status={stage.status} />
      </div>
      <p className="text-sm text-muted-foreground">{stage.xpReward} XP</p>
    </>
  );

  if (stage.status === "locked") {
    return (
      <div
        aria-disabled="true"
        aria-label={`${stage.title}, locked, worth ${stage.xpReward} XP`}
        className="block cursor-not-allowed rounded-md border border-border/60 p-4 opacity-60"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={href}
      aria-label={`${stage.title}, ${STATUS_LABEL[stage.status]}, worth ${stage.xpReward} XP`}
      className="block rounded-md border border-border/60 p-4 hover:bg-muted"
    >
      {body}
    </Link>
  );
}

export default async function ZoneStagesPage({
  params,
}: Readonly<{ params: Promise<{ regionId: string; zoneId: string }> }>) {
  const { regionId, zoneId } = await params;
  const regionIdNumber = Number(regionId);
  const zoneIdNumber = Number(zoneId);
  if (!Number.isInteger(regionIdNumber) || !Number.isInteger(zoneIdNumber)) {
    notFound();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { getToken } = await auth();
  const token = await getToken();

  let stages: Stage[];
  try {
    stages = await getStages(apiUrl, token ?? "", zoneIdNumber);
  } catch {
    return (
      <p role="alert" className="p-6 text-destructive">
        Stages could not be loaded. Please try again.
      </p>
    );
  }

  if (stages.length === 0) {
    return (
      <p className="p-6 text-muted-foreground">
        This Zone has no Stages yet — check back soon.
      </p>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-bold tracking-tight">Stages</h1>
      <ol className="mt-4 flex flex-col gap-2">
        {stages.map((stage) => (
          <li key={stage.id}>
            <StageCard
              stage={stage}
              href={`/map/${regionIdNumber}/${zoneIdNumber}/${stage.id}`}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
