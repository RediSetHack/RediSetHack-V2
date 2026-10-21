import { FeedbackState } from "@/components/y2k-dialog";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-10">
      <FeedbackState
        loading
        loadingTitle="LEADERBOARD.EXE"
        loadingLabel="Loading Leaderboard"
      >
        {null}
      </FeedbackState>
    </div>
  );
}
