export default function Loading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="skeleton h-9 w-64" />
      <div className="skeleton h-72 w-full rounded-2xl" />
      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <div className="skeleton h-80 rounded-2xl" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}
