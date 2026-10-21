import { FeedbackState } from "@/components/y2k-dialog";

export default function CtfLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl p-6 sm:p-10">
      <FeedbackState loading loadingTitle="CTF.EXE" loadingLabel="Loading Challenges">
        {null}
      </FeedbackState>
    </div>
  );
}
