export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col items-center justify-center space-y-4 py-16">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-800 border-t-amber-500" />
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Loading ABCD of JNVST...
        </p>
      </div>
    </div>
  );
}
