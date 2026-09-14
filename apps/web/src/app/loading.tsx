export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      className="flex-1 flex items-center justify-center p-10"
    >
      <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
    </div>
  );
}
