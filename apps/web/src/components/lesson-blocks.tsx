import { codeToHtml } from "shiki";
import Link from "next/link";
import type { RenderableBlock } from "@/lib/lesson-blocks";

async function highlight(code: string, language: string): Promise<string> {
  try {
    return await codeToHtml(code, {
      lang: language,
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
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
    <figure className="[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border/60 [&_pre]:p-4 [&_pre]:text-sm">
      <figcaption className="sr-only">Code block, {language}</figcaption>
      {/* Shiki's own output is the highlighted markup; there is no learner
        input in this path — content comes from the admin-authored Lesson. */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </figure>
  );
}

function TextBlockView({ content }: Readonly<{ content: string }>) {
  return <p className="whitespace-pre-wrap leading-relaxed">{content}</p>;
}

function ExerciseBlockView({
  prompt,
  language,
  starterCode,
}: Readonly<{ prompt: string; language: string; starterCode: string }>) {
  const codelabHref = `/codelab?language=${encodeURIComponent(language)}&code=${encodeURIComponent(starterCode)}`;

  return (
    <div className="rounded-md border border-border/60 p-4">
      <p className="font-medium">{prompt}</p>
      <div className="mt-3">
        <CodeBlockView language={language} content={starterCode} />
      </div>
      <p className="mt-3">
        <Link
          href={codelabHref}
          className="text-sm font-medium text-primary underline-offset-4 hover:underline"
        >
          Open in Codelab
        </Link>
      </p>
    </div>
  );
}

function UnsupportedBlockView({ type }: Readonly<{ type: string }>) {
  return (
    <p className="rounded-md border border-dashed border-border/60 p-4 text-sm text-muted-foreground">
      This Lesson includes a &ldquo;{type}&rdquo; block this version of the app can&rsquo;t
      display yet.
    </p>
  );
}

/**
 * The one generic Lesson renderer: it switches over the block union and
 * dispatches to a component per block type. No per-Stage components are
 * ever written — a new Stage's content is just new block data.
 */
export function LessonBlockView({ block }: Readonly<{ block: RenderableBlock }>) {
  switch (block.kind) {
    case "text":
      return <TextBlockView content={block.content} />;
    case "code":
      return <CodeBlockView language={block.language} content={block.content} />;
    case "exercise":
      return (
        <ExerciseBlockView
          prompt={block.prompt}
          language={block.language}
          starterCode={block.starterCode}
        />
      );
    default:
      return <UnsupportedBlockView type={block.type} />;
  }
}
