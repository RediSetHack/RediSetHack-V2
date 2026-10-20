import { codeToHtml } from "shiki";
import Link from "next/link";
import type { RenderableBlock } from "@/lib/lesson-blocks";
import { Window, Y2kButton } from "@/components/y2k";
import { Y2kAlert } from "@/components/y2k-dialog";

async function highlight(code: string, language: string): Promise<string> {
  try {
    return await codeToHtml(code, {
      lang: language,
      theme: "github-light",
    });
  } catch {
    // Unknown language to the highlighter — fall back to a plain block
    // rather than failing the page over a Stage author's typo.
    return `<pre><code>${code.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</code></pre>`;
  }
}

async function CodeBlockView({
  language,
  content,
}: Readonly<{ language: string; content: string }>) {
  const html = await highlight(content, language);
  return (
    <Window title={language || "code"} actions={null} controls={false}>
      <div className="flex flex-col gap-2">
        <button
          type="button"
          className="self-start border-2 border-border bg-title-bar px-2 py-1 font-pixel text-[8px] leading-relaxed shadow-[2px_2px_0_var(--border)]"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(content);
            } catch {
              // ignore
            }
          }}
        >
          COPY
        </button>
        <figure className="overflow-x-auto border-2 border-border bg-white [&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:p-3 [&_pre]:text-sm">
          <figcaption className="sr-only">Code block, {language}</figcaption>
          {/* Shiki's own output is the highlighted markup; there is no learner
            input in this path — content comes from the admin-authored Lesson. */}
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </figure>
      </div>
    </Window>
  );
}

function TextBlockView({ content }: Readonly<{ content: string }>) {
  return (
    <Window title="TEXT">
      <p className="whitespace-pre-wrap font-body text-sm font-bold leading-relaxed text-foreground">{content}</p>
    </Window>
  );
}

function ExerciseBlockView({
  prompt,
  language,
  starterCode,
  activityId,
}: Readonly<{
  prompt: string;
  language: string;
  starterCode: string;
  activityId?: number;
}>) {
  const codelabHref =
    activityId === undefined
      ? `/codelab?language=${encodeURIComponent(language)}&code=${encodeURIComponent(starterCode)}`
      : `/codelab?activity=${activityId}`;

  return (
    <Window title="EXERCISE">
      <div className="flex flex-col gap-3">
        <p className="font-body text-sm font-bold text-foreground">{prompt}</p>
        <div>
          <CodeBlockView language={language} content={starterCode} />
        </div>
        <div>
          <Link href={codelabHref}>
            <Y2kButton>OPEN IN CODELAB</Y2kButton>
          </Link>
        </div>
      </div>
    </Window>
  );
}

function ImageBlockView({
  url,
  alt,
  caption,
}: Readonly<{ url: string; alt: string; caption?: string }>) {
  return (
    <Window title="IMAGE">
      <figure className="space-y-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="h-auto max-w-full border-2 border-border" />
        {caption ? (
          <figcaption className="font-body text-sm font-bold text-muted-foreground">
            {caption}
          </figcaption>
        ) : null}
      </figure>
    </Window>
  );
}

function UnsupportedBlockView({ type }: Readonly<{ type: string }>) {
  void type;
  return (
    <Y2kAlert
      open={true}
      onOpenChange={() => {}}
      title="UNSUPPORTED"
      icon="info"
    >
      This content type isn&apos;t supported yet.
    </Y2kAlert>
  );
}

/**
 * The one generic Lesson renderer: it switches over the block union and
 * dispatches to a component per block type. No per-Stage components are
 * ever written — a new Stage's content is just new block data.
 */
export function LessonBlockView({
  block,
}: Readonly<{ block: RenderableBlock }>) {
  switch (block.kind) {
    case "text":
      return <TextBlockView content={block.content} />;
    case "code":
      return (
        <CodeBlockView language={block.language} content={block.content} />
      );
    case "exercise":
      return (
        <ExerciseBlockView
          prompt={block.prompt}
          language={block.language}
          starterCode={block.starterCode}
          activityId={block.activityId}
        />
      );
    case "image":
      return (
        <ImageBlockView
          url={block.url}
          alt={block.alt}
          caption={block.caption}
        />
      );
    default:
      return <UnsupportedBlockView type={(block as { type: string }).type} />;
  }
}
