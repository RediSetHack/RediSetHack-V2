import { CodelabEditor } from "@/components/codelab-editor";

// The parent (app)/layout.tsx already redirects unauthenticated learners to
// /sign-in before this page renders, so the execution endpoint is never
// reachable from a signed-out session.
export default async function CodelabPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ language?: string; code?: string }>;
}>) {
  const params = await searchParams;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  return (
    <div className="flex-1 mx-auto w-full max-w-4xl p-6 sm:p-10">
      <CodelabEditor
        apiUrl={apiUrl}
        initialLanguage={params.language}
        initialCode={params.code}
      />
    </div>
  );
}