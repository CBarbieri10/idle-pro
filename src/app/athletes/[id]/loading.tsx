import { User, Sparkles } from "lucide-react";

export default function AthleteLoading() {
  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-pulse">
      {/* Hero Header Skeleton */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-[#101726]/80 via-[#0a0e18]/80 to-[#0e1622]/80 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
              <User className="h-10 w-10 text-white/20" />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="h-5 w-24 bg-emerald-500/20 rounded-full" />
                <div className="h-5 w-20 bg-white/10 rounded-full" />
              </div>
              <div className="h-8 w-60 bg-white/15 rounded-xl" />
              <div className="h-4 w-40 bg-white/10 rounded-md" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 w-32 bg-white/10 rounded-xl" />
            <div className="h-10 w-48 bg-emerald-500/20 rounded-xl" />
          </div>
        </div>

        {/* Quick Stats Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-white/5 bg-white/[0.02] p-3 space-y-2">
              <div className="h-3 w-16 bg-white/10 rounded" />
              <div className="h-6 w-12 bg-white/15 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-10 w-32 bg-white/5 rounded-xl border border-white/5 shrink-0" />
        ))}
      </div>

      {/* Main Charts & Analytics Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-[#0c1018]/60 p-6 h-80 flex flex-col justify-between">
          <div className="h-5 w-40 bg-white/10 rounded" />
          <div className="h-44 w-44 mx-auto rounded-full border-4 border-white/5 flex items-center justify-center">
            <Sparkles className="h-8 w-8 text-white/10" />
          </div>
          <div className="h-3 w-28 mx-auto bg-white/5 rounded" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#0c1018]/60 p-6 h-80 flex flex-col justify-between">
          <div className="h-5 w-48 bg-white/10 rounded" />
          <div className="h-48 w-full bg-emerald-950/20 rounded-xl border border-emerald-500/10" />
        </div>
      </div>

      {/* Video Clips Section Skeleton */}
      <div className="rounded-2xl border border-emerald-500/10 bg-[#0c1018]/60 p-6 space-y-4">
        <div className="h-5 w-52 bg-white/10 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="aspect-video bg-white/5 rounded-xl border border-white/5" />
          ))}
        </div>
      </div>
    </div>
  );
}
