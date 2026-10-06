"use client";

import React, { useState } from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Bot,
  FileText,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { generateAthleteTacticalSummaryAction } from "@/lib/actions/ai-scout";
import { useRouter } from "next/navigation";

interface AthleteTacticalAiSummaryProps {
  athleteId: string;
  athleteName: string;
  initialTitle?: string | null;
  initialSummary?: string | null;
  initialStrengths?: string[];
  initialWeaknesses?: string[];
}

export function AthleteTacticalAiSummary({
  athleteId,
  athleteName,
  initialTitle,
  initialSummary,
  initialStrengths = [],
  initialWeaknesses = [],
}: AthleteTacticalAiSummaryProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState(initialTitle || "");
  const [summary, setSummary] = useState(initialSummary || "");
  const [strengths, setStrengths] = useState<string[]>(initialStrengths);
  const [weaknesses, setWeaknesses] = useState<string[]>(initialWeaknesses);
  const [error, setError] = useState<string | null>(null);

  const hasData = Boolean(title || summary);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generateAthleteTacticalSummaryAction(athleteId);
      if (res.success && res.data) {
        setTitle(res.data.tacticalTitle);
        setSummary(res.data.tacticalSummary);
        setStrengths(res.data.strengths);
        setWeaknesses(res.data.weaknesses);
        router.refresh();
      } else {
        setError(res.error || "Não foi possível gerar o parecer tático.");
      }
    } catch {
      setError("Erro ao se conectar ao serviço de inteligência tática.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-2xl border border-white/[0.12] bg-gradient-to-b from-[#131b2a]/95 to-[#080e18]/95 p-6 shadow-xl relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_12px_rgba(0,230,118,0.2)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">
                Parecer Tático com IA
              </h2>
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] font-mono py-0 h-4">
                Dossiê Ready
              </Badge>
            </div>
            <p className="text-[11px] text-zinc-400">
              Geração analítica automatizada para o caderno impresso (Página 3)
            </p>
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="relative inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-zinc-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(0,230,118,0.25)] hover:shadow-[0_0_25px_rgba(0,230,118,0.4)] transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Bot className="h-4 w-4 animate-spin" />
              <span>Analisando Métricas & IDG...</span>
            </>
          ) : hasData ? (
            <>
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Regerar com IA</span>
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>✨ Gerar Resumo Tático com IA</span>
            </>
          )}
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content State */}
      {!hasData && !loading ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.01] p-8 text-center space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-zinc-200">
              Nenhum parecer gerado para {athleteName}
            </p>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mt-1">
              Clique no botão acima para que o Head Scout de IA analise os dados canônicos, o PAdj e o IDG, gerando o relatório oficial da Página 3.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tactical Title */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1">
              Diretriz de Posicionamento & Estilo
            </p>
            <h3 className="text-base font-black text-white tracking-tight leading-snug">
              {title}
            </h3>
          </div>

          {/* Tactical Summary Paragraph */}
          <div className="rounded-xl bg-[#0b101c] p-4 border border-white/[0.08] shadow-inner">
            <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
              {summary}
            </p>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Strengths */}
            <div className="rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Pontos Fortes (Destaques)</span>
              </div>
              <ul className="space-y-1.5">
                {strengths.map((s, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-emerald-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="rounded-xl bg-amber-500/[0.04] border border-amber-500/20 p-4 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-400">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Pontos a Desenvolver</span>
              </div>
              <ul className="space-y-1.5">
                {weaknesses.map((w, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-zinc-300 flex items-start gap-2 leading-relaxed"
                  >
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Footer Integration Notice */}
          <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-white/[0.06]">
            <span className="flex items-center gap-1.5 text-emerald-400/90 font-medium">
              <FileText className="h-3.5 w-3.5" />
              Texto sincronizado com o Dossiê PDF (Página 3 de Análise)
            </span>
            <span className="text-zinc-500 font-mono">TNS-AI Engine v2.0</span>
          </div>
        </div>
      )}
    </Card>
  );
}
