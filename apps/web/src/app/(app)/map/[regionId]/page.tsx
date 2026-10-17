import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRegions, getStages, getZones, type Stage } from "@/lib/api-client";

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
  let chapterStages: Awaited<ReturnType<typeof loadChapterStages>> = [];
  let loadError = false;
  try {
    const [regions, zones] = await Promise.all([
      getRegions(apiUrl),
      getZones(apiUrl, regionIdNumber),
    ]);
    region = regions.find(({ id }) => id === regionIdNumber);
    if (region && zones.length)
      chapterStages = await loadChapterStages(zones, apiUrl, token ?? "");
  } catch {
    loadError = true;
  }
  if (loadError)
    return (
      <p role="alert" className="p-6 text-destructive">
        Catalog could not be loaded. Please try again.
      </p>
    );
  if (!region) notFound();
  const resume = chapterStages
    .flatMap(({ zone, stages }) => stages.map((stage) => ({ zone, stage })))
    .find(({ stage }) => stage.status === "available");

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-bold tracking-tight">
        {region.storyIntro ? `Novel: ${region.name}` : region.name}
      </h1>
      {region.storyIntro && (
        <p className="mt-3 text-muted-foreground">{region.storyIntro}</p>
      )}
      {resume && (
        <Link
          className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-primary-foreground"
          href={`/map/${regionIdNumber}/${resume.zone.id}/${resume.stage.id}`}
        >
          Resume: {resume.zone.name} — {resume.stage.title}
        </Link>
      )}
      <h2 className="mt-8 text-lg font-semibold">
        {region.storyIntro ? "Chapters" : "Zones"}
      </h2>
      {chapterStages.length === 0 ? (
        <p className="mt-4 text-muted-foreground">
          This Region has no Zones yet — check back soon.
        </p>
      ) : (
        <ol className="mt-4 flex flex-col gap-3">
          {chapterStages.map(({ zone, stages }) => {
            const completed =
              stages.length > 0 &&
              stages.every(({ status }) => status === "completed");
            const chapterResume: Stage | undefined = stages.find(
              ({ status }) => status === "available",
            );
            return (
              <li
                className="rounded-md border border-border/60 p-4"
                key={zone.id}
              >
                <h3 className="font-medium">
                  {region.storyIntro
                    ? `Chapter ${zone.sortOrder}: ${zone.name}`
                    : zone.name}
                </h3>
                {zone.description && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {zone.description}
                  </p>
                )}
                <p className="mt-2 text-sm" aria-live="polite">
                  {completed
                    ? "Completed"
                    : chapterResume
                      ? `Current encounter: ${chapterResume.title}`
                      : "Not started"}
                </p>
                <Link
                  className="mt-2 inline-block text-sm text-primary underline"
                  href={`/map/${regionIdNumber}/${zone.id}`}
                >
                  Open {region.storyIntro ? "chapter" : "Zone"}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
