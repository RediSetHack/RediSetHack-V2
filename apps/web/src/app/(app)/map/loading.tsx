import { SkeletonWindow } from "@/components/y2k";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <SkeletonWindow title="MAP.EXE" label="Loading Regions" />
    </div>
  );
}
