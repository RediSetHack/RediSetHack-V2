import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findNovelResume } from "@/lib/novel-resume";
import { getRegions, getStages, getZones, type Stage } from "@/lib/api-client";
import { Breadcrumb, EmptyState, Progress, StatusChip, Window, Y2kButton } from "@/components/y2k";
import { ErrorAlert } from "@/components/y2k-dialog";

async function loadChapterStages(
  zones: Awaited<ReturnType<typeof getZones>>,
  apiUrl: string,
  token: string,
) {
  return Promise.all(
    zones.map(async (zone) => ({
      zone,
      stages: token ? await getStages(apiUrl, token, zone.id) : [],
    })),
  );
}

export default async function RegionZonesPage({
  params,
}: Readonly<{ params: Promise<{ regionId: string }> }>) {
  const { regionId } = await params;
  const regionIdNumber = Number(regionId);
  if (!Number.isInteger(regionIdNumber)) notFound();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { getToken } = await auth();
  const token = await getToken();
  let region: Awaited<ReturnType<typeof getRegions>>[number] | undefined;
  let zones: Awaited<ReturnType<typeof getZones>> = [];
  let chapterStages: Awaited<ReturnType<typeof loadChapterStages>> = [];
  let loadError = false;
  try {
    const [regions, loadedZones] = await Promise.all([
      getRegions(apiUrl),
      getZones(apiUrl, regionIdNumber),
    ]);
    zones = loadedZones;
    region = regions.find(({ id }) => id === regionIdNumber);
    if (region?.storyIntro && zones.length)
      chapterStages = await loadChapterStages(zones, apiUrl, token ?? "");
  } catch {
    loadError = true;
  }
  if (loadError)
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: "Region" }]} />}>
          <ErrorAlert message="Catalog could not be loaded. Please try again." />
        </Window>
      </div>
    );
  if (!region) notFound();

  if (!region.storyIntro) {
    if (zones.length === 0)
      return (
        <div className="mx-auto w-full max-w-4xl p-6">
          <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: region.name }]} />}>
            <EmptyState title="No Zones in this Region." />
          </Window>
        </div>
      );
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: region.name }]} />}>
          <header className="mb-4">
            <h1 className="font-pixel text-[18px] leading-relaxed text-foreground">
              {region.name}
            </h1>
            {region.description && (
              <p className="mt-2 font-body text-sm font-bold text-muted-foreground">
                {region.description}
              </p>
            )}
          </header>
          <ul className="flex flex-col gap-3">
            {zones.map((zone) => {
              // We don't have per-zone completion counts here from this page's data in current shape;
              // keep structure but show progress placeholder if not available
              return (
                <li key={zone.id}>
                  <article className="border-2 border-border bg-window-body shadow-[4px_4px_0_var(--border)]">
                    <header className="flex items-center justify-between gap-2 border-b-2 border-border bg-title-bar px-3 py-1">
                      <span className="font-pixel text-[9px] leading-relaxed text-foreground">
                        {zone.name}
                      </span>
                    </header>
                    <div className="flex flex-col gap-3 p-3">
                      {zone.description && (
                        <p className="font-body text-sm font-bold text-foreground">
                          {zone.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <Progress value={0} max={100} label="Zone progress" />
                        </div>
                        <Link href={`/map/${regionIdNumber}/${zone.id}`}>
                          <Y2kButton>ENTER</Y2kButton>
                        </Link>
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <Link href="/map">
              <Y2kButton variant="ghost">BACK TO MAP</Y2kButton>
            </Link>
          </div>
        </Window>
      </div>
    );
  }

  const resume = findNovelResume(chapterStages);

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: region.name }]} />}>
        <header className="mb-4">
          <h1 className="font-pixel text-[18px] leading-relaxed text-foreground">
            {region.name}
          </h1>
          {region.storyIntro && (
            <p className="mt-2 font-body text-sm font-bold text-foreground">
              {region.storyIntro}
            </p>
          )}
        </header>
        {resume && (
          <div className="mb-4">
            <Link href={`/map/${regionIdNumber}/${resume.zone.id}/${resume.stage.id}`}>
              <Y2kButton>RESUME: {resume.zone.name} — {resume.stage.title}</Y2kButton>
            </Link>
          </div>
        )}
        <section>
          <h2 className="mb-3 font-pixel text-[12px] leading-relaxed text-foreground">
            Chapters
          </h2>
          {chapterStages.length === 0 ? (
            <EmptyState title="No Zones in this Region." />
          ) : (
            <ol className="flex flex-col gap-3">
              {chapterStages.map(({ zone, stages }) => {
                const completed =
                  stages.length > 0 &&
                  stages.every(({ status }) => status === "completed");
                const chapterResume: Stage | undefined = stages.find(
                  ({ status }) => status === "available",
                );
                const total = stages.length;
                const done = stages.filter(({ status }) => status === "completed").length;
                let chapterChip;
                if (completed) chapterChip = <StatusChip status="completed" />;
                else if (chapterResume) chapterChip = <StatusChip status="unlocked" label="Current" />;
                else chapterChip = <StatusChip status="locked" label="Not started" />;
                return (
                  <li key={zone.id}>
                    <article className="border-2 border-border bg-window-body shadow-[4px_4px_0_var(--border)]">
                      <header className="flex items-center justify-between gap-2 border-b-2 border-border bg-title-bar px-3 py-1">
                        <span className="font-pixel text-[9px] leading-relaxed text-foreground">
                          Chapter {zone.sortOrder}: {zone.name}
                        </span>
                        {chapterChip}
                      </header>
                      <div className="flex flex-col gap-3 p-3">
                        {zone.description && (
                          <p className="font-body text-sm font-bold text-foreground">
                            {zone.description}
                          </p>
                        )}
                        {total > 0 && (
                          <div className="flex items-center gap-2">
                            <Progress value={done} max={total} label="Chapter progress" className="flex-1" />
                            <span className="font-pixel text-[8px] leading-relaxed">
                              {done} / {total}
                            </span>
                          </div>
                        )}
                        <Link href={`/map/${regionIdNumber}/${zone.id}`}>
                          <Y2kButton>OPEN CHAPTER</Y2kButton>
                        </Link>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
        <div className="mt-4">
          <Link href="/map">
            <Y2kButton variant="ghost">BACK TO MAP</Y2kButton>
          </Link>
        </div>
      </Window>
    </div>
  );
}
