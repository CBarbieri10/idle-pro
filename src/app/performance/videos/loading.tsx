import { Film } from "lucide-react";

export default function VideosLoading() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-pulse">
      {/* Hero Header Skeleton */}
      <div className="rounded-3xl border border-white/10 bg-card/60 p-6 sm:p-8 space-y-4">
        <div className="h-6 w-36 bg-emerald-500/20 rounded-full" />
        <div className="h-10 w-80 bg-white/10 rounded-xl" />
        <div className="h-4 w-full max-w-xl bg-white/5 rounded-md" />
      </div>

      {/* Filter Bar Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-card/60 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-10 flex-1 bg-white/5 rounded-xl" />
          <div className="h-10 w-52 bg-white/5 rounded-xl" />
        </div>
        <div className="flex gap-2 pt-2 border-t border-white/5">
          <div className="h-7 w-20 bg-white/10 rounded-xl" />
          <div className="h-7 w-24 bg-white/5 rounded-xl" />
          <div className="h-7 w-28 bg-white/5 rounded-xl" />
          <div className="h-7 w-24 bg-white/5 rounded-xl" />
        </div>
      </div>

      {/* Video Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-card/50 overflow-hidden flex flex-col justify-between"
          >
            <div className="aspect-video w-full bg-white/5 relative flex items-center justify-center">
              <Film className="h-8 w-8 text-white/10" />
            </div>
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 bg-white/10 rounded" />
              <div className="h-3 w-1/2 bg-white/5 rounded" />
              <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-lg bg-white/10" />
                  <div className="h-3 w-20 bg-white/5 rounded" />
                </div>
                <div className="h-3 w-12 bg-white/10 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
