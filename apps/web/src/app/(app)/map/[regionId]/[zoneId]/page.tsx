import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegions, getStages, getZones, type Stage } from "@/lib/api-client";
import { isZoneCleared } from "@/lib/map-progress";
import { Breadcrumb, EmptyState, Sparkle, StageNode, Window, Y2kButton } from "@/components/y2k";
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
        <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: regionName || "Region" }, { label: zoneName || "Zone" }]} />}>
          <ErrorAlert message="Stages could not be loaded. Please try again." />
        </Window>
      </div>
    );

  const breadcrumbItems = [
    { label: "MAP", href: "/map" },
    { label: regionName || "Region", href: `/map/${regionIdNumber}` },
    { label: zoneName || "Zone" },
  ];

  if (stages.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Window title={<Breadcrumb items={breadcrumbItems} />}>
          <EmptyState title="This Zone has no Stages yet." />
          <div className="mt-4">
            <Link href={`/map/${regionIdNumber}`}>
              <Y2kButton variant="ghost">BACK TO ZONE LIST</Y2kButton>
            </Link>
          </div>
        </Window>
      </div>
    );
  }

  const zoneCleared = isZoneCleared(stages);

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <Window title={<Breadcrumb items={breadcrumbItems} />}>
        {storyIntro && (
          <div className="mb-4 font-body text-sm font-bold text-foreground">
            {storyIntro}
          </div>
        )}
        <ol className="flex flex-col gap-3">
          {stages.map((stage, idx) => (
            <li key={stage.id}>
              <StageNode
                stageNumber={idx + 1}
                title={stage.title}
                xpReward={stage.xpReward}
                status={stage.status}
                href={
                  stage.status !== "locked"
                    ? `/map/${regionIdNumber}/${zoneIdNumber}/${stage.id}`
                    : undefined
                }
              />
            </li>
          ))}
        </ol>
        <div className="mt-4 font-body text-sm font-bold text-muted-foreground">
          Finish a Stage to unlock the next one.
        </div>
        {zoneCleared && (
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
