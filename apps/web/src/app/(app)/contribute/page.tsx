import { auth } from "@clerk/nextjs/server";
import { ContributorDrafts } from "@/components/contributor-drafts";
import { ApiError, getContributorDrafts, type ContributorDraftItem } from "@/lib/api-client";
import { Window } from "@/components/y2k";

export default async function ContributePage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const { getToken } = await auth();
  const token = (await getToken()) ?? "";

  let drafts: ContributorDraftItem[] | null = null;
  let denied = false;
  try {
    drafts = await getContributorDrafts(apiUrl, token);
  } catch (error) {
    denied = error instanceof ApiError && error.status === 403;
  }

  return (
    <div className="flex-1 mx-auto w-full max-w-5xl p-6 sm:p-10 space-y-6">
      <Window title="CONTRIBUTE.EXE">
        {denied ? (
          <p role="alert" className="font-body text-sm font-bold text-muted-foreground">Only approved contributors can write drafts.</p>
        ) : drafts === null ? (
          <p role="alert" className="font-body text-sm font-bold text-btn-danger">Could not load your drafts.</p>
        ) : (
          <ContributorDrafts apiUrl={apiUrl} initial={drafts} />
        )}
      </Window>
    </div>
  );
}
