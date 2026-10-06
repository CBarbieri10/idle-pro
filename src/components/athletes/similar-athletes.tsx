"use client";

import React from "react";
import Link from "next/link";
import { type Position } from "@prisma/client";
import { Shield, Sparkles, ArrowRight } from "lucide-react";
import { POSITION_LABELS, formatHeight, formatAge } from "@/lib/domain";
import { cn } from "@/lib/utils";

export interface SimilarAthleteItem {
  id: string;
  name: string;
  position: Position;
  birthDate: Date | string | null;
  nationality: string | null;
  height: number | null;
  photoUrl: string | null;
  photoHasAlpha: boolean;
  team: {
    id: string;
    name: string;
  };
  similarityScore: number; // e.g. 88
}

interface SimilarAthletesProps {
  athletes: SimilarAthleteItem[];
  currentPositionName: string;
}

export function SimilarAthletes({ athletes, currentPositionName }: SimilarAthletesProps) {
  if (athletes.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[#1e2638] bg-[#0c0f17] p-4 text-white shadow-xl">
      <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#1e2638]">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-[#00e676]/20 border border-[#00e676]/40 flex items-center justify-center text-[#00e676]">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-black uppercase tracking-wider text-white">
            Jogadores Similares ({currentPositionName})
          </span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500">
          Match de DNA tático
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {athletes.map((ath) => {
          const initials = ath.name
            .split(" ")
            .map((n) => n[0])
            .slice(0, 2)
            .join("")
            .toUpperCase();

          return (
            <Link
              key={ath.id}
              href={`/athletes/${ath.id}`}
              className="group flex flex-col items-center rounded-xl border border-[#1e2638] bg-[#121622] p-3 transition-all hover:border-[#00e676]/60 hover:bg-[#161c2c] hover:shadow-lg text-center"
            >
              {/* Circular Avatar with Glowing Border */}
              <div className="relative mb-2">
                <div className="h-16 w-16 rounded-full border-2 border-[#00e676]/70 p-0.5 bg-black/40 overflow-hidden shadow-[0_0_12px_rgba(0,230,118,0.25)] flex items-center justify-center">
                  {ath.photoUrl ? (
                    <img
                      src={ath.photoUrl}
                      alt={ath.name}
                      className={cn(
                        "h-full w-full rounded-full object-cover",
                        ath.photoHasAlpha && "object-contain"
                      )}
                    />
                  ) : (
                    <span className="text-sm font-black text-[#00e676] font-mono">
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              {/* Similarity Percentage Pill (BeSoccer Pro Model) */}
              <span className="mb-2 inline-flex items-center rounded-full bg-[#00e676] px-2.5 py-0.5 text-[11px] font-black font-mono text-black shadow-xs">
                {ath.similarityScore}%
              </span>

              {/* Name & Club */}
              <h4 className="font-black text-xs text-white group-hover:text-[#00e676] transition-colors truncate max-w-full">
                {ath.name}
              </h4>
              <p className="text-[10px] text-zinc-400 truncate max-w-full mt-0.5 flex items-center justify-center gap-1">
                <Shield className="h-2.5 w-2.5 text-indigo-400" />
                {ath.team.name}
              </p>

              {/* Physical details */}
              <div className="mt-2 flex items-center justify-center gap-2 border-t border-[#1e2638] pt-1.5 text-[10px] font-mono text-zinc-400 w-full">
                <span>{ath.birthDate ? formatAge(new Date(ath.birthDate)) : "—"}</span>
                <span>&bull;</span>
                <span>{formatHeight(ath.height)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
