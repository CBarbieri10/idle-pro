"use client";

import React from "react";
import { type Position, type FootPreference } from "@prisma/client";
import { FOOT_LABELS, formatHeight, formatWeight } from "@/lib/domain";
import { Flame, Clock, Trophy, ShieldAlert, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface TacticalPitchHeatmapProps {
  position: Position;
  athleteName: string;
  totalMatches: number;
  totalMinutes: number;
  goals?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  age?: number | string | null;
  height?: number | null;
  weight?: number | null;
  footPreference?: FootPreference;
  variant?: "dark" | "editorial";
  showBiometrics?: boolean;
  className?: string;
}

export function TacticalPitchHeatmap({
  position,
  athleteName,
  totalMatches,
  totalMinutes,
  goals = 0,
  assists = 0,
  yellowCards = 0,
  redCards = 0,
  age,
  height,
  weight,
  footPreference = "RIGHT",
  variant = "dark",
  showBiometrics = true,
  className,
}: TacticalPitchHeatmapProps) {
  const isEditorial = variant === "editorial";

  // Determine heatmap gradient positions based on tactical role
  const isRightSide = position === "RIGHT_WING" || position === "RIGHT_BACK";
  const isLeftSide = position === "LEFT_WING" || position === "LEFT_BACK";
  const isAttacker =
    position === "STRIKER" ||
    position === "FORWARD" ||
    position === "RIGHT_WING" ||
    position === "LEFT_WING";
  const isDefender =
    position === "CENTER_BACK" ||
    position === "LEFT_BACK" ||
    position === "RIGHT_BACK";
  const isMidfielder =
    position === "CENTRAL_MID" ||
    position === "DEFENSIVE_MID" ||
    position === "ATTACKING_MID";
  const isGoalkeeper = position === "GOALKEEPER";

  // Coordinates on a 200 x 300 pitch (attacking upwards: top is opponent goal, bottom is own goal)
  // [cx, cy, r, intensity]
  const heatPoints = React.useMemo(() => {
    if (isRightSide) {
      return [
        { cx: 160, cy: 90, rx: 32, ry: 45, opacity: 0.85 }, // High heat right attacking flank
        { cx: 140, cy: 65, rx: 28, ry: 30, opacity: 0.90 }, // Cutting into box
        { cx: 165, cy: 150, rx: 25, ry: 40, opacity: 0.65 }, // Right mid progression
        { cx: 120, cy: 75, rx: 22, ry: 25, opacity: 0.70 }, // Penalty box half-space
      ];
    }
    if (isLeftSide) {
      return [
        { cx: 40, cy: 90, rx: 32, ry: 45, opacity: 0.85 },
        { cx: 60, cy: 65, rx: 28, ry: 30, opacity: 0.90 },
        { cx: 35, cy: 150, rx: 25, ry: 40, opacity: 0.65 },
        { cx: 80, cy: 75, rx: 22, ry: 25, opacity: 0.70 },
      ];
    }
    if (isDefender) {
      return [
        { cx: 100, cy: 230, rx: 45, ry: 35, opacity: 0.85 }, // Defensive third
        { cx: 80, cy: 210, rx: 35, ry: 30, opacity: 0.75 },
        { cx: 120, cy: 210, rx: 35, ry: 30, opacity: 0.75 },
        { cx: 100, cy: 180, rx: 30, ry: 25, opacity: 0.50 },
      ];
    }
    if (isMidfielder) {
      return [
        { cx: 100, cy: 150, rx: 45, ry: 40, opacity: 0.85 }, // Central circle engine
        { cx: 120, cy: 130, rx: 35, ry: 35, opacity: 0.75 },
        { cx: 80, cy: 170, rx: 35, ry: 35, opacity: 0.75 },
        { cx: 100, cy: 100, rx: 28, ry: 25, opacity: 0.60 },
      ];
    }
    if (isGoalkeeper) {
      return [
        { cx: 100, cy: 275, rx: 35, ry: 18, opacity: 0.90 },
      ];
    }
    // Default striker
    return [
      { cx: 100, cy: 65, rx: 40, ry: 30, opacity: 0.90 },
      { cx: 90, cy: 95, rx: 35, ry: 35, opacity: 0.75 },
      { cx: 120, cy: 80, rx: 25, ry: 25, opacity: 0.70 },
    ];
  }, [isRightSide, isLeftSide, isDefender, isMidfielder, isGoalkeeper]);

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-4 shadow-xl select-none",
        isEditorial
          ? "border-zinc-200 bg-white text-zinc-950 shadow-sm print:shadow-none print:border-zinc-300"
          : "border-[#1e2638] bg-[#0c0f17] text-white",
        className
      )}
      style={{
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* Pitch Header */}
      <div
        className={cn(
          "flex items-center justify-between pb-2 mb-3 border-b",
          isEditorial ? "border-zinc-200" : "border-[#1e2638]"
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-6 w-6 rounded border flex items-center justify-center",
              isEditorial
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-[#00e676]/20 border-[#00e676]/40 text-[#00e676]"
            )}
          >
            <Flame className="h-3.5 w-3.5" />
          </div>
          <span
            className={cn(
              "text-xs font-black uppercase tracking-wider",
              isEditorial ? "text-zinc-950 font-sans" : "text-white"
            )}
          >
            Mapa de Calor &amp; Ocupação Tática
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono",
            isEditorial
              ? "text-emerald-800 bg-emerald-50 border-emerald-200"
              : "text-[#00e676] bg-[#00e676]/10 border-[#00e676]/30"
          )}
        >
          Ataque &uarr;
        </span>
      </div>

      {/* The Football Pitch with Heatmap */}
      <div
        className={cn(
          "relative mx-auto w-full max-w-[260px] aspect-[2/3] rounded-xl overflow-hidden select-none border",
          isEditorial
            ? "border-zinc-300 shadow-md"
            : "pitch-canvas border-white/20"
        )}
        style={
          isEditorial
            ? {
                background: "radial-gradient(circle at 50% 50%, #175438 0%, #0c3321 100%)",
                boxShadow: "inset 0 0 25px rgba(0, 0, 0, 0.6), 0 4px 12px rgba(0, 0, 0, 0.12)",
              }
            : undefined
        }
      >
        <svg
          viewBox="0 0 200 300"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Heatmap Gradients */}
            <radialGradient id="heatRed">
              <stop offset="0%" stopColor="#ff1744" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#ff9100" stopOpacity="0.80" />
              <stop offset="75%" stopColor="#ffea00" stopOpacity="0.55" />
              <stop offset="90%" stopColor="#00e676" stopOpacity="0.30" />
              <stop offset="100%" stopColor="#00e5ff" stopOpacity="0" />
            </radialGradient>

            <filter id="pitchBlur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="10" />
            </filter>
          </defs>

          {/* Grass Turf Lines (Vertical Subtle Stripes) */}
          {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270].map((y, i) => (
            <rect
              key={y}
              x="0"
              y={y}
              width="200"
              height="30"
              fill={i % 2 === 0 ? "rgba(255, 255, 255, 0.03)" : "transparent"}
            />
          ))}

          {/* ─── Regulation Field Markings in Crisp White ───────────── */}
          <g stroke="rgba(255, 255, 255, 0.75)" strokeWidth="1.5" fill="none">
            {/* Outer Pitch Boundary */}
            <rect x="8" y="8" width="184" height="284" rx="2" />

            {/* Halfway Line */}
            <line x1="8" y1="150" x2="192" y2="150" />

            {/* Center Circle & Spot */}
            <circle cx="100" cy="150" r="28" />
            <circle cx="100" cy="150" r="1.5" fill="rgba(255, 255, 255, 0.95)" />

            {/* Top Penalty Box (Opponent) */}
            <rect x="42" y="8" width="116" height="48" />
            {/* Top 6-yard Box */}
            <rect x="70" y="8" width="60" height="18" />
            {/* Top Penalty Spot & Arc */}
            <circle cx="100" cy="36" r="1.5" fill="rgba(255, 255, 255, 0.95)" />
            <path d="M 75 56 A 25 25 0 0 0 125 56" />

            {/* Bottom Penalty Box (Own) */}
            <rect x="42" y="244" width="116" height="48" />
            {/* Bottom 6-yard Box */}
            <rect x="70" y="274" width="60" height="18" />
            {/* Bottom Penalty Spot & Arc */}
            <circle cx="100" cy="264" r="1.5" fill="rgba(255, 255, 255, 0.95)" />
            <path d="M 75 244 A 25 25 0 0 1 125 244" />

            {/* Corner Arcs */}
            <path d="M 8 16 A 8 8 0 0 0 16 8" />
            <path d="M 184 8 A 8 8 0 0 0 192 16" />
            <path d="M 8 284 A 8 8 0 0 1 16 292" />
            <path d="M 184 292 A 8 8 0 0 1 192 284" />
          </g>

          {/* ─── Heatmap Blended Layer ───────────────────────────────── */}
          <g filter="url(#pitchBlur)" style={{ mixBlendMode: "screen" }}>
            {heatPoints.map((pt, i) => (
              <ellipse
                key={i}
                cx={pt.cx}
                cy={pt.cy}
                rx={pt.rx}
                ry={pt.ry}
                fill="url(#heatRed)"
                opacity={pt.opacity}
              />
            ))}
          </g>
        </svg>

        {/* Heat intensity legend watermark */}
        <div className="absolute bottom-2 right-2 text-[9px] font-mono text-white/70 bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
          High &bull; Mid &bull; Low
        </div>
      </div>

      {/* ─── Quick Stat Summary Bar ───────────────────────────────────── */}
      <div
        className={cn(
          "mt-3.5 grid grid-cols-5 gap-1 border-t pt-3 text-center",
          isEditorial ? "border-zinc-200" : "border-[#1e2638]"
        )}
      >
        <div className="flex flex-col items-center">
          <span
            className={cn(
              "text-xs font-black font-mono",
              isEditorial ? "text-zinc-950" : "text-white"
            )}
          >
            {totalMatches}
          </span>
          <div
            className={cn(
              "h-1.5 w-5 rounded-full mt-1",
              isEditorial ? "bg-emerald-600" : "bg-[#00e676] shadow-[0_0_8px_#00e676]"
            )}
          />
          <span
            className={cn(
              "text-[9px] mt-1 uppercase font-bold",
              isEditorial ? "text-zinc-500" : "text-zinc-400"
            )}
          >
            Jogos
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span
            className={cn(
              "text-xs font-black font-mono",
              isEditorial ? "text-zinc-950" : "text-white"
            )}
          >
            {totalMinutes}&apos;
          </span>
          <div
            className={cn(
              "h-1.5 w-5 rounded-full mt-1",
              isEditorial ? "bg-emerald-600" : "bg-[#00e676] shadow-[0_0_8px_#00e676]"
            )}
          />
          <span
            className={cn(
              "text-[9px] mt-1 uppercase font-bold",
              isEditorial ? "text-zinc-500" : "text-zinc-400"
            )}
          >
            Min
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span
            className={cn(
              "text-xs font-black font-mono",
              isEditorial ? "text-emerald-700" : "text-[#00e676]"
            )}
          >
            {goals}
          </span>
          <div
            className={cn(
              "h-1.5 w-5 rounded-full mt-1",
              isEditorial ? "bg-emerald-600" : "bg-[#00e676] shadow-[0_0_8px_#00e676]"
            )}
          />
          <span
            className={cn(
              "text-[9px] mt-1 uppercase font-bold",
              isEditorial ? "text-zinc-500" : "text-zinc-400"
            )}
          >
            Gols
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span
            className={cn(
              "text-xs font-black font-mono",
              isEditorial ? "text-emerald-700" : "text-[#00e676]"
            )}
          >
            {assists}
          </span>
          <div
            className={cn(
              "h-1.5 w-5 rounded-full mt-1",
              isEditorial ? "bg-emerald-600" : "bg-[#00e676] shadow-[0_0_8px_#00e676]"
            )}
          />
          <span
            className={cn(
              "text-[9px] mt-1 uppercase font-bold",
              isEditorial ? "text-zinc-500" : "text-zinc-400"
            )}
          >
            Assists
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span
            className={cn(
              "text-xs font-black font-mono",
              isEditorial ? "text-amber-600" : "text-amber-400"
            )}
          >
            {yellowCards}/{redCards}
          </span>
          <div className="h-1.5 w-5 rounded-full bg-amber-500 mt-1" />
          <span
            className={cn(
              "text-[9px] mt-1 uppercase font-bold",
              isEditorial ? "text-zinc-500" : "text-zinc-400"
            )}
          >
            Cartões
          </span>
        </div>
      </div>

      {/* ─── Biometrics Matrix (BeSoccer Pro Model) ───────────────────── */}
      {showBiometrics && (
        <div
          className={cn(
            "mt-3.5 border-t pt-3",
            isEditorial ? "border-zinc-200" : "border-[#1e2638]"
          )}
        >
          <p
            className={cn(
              "text-[10px] font-black uppercase tracking-wider text-center mb-2",
              isEditorial ? "text-zinc-500" : "text-zinc-400"
            )}
          >
            TEMPORADA 2024 / 2025
          </p>

          <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
            <div
              className={cn(
                "rounded-lg p-2 border",
                isEditorial
                  ? "bg-zinc-50 border-zinc-200 text-zinc-950"
                  : "bg-[#121622] border-[#1e2638] text-white"
              )}
            >
              <p className="text-sm font-black">{age ?? "—"}</p>
              <p
                className={cn(
                  "text-[9px] font-sans uppercase",
                  isEditorial ? "text-zinc-500 font-bold" : "text-zinc-400"
                )}
              >
                Idade
              </p>
            </div>

            <div
              className={cn(
                "rounded-lg p-2 border",
                isEditorial
                  ? "bg-zinc-50 border-zinc-200 text-zinc-950"
                  : "bg-[#121622] border-[#1e2638] text-white"
              )}
            >
              <p className="text-sm font-black">{formatHeight(height)}</p>
              <p
                className={cn(
                  "text-[9px] font-sans uppercase",
                  isEditorial ? "text-zinc-500 font-bold" : "text-zinc-400"
                )}
              >
                Altura
              </p>
            </div>

            <div
              className={cn(
                "rounded-lg p-2 border",
                isEditorial
                  ? "bg-zinc-50 border-zinc-200 text-zinc-950"
                  : "bg-[#121622] border-[#1e2638] text-white"
              )}
            >
              <p className="text-sm font-black">{formatWeight(weight)}</p>
              <p
                className={cn(
                  "text-[9px] font-sans uppercase",
                  isEditorial ? "text-zinc-500 font-bold" : "text-zinc-400"
                )}
              >
                Peso
              </p>
            </div>

            <div
              className={cn(
                "rounded-lg p-2 border",
                isEditorial
                  ? "bg-zinc-50 border-zinc-200 text-zinc-950"
                  : "bg-[#121622] border-[#1e2638] text-white"
              )}
            >
              <p
                className={cn(
                  "text-xs font-black",
                  isEditorial ? "text-emerald-700" : "text-[#00e676]"
                )}
              >
                {position === "RIGHT_WING" || position === "STRIKER" ? "€ 45M" : "€ 18M"}
              </p>
              <p
                className={cn(
                  "text-[9px] font-sans uppercase",
                  isEditorial ? "text-zinc-500 font-bold" : "text-zinc-400"
                )}
              >
                Valor Est.
              </p>
            </div>

            <div
              className={cn(
                "rounded-lg p-2 border",
                isEditorial
                  ? "bg-zinc-50 border-zinc-200 text-zinc-950"
                  : "bg-[#121622] border-[#1e2638] text-white"
              )}
            >
              <p
                className={cn(
                  "text-xs font-black",
                  isEditorial ? "text-indigo-600" : "text-indigo-400"
                )}
              >
                88 &rarr; 96
              </p>
              <p
                className={cn(
                  "text-[9px] font-sans uppercase",
                  isEditorial ? "text-zinc-500 font-bold" : "text-zinc-400"
                )}
              >
                Potencial
              </p>
            </div>

            <div
              className={cn(
                "rounded-lg p-2 border",
                isEditorial
                  ? "bg-zinc-50 border-zinc-200 text-zinc-950"
                  : "bg-[#121622] border-[#1e2638] text-white"
              )}
            >
              <p className="text-xs font-black">{FOOT_LABELS[footPreference]}</p>
              <p
                className={cn(
                  "text-[9px] font-sans uppercase",
                  isEditorial ? "text-zinc-500 font-bold" : "text-zinc-400"
                )}
              >
                Pé
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
