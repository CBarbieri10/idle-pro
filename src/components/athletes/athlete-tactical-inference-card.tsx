import React from "react";
import {
  Brain,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
  Crosshair,
  Compass,
  AlertTriangle,
  Layers,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  generateDetailedTacticalInsights,
  type TacticalMetricInput,
  type TacticalInsightItem,
} from "@/lib/services/inferenceEngine";

interface AthleteTacticalInferenceCardProps {
  athleteName: string;
  position: string;
  metrics?: Record<string, { per90?: number; count?: number; value?: number; percentile?: number } | number> | null;
  rawMetrics?: Record<string, unknown> | null;
}

export function AthleteTacticalInferenceCard({
  athleteName,
  position,
  metrics,
  rawMetrics,
}: AthleteTacticalInferenceCardProps) {
  const inferenceInput: TacticalMetricInput = {
    position,
    canonicalMetrics: metrics,
    metrics,
    rawMetrics,
  };

  const insights: TacticalInsightItem[] = generateDetailedTacticalInsights(inferenceInput);

  const getToneStyle = (tone: TacticalInsightItem["tone"]) => {
    switch (tone) {
      case "alert":
        return {
          cardBg: "from-amber-500/[0.08] via-[#141a29]/80 to-[#0c101d]/90",
          borderColor: "border-amber-500/30 hover:border-amber-500/50",
          iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
          badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          accentGlow: "bg-amber-500/10",
          Icon: AlertTriangle,
        };
      case "praise":
        return {
          cardBg: "from-emerald-500/[0.08] via-[#141a29]/80 to-[#0c101d]/90",
          borderColor: "border-emerald-500/30 hover:border-emerald-500/50",
          iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
          badgeBg: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
          accentGlow: "bg-emerald-500/10",
          Icon: ShieldCheck,
        };
      case "cognitive":
        return {
          cardBg: "from-cyan-500/[0.08] via-[#141a29]/80 to-[#0c101d]/90",
          borderColor: "border-cyan-500/30 hover:border-cyan-500/50",
          iconColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
          badgeBg: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
          accentGlow: "bg-cyan-500/10",
          Icon: Brain,
        };
      case "info":
      default:
        return {
          cardBg: "from-indigo-500/[0.08] via-[#141a29]/80 to-[#0c101d]/90",
          borderColor: "border-indigo-500/30 hover:border-indigo-500/50",
          iconColor: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
          badgeBg: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30",
          accentGlow: "bg-indigo-500/10",
          Icon: Compass,
        };
    }
  };

  return (
    <Card className="rounded-2xl border border-white/[0.12] bg-[#0c101d]/75 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.5)] relative overflow-hidden">
      {/* Decorative ambient gradients */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-white/[0.08] relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/15 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_16px_rgba(16,185,129,0.25)]">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold uppercase tracking-wider text-white">
                Leitura Tática (Analista IA)
              </h3>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono py-0 h-4 uppercase tracking-wider">
                Motor Cérebro v1
              </Badge>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Diagnósticos comportamentais inferidos pelo Cérebro Metodológico (Aulas 1, 2 e 3)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-zinc-400 bg-white/[0.04] px-2.5 py-1 rounded-lg border border-white/[0.08]">
            {insights.length} {insights.length === 1 ? "parecer inferido" : "pareceres inferidos"}
          </span>
        </div>
      </div>

      {/* Grid of Tactical Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
        {insights.map((item) => {
          const toneStyle = getToneStyle(item.tone);
          const Icon = toneStyle.Icon;

          return (
            <div
              key={item.id}
              className={`rounded-xl border ${toneStyle.borderColor} bg-gradient-to-b ${toneStyle.cardBg} backdrop-blur-md p-4 shadow-lg transition-all duration-300 hover:scale-[1.01] hover:shadow-xl relative overflow-hidden flex flex-col justify-between`}
            >
              <div className="space-y-2.5">
                {/* Meta badges row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-7 w-7 rounded-lg border flex items-center justify-center ${toneStyle.iconColor}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                      {item.category}
                    </span>
                  </div>

                  <Badge
                    variant="outline"
                    className={`text-[10px] font-mono px-2 py-0.5 ${toneStyle.badgeBg}`}
                  >
                    {item.lessonTag}
                  </Badge>
                </div>

                {/* Title */}
                <h4 className="text-xs font-black text-white leading-snug">
                  {item.title}
                </h4>

                {/* Description */}
                <p className="text-xs text-zinc-300/90 leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>

              {/* Bottom footer tag */}
              <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                <span>Atleta: {athleteName}</span>
                <span className="text-zinc-400 hover:text-white transition-colors">
                  Cérebro Tático
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
