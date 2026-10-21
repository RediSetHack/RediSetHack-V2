import { FeedbackState } from "@/components/y2k-dialog";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <FeedbackState loading loadingTitle="MAP.EXE" loadingLabel="Loading Stages">
        {null}
      </FeedbackState>
    </div>
  );
}
