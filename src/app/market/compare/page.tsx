import { Suspense } from "react";
import { getComparisonData } from "@/lib/actions/compare";
import { CompareViewClient } from "@/components/compare/compare-view-client";
import { Swords, Scale, Shield, Sparkles } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comparador Head-to-Head • Batalha de Atletas | Overview Scout",
  description:
    "Análise comparativa direta de atletas com Radar DNA sobreposto e matriz de métricas térmicas.",
};

export default async function MarketComparePage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string }>;
}) {
  const rawParams = await searchParams;
  const rawIds = rawParams.ids || "";
  const athleteIds = rawIds
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 3);

  const comparisonData =
    athleteIds.length > 0 ? await getComparisonData(athleteIds) : null;

  return (
    <div className="space-y-6 w-full pb-20">
      {/* ─── Header Executivo da Batalha Head-to-Head ─────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-mono">
              <Swords className="h-3 w-3" /> Comparador Head-to-Head &bull; Batalha de Atletas
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {athleteIds.length > 0
                ? `${athleteIds.length} ${athleteIds.length === 1 ? "alvo em análise" : "alvos em confronto"}`
                : "Aguardando seleção"}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            Confronto Direto &amp; Radar DNA
          </h1>

          <p className="text-xs text-zinc-400 mt-0.5">
            Compare alvos de contratação lado a lado. O gráfico de radar evidencia
            sobreposição tática e a tabela térmica indica o atleta dominante em cada métrica.
          </p>
        </div>
      </div>

      {/* ─── Visualizador do Confronto Head-to-Head ───────────────────────── */}
      <Suspense fallback={<div className="h-96 rounded-2xl bg-white/5 animate-pulse" />}>
        <CompareViewClient
          initialData={comparisonData}
          requestedIds={athleteIds}
        />
      </Suspense>
    </div>
  );
}
