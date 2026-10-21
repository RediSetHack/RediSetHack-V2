import { FeedbackState } from "@/components/y2k-dialog";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-2xl p-6 sm:p-10">
      <FeedbackState loading loadingTitle="RESULT" loadingLabel="Loading Result">
        {null}
      </FeedbackState>
    </div>
  );
}
