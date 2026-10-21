import { FeedbackState } from "@/components/y2k-dialog";

export default function ContributeLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-10">
      <FeedbackState
        loading
        loadingTitle="CONTRIBUTE.EXE"
        loadingLabel="Loading Drafts"
      >
        {null}
      </FeedbackState>
    </div>
  );
}
