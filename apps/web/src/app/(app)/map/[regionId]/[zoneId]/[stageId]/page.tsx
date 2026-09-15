import { auth } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { LessonBlockView } from "@/components/lesson-blocks";
import { ApiError, getLesson, type Lesson } from "@/lib/api-client";
import { normalizeLessonBlocks } from "@/lib/lesson-blocks";

export default async function StagePage({
  params,
}: Readonly<{
  params: Promise<{ regionId: string; zoneId: string; stageId: string }>;
}>) {
  const { stageId } = await params;
  const stageIdNumber = Number(stageId);
  if (!Number.isInteger(stageIdNumber)) {
    notFound();
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { getToken } = await auth();
  const token = await getToken();

  let lesson: Lesson;
  try {
    lesson = await getLesson(apiUrl, token ?? "", stageIdNumber);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    if (error instanceof ApiError && error.status === 403) {
      return (
        <p role="status" className="p-6 text-muted-foreground">
          This Stage is locked — finish the Stage before it to unlock the Lesson.
        </p>
      );
    }
    return (
      <p role="alert" className="p-6 text-destructive">
        The Lesson could not be loaded. Please try again.
      </p>
    );
  }

  const blocks = normalizeLessonBlocks(lesson.blocks);

  return (
    <div className="mx-auto w-full max-w-3xl p-6">
      <h1 className="text-2xl font-bold tracking-tight">{lesson.title}</h1>
      <p className="text-sm text-muted-foreground">{lesson.xpReward} XP</p>
      <div className="mt-6 flex flex-col gap-6">
        {blocks.map((block, index) => (
          // Blocks carry no id of their own; position is stable within a
          // Stage's fixed content array.
          <LessonBlockView key={index} block={block} />
        ))}
      </div>
    </div>
  );
}
