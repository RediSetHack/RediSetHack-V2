import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { getRegions, getStages, getZones, type Region } from "@/lib/api-client";
import { completionSummary } from "@/lib/map-progress";
import { AvatarOrInitial, Progress, Window, Y2kButton } from "@/components/y2k";
import { FeedbackState } from "@/components/y2k-dialog";

type RegionCard = {
  region: Region;
  zoneCount: number;
  completed: number;
  total: number;
  percent: number;
};

export default async function MapPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { getToken } = await auth();
  const token = await getToken();

  let cards: RegionCard[] = [];
  let loadError = false;
  try {
    const regions = await getRegions(apiUrl);
    const withStages = await Promise.all(
      regions.map(async (region) => {
        const zones = await getZones(apiUrl, region.id);
        const zoneStages = await Promise.all(
          zones.map((zone) => (token ? getStages(apiUrl, token, zone.id) : Promise.resolve([]))),
        );
        return { region, zoneStages };
      }),
    );
    cards = withStages.map(({ region, zoneStages }) => {
      const { completed, total, percent } = completionSummary(zoneStages);
      return { region, zoneCount: zoneStages.length, completed, total, percent };
    });
  } catch {
    loadError = true;
  }

  if (loadError)
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <FeedbackState error errorMessage="Regions could not be loaded. Please try again.">
          {null}
        </FeedbackState>
      </div>
    );

  if (cards.length === 0)
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <FeedbackState empty emptyTitle="MAP.EXE" emptyMessage="No Regions yet.">
          {null}
        </FeedbackState>
      </div>
    );

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <Window title="MAP.EXE">
        <h1 className="mb-4 font-pixel text-[18px] leading-relaxed text-foreground">
          Choose a Region
        </h1>
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map(({ region, zoneCount, completed, total, percent }) => (
            <li key={region.id}>
              <article className="flex h-full flex-col border-2 border-border bg-window-body shadow-[4px_4px_0_var(--border)]">
                <header className="flex items-center justify-between gap-2 border-b-2 border-border bg-title-bar px-3 py-1">
                  <span className="font-pixel text-[9px] leading-relaxed text-foreground">
                    {region.name}
                  </span>
                </header>
                <div className="flex flex-1 flex-col gap-3 p-3">
                  <div className="flex items-start gap-3">
                    <AvatarOrInitial
                      name={region.name}
                      className="y2k-checker size-16 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      {region.description && (
                        <p className="font-body text-sm font-bold text-foreground">
                          {region.description}
                        </p>
                      )}
                      <p className="mt-2 font-body text-xs font-semibold uppercase text-muted-foreground">
                        {zoneCount} {zoneCount === 1 ? "Zone" : "Zones"} · {percent}% complete
                      </p>
                    </div>
                  </div>
                  <Progress value={completed} max={Math.max(total, 1)} label={`${region.name} progress`} className="mt-auto" />
                  <div>
                    <Link href={`/map/${region.id}`} className="w-full">
                      <Y2kButton className="w-full">ENTER</Y2kButton>
                    </Link>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </Window>
    </div>
  );
}
