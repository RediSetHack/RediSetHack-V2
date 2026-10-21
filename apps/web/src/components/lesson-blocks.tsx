import { codeToHtml } from "shiki";
import Link from "next/link";
import type { RenderableBlock } from "@/lib/lesson-blocks";
import { Window, Y2kButton } from "@/components/y2k";
import {
  CopyButton,
  ImageWithFallback,
  UnsupportedBlockDialog,
} from "@/components/lesson-block-islands";

async function highlight(code: string, language: string): Promise<string> {
  try {
    return await codeToHtml(code, {
      lang: language,
      theme: "css-variables",
    });
  } catch {
    // Unknown language to the highlighter — fall back to a plain block
    // rather than failing the page over a Stage author's typo.
    return `<pre><code>${code.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</code></pre>`;
  }
}

/**
 * Highlighting is async, so the code/exercise Branch functions are plain async
 * functions returning JSX rather than async Components. React's static renderer
 * cannot resolve an async Component passed as an element type, so the renderer
 * `await`s these directly.
 */
async function codeBlock(
  language: string,
  content: string,
  title?: string,
) {
  const html = await highlight(content, language);
  return (
    <Window
      title={title ?? (language || "code")}
      actions={title === undefined ? <CopyButton content={content} /> : null}
      controls={false}
    >
      <figure className="overflow-x-auto border-2 border-border bg-white [&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:p-3 [&_pre]:text-sm">
        <figcaption className="sr-only">Code block, {language}</figcaption>
        {/* Shiki's own output is the highlighted markup; there is no learner
          input in this path — content comes from the admin-authored Lesson. */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </figure>
    </Window>
  );
}

async function exerciseBlock(
  prompt: string,
  language: string,
  starterCode: string,
  activityId?: number,
) {
  const codelabHref =
    activityId === undefined
      ? `/codelab?language=${encodeURIComponent(language)}&code=${encodeURIComponent(starterCode)}`
      : `/codelab?activity=${activityId}`;

  return (
    <Window title="EXERCISE">
      <div className="flex flex-col gap-3">
        <p className="font-body text-sm font-bold text-foreground">{prompt}</p>
        {await codeBlock(language, starterCode, "STARTER CODE")}
        <Link href={codelabHref}>
          <Y2kButton>OPEN IN CODELAB</Y2kButton>
        </Link>
      </div>
    </Window>
  );
}

function textBlock(content: string) {
  return (
    <Window title="TEXT">
      <p className="whitespace-pre-wrap font-body text-sm font-bold leading-relaxed text-foreground">{content}</p>
    </Window>
  );
}

function imageBlock(url: string, alt: string, caption?: string) {
  return (
    <Window title="IMAGE">
      <figure className="space-y-2">
        <ImageWithFallback url={url} alt={alt} />
        {caption ? (
          <figcaption className="font-body text-sm font-bold text-muted-foreground">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </Window>
  );
}

/**
 * The one generic Lesson renderer: it switches over the block union and
 * dispatches to a placeholder per block type. No per-Stage components are
 * ever written — a new Stage's content is just new block data.
 */
export async function renderLessonBlock(block: RenderableBlock) {
  switch (block.kind) {
    case "text":
      return textBlock(block.content);
    case "code":
      return await codeBlock(block.language, block.content);
    case "exercise":
      return await exerciseBlock(
        block.prompt,
        block.language,
        block.starterCode,
        block.activityId,
      );
    case "image":
      return imageBlock(block.url, block.alt, block.caption);
    default:
      return <UnsupportedBlockDialog />;
  }
}
