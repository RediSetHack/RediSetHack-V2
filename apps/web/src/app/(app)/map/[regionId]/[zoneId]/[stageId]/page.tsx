import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonBlockView } from "@/components/lesson-blocks";
import { StageCompletion } from "@/components/stage-completion";
import { ApiError, getLesson, getRegions, getStages, getZones, type Lesson } from "@/lib/api-client";
import { normalizeLessonBlocks } from "@/lib/lesson-blocks";
import { Breadcrumb, StatusChip, Window, XPChip, Y2kButton } from "@/components/y2k";
import { Y2kAlert } from "@/components/y2k-dialog";

export default async function StagePage({
  params,
}: Readonly<{
  params: Promise<{ regionId: string; zoneId: string; stageId: string }>;
}>) {
  const { regionId, zoneId, stageId } = await params;
  const stageIdNumber = Number(stageId);
  const zoneIdNumber = Number(zoneId);
  const regionIdNumber = Number(regionId);
  if (!Number.isInteger(stageIdNumber) || !Number.isInteger(zoneIdNumber) || !Number.isInteger(regionIdNumber)) {
    notFound();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { getToken } = await auth();
  const token = await getToken();

  let lesson: Lesson;
  let regionName = "";
  let zoneName = "";
  try {
    const [regions, zones] = await Promise.all([
      getRegions(apiUrl),
      getZones(apiUrl, regionIdNumber),
    ]);
    regionName = regions.find((r) => r.id === regionIdNumber)?.name ?? "";
    zoneName = zones.find((z) => z.id === zoneIdNumber)?.name ?? "";
  } catch {
    // non-fatal for breadcrumb
  }

  try {
    lesson = await getLesson(apiUrl, token ?? "", stageIdNumber);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof ApiError && error.status === 403) {
      return (
        <div className="mx-auto w-full max-w-4xl p-6">
          <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: regionName }, { label: zoneName }, { label: "Stage" }]} />}>
            <Y2kAlert
              open={true}
              onOpenChange={() => {}}
              title="LOCKED"
              icon="info"
              actions={
                <Link href={`/map/${regionIdNumber}/${zoneIdNumber}`}>
                  <Y2kButton>BACK TO ZONE</Y2kButton>
                </Link>
              }
            >
              {error.message}
            </Y2kAlert>
          </Window>
        </div>
      );
    }
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: regionName }, { label: zoneName }, { label: "Stage" }]} />}>
          <p role="alert" className="font-body text-sm font-bold text-btn-danger">
            The Lesson could not be loaded. Please try again.
          </p>
        </Window>
      </div>
    );
  }

  const blocks = normalizeLessonBlocks(lesson.blocks);

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <Window title={<Breadcrumb items={[{ label: "MAP", href: "/map" }, { label: regionName }, { label: zoneName }, { label: lesson.title }]} />}>
        <header className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="font-pixel text-[18px] leading-relaxed text-foreground">
            {lesson.title}
          </h1>
          <XPChip xp={lesson.xpReward} />
          {lesson.status === "completed" && <StatusChip status="completed" />}
          {lesson.status === "available" && <StatusChip status="unlocked" />}
          {(lesson.status as string) === "locked" && <StatusChip status="locked" />}
        </header>
        {(lesson.competencies?.length || lesson.difficulty) && (
          <section aria-label="Learning objectives" className="mb-4 border-2 border-dashed border-border bg-window-body p-4 shadow-[2px_2px_0_var(--border)]">
            <p className="font-pixel text-[9px] leading-relaxed text-foreground">LEARNING OBJECTIVES</p>
            {lesson.difficulty && <p className="mt-2 font-body text-sm font-bold text-foreground">Difficulty: {lesson.difficulty}</p>}
            {lesson.competencies && lesson.competencies.length > 0 && (
              <ul className="mt-2 list-disc pl-5 font-body text-sm font-bold text-muted-foreground">
                {lesson.competencies.map((competency) => <li key={competency.id}>{competency.objective}</li>)}
              </ul>
            )}
          </section>
        )}
        <div className="flex flex-col gap-6">
          {blocks.map((block) => (
            <LessonBlockView key={`${block.kind}:${JSON.stringify(block)}`} block={block} />
          ))}
        </div>
        <StageCompletion
          stageId={stageIdNumber}
          apiUrl={apiUrl}
          completed={lesson.status === "completed"}
          zonePath={`/map/${regionIdNumber}/${zoneIdNumber}`}
        />
      </Window>
    </div>
  );
}
