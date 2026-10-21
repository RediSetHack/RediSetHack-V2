import { FeedbackState } from "@/components/y2k-dialog";

export default function SideQuestsLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-10">
      <FeedbackState
        loading
        loadingTitle="SIDE-QUESTS.EXE"
        loadingLabel="Loading Side Quests"
      >
        {null}
      </FeedbackState>
    </div>
  );
}
