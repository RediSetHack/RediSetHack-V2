import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock } from "lucide-react";
import { getRegions, getStages, getZones, type Stage } from "@/lib/api-client";
import { Breadcrumb, EmptyState, Sparkle, StatusChip, Window, XPChip, Y2kButton } from "@/components/y2k";
import { ErrorAlert } from "@/components/y2k-dialog";

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

  let stages: Stage[] = [];
  let regionName = "";
  let zoneName = "";
  let storyIntro: string | null = null;
  let loadError = false;
  try {
    const [stageList, regions, zones] = await Promise.all([
      getStages(apiUrl, token ?? "", zoneIdNumber),
      getRegions(apiUrl),
      getZones(apiUrl, regionIdNumber),
    ]);
    stages = stageList;
    const region = regions.find(({ id }) => id === regionIdNumber);
    const zone = zones.find(({ id }) => id === zoneIdNumber);
    regionName = region?.name ?? "";
    zoneName = zone?.name ?? "";
    storyIntro = region?.storyIntro ?? null;
  } catch {
    loadError = true;
  }

  if (loadError)
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: "Region" }, { label: "Zone" }]} />}>
          <ErrorAlert message="Stages could not be loaded. Please try again." />
        </Window>
      </div>
    );

  if (stages.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: regionName }, { label: zoneName }]} />}>
          <EmptyState title="This Zone has no Stages yet." />
          <div className="mt-4">
            <Link href={`/map/${regionIdNumber}`}>
              <Y2kButton variant="ghost">BACK TO MAP</Y2kButton>
            </Link>
          </div>
        </Window>
      </div>
    );
  }

  const allCompleted = stages.every((s) => s.status === "completed");

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: regionName }, { label: zoneName }]} />}>
        {storyIntro && (
          <div className="mb-4 font-body text-sm font-bold text-foreground">
            {storyIntro}
          </div>
        )}
        <ol className="flex flex-col gap-3">
          {stages.map((stage, idx) => {
            const num = idx + 1;
            const isLocked = stage.status === "locked";
            const isCompleted = stage.status === "completed";
            const isUnlocked = stage.status === "available";
            if (isLocked) {
              return (
                <li key={stage.id}>
                  <div
                    aria-disabled="true"
                    title="Locked — finish the previous Stage first."
                    className="flex items-center gap-3 border-2 border-border bg-muted/60 p-3 opacity-70 shadow-[2px_2px_0_var(--border)]"
                  >
                    <div className="flex size-8 items-center justify-center border-2 border-border bg-window-body font-pixel text-[10px]">
                      {num}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-pixel text-[9px] leading-relaxed text-foreground">
                          {stage.title}
                        </span>
                        <XPChip xp={stage.xpReward} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip status="locked" />
                      <Lock aria-hidden="true" className="size-4" />
                    </div>
                  </div>
                </li>
              );
            }
            return (
              <li key={stage.id}>
                <Link
                  href={`/map/${regionIdNumber}/${zoneIdNumber}/${stage.id}`}
                  aria-label={`${stage.title}, ${isCompleted ? "Completed" : "Unlocked"}, ${stage.xpReward} XP`}
                  className="flex items-center gap-3 border-2 border-border bg-window-body p-3 shadow-[4px_4px_0_var(--border)] transition-[transform] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_var(--border)]"
                >
                  <div className="flex size-8 items-center justify-center border-2 border-border bg-title-bar font-pixel text-[10px]">
                    {num}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-pixel text-[9px] leading-relaxed text-foreground">
                        {stage.title}
                      </span>
                      <XPChip xp={stage.xpReward} />
                    </div>
                  </div>
                  <StatusChip status={isCompleted ? "completed" : "unlocked"} />
                </Link>
              </li>
            );
          })}
        </ol>
        <div className="mt-4 font-body text-sm font-bold text-muted-foreground">
          Finish a Stage to unlock the next one.
        </div>
        {allCompleted && (
          <div className="mt-6">
            <Window title="ZONE CLEARED">
              <div className="flex items-center gap-2">
                <Sparkle size={18} />
                <span className="font-pixel text-[12px] leading-relaxed">ZONE CLEARED</span>
                <Sparkle size={18} />
              </div>
            </Window>
          </div>
        )}
        <div className="mt-4">
          <Link href={`/map/${regionIdNumber}`}>
            <Y2kButton variant="ghost">BACK TO ZONE LIST</Y2kButton>
          </Link>
        </div>
      </Window>
    </div>
  );
}
