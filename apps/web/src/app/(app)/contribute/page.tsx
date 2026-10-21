import { auth } from "@clerk/nextjs/server";
import {
  ContributorAccessDenied,
  ContributorDrafts,
} from "@/components/contributor-drafts";
import { ApiError, getContributorDrafts, type ContributorDraftItem } from "@/lib/api-client";
import { Breadcrumb, Sparkle, Window } from "@/components/y2k";
import { FeedbackState } from "@/components/y2k-dialog";

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
    <div className="mx-auto w-full max-w-5xl flex-1 space-y-6 p-6 sm:p-10">
      <Window title={<Breadcrumb items={[{ label: "CONTRIBUTE" }]} />}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-pixel text-xl leading-relaxed text-foreground">
              Contribute
            </h1>
            <p className="mt-2 font-body text-sm font-bold text-muted-foreground">
              Draft a Stage, send it for review, and publish it for learners.
            </p>
          </div>
          <Sparkle size={20} />
        </div>
      </Window>

      {denied ? (
        <ContributorAccessDenied />
      ) : drafts === null ? (
        <FeedbackState
          error
          errorMessage="Your drafts could not be loaded. Please try again later."
        >
          {null}
        </FeedbackState>
      ) : (
        <ContributorDrafts apiUrl={apiUrl} initial={drafts} />
      )}
    </div>
  );
}
