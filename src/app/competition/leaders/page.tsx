import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Trophy,
  ArrowLeft,
  Sparkles,
  Layers,
  UploadCloud,
  FileSpreadsheet,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getLeaderboardDashboard } from "@/lib/actions/leaderboards";
import { LeaderboardDashboardView } from "@/components/leaderboards/leaderboard-dashboard-view";

export const metadata: Metadata = {
  title: "Líderes da Competição | The Net Scouting",
  description:
    "Dashboard oficial de líderes e rankings estatísticos calibrados com o Motor de Inferência Tática (Aulas 1, 2 e 3).",
};

export default async function CompetitionLeadersPage() {
  const dashboard = await getLeaderboardDashboard();

  return (
    <div className="space-y-6 w-full pb-12">
      {/* ─── Top Action Bar & Breadcrumbs ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <Link
          href="/league"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5 text-cyan-400" />
          Voltar para o Catálogo da Liga
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/athletes"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] hover:text-white transition-all"
          >
            <Users className="h-3.5 w-3.5 text-indigo-400" />
            Explorar Atletas
          </Link>

          <Link
            href="/admin/import"
            className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 transition-all"
          >
            <UploadCloud className="h-3.5 w-3.5 text-cyan-400" />
            Importar Wyscout
          </Link>
        </div>
      </div>

      {/* ─── Hero Executive Header ────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-[#0c1426] via-[#090f1d] to-[#0d162b] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Líderes da Competição &bull; Inteligência Ativa
                </h1>
                <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/40 text-[10px] font-mono py-0 h-4">
                  Fase 4
                </Badge>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              Painel analítico macro da Série A com rankings calibrados pelo nosso{" "}
              <strong className="text-white">Motor de Inferência Tática (Cérebro - Aulas 1, 2 e 3)</strong>.
              Filtro ativo de minutos para eliminar distorções estatísticas e viés de sobrevivência.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-zinc-300">
                <Sparkles className="h-3 w-3 text-cyan-400" />
                Série A 2026
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-zinc-300">
                Filtro: Min. 180 Minutos
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-300">
                Ajuste Sigmoide PAdj
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Content: Interactive Pills View ──────────────────────────── */}
      <LeaderboardDashboardView
        geral={dashboard.geral}
        ofensiva={dashboard.ofensiva}
        defensiva={dashboard.defensiva}
      />
    </div>
  );
}
