"use client";

import { useEffect, useState, type ReactNode } from "react";
import { renderLessonBlock } from "@/components/lesson-blocks";
import { normalizeLessonBlocks } from "@/lib/lesson-blocks";
import type { ReviewQueueItem } from "@/lib/api-client";

/** The Lesson through the learner block renderer, so a reviewer sees what learners will. */
export function ReviewLesson({ blocks }: Readonly<{ blocks: ReviewQueueItem["lessonContent"] }>) {
  const [views, setViews] = useState<ReactNode[] | null>(null);

  const valid = Array.isArray(blocks);

  useEffect(() => {
    if (!valid) return;
    let cancelled = false;
    void Promise.all(normalizeLessonBlocks(blocks).map(renderLessonBlock))
      .then((rendered) => {
        if (!cancelled) setViews(rendered);
      })
      .catch(() => {
        if (!cancelled) setViews([<p key="error" role="alert" className="font-body text-sm font-bold text-btn-danger">Could not render this Lesson.</p>]);
      });
    return () => {
      cancelled = true;
    };
  }, [blocks, valid]);

  if (!valid) return <p role="alert" className="font-body text-sm font-bold text-btn-danger">Could not render this Lesson.</p>;
  if (blocks.length === 0) {
    return <p className="font-body text-sm text-muted-foreground">This revision has no Lesson blocks.</p>;
  }
  if (!views) return <output className="font-body text-sm text-muted-foreground">Rendering Lesson…</output>;
  return (
    <div className="flex flex-col gap-3">
      {views.map((view, index) => (
        // Rendered views carry no identity of their own; the list is rebuilt wholesale, never reordered.
        <div key={index}>{view}</div>
      ))}
    </div>
  );
}
