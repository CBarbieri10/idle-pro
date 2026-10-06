"use client";

import React from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Video,
  ExternalLink,
  Target,
  Compass,
  Play,
  Layers,
} from "lucide-react";
import { TacticalPitchHeatmap } from "@/components/charts/tactical-pitch-heatmap";
import { POSITION_LABELS } from "@/lib/domain";
import { cn } from "@/lib/utils";
import type { RaioXAthleteSheetData } from "@/components/reports/athlete-raio-x-sheet";

export interface DossierAnalysisPageProps {
  athlete: RaioXAthleteSheetData & {
    videoLinks?: Array<{
      id?: string;
      title?: string | null;
      url: string;
      category?: string;
      notes?: string | null;
      matchDate?: string | Date | null;
    }>;
    analysisNotes?: {
      tacticalTitle?: string;
      tacticalSummary?: string;
      strengths?: string[];
      weaknesses?: string[];
    };
  };
  className?: string;
  pageIndex?: number;
  totalPages?: number;
}

export function DossierAnalysisPage({
  athlete,
  className,
  pageIndex = 3,
  totalPages = 4,
}: DossierAnalysisPageProps) {
  const docRef = `TNS-DOSSIER-${athlete.id.slice(0, 6).toUpperCase()}`;

  // Default tactical intelligence based on player's position
  const isAttacker =
    athlete.position === "STRIKER" ||
    athlete.position === "FORWARD" ||
    athlete.position === "RIGHT_WING" ||
    athlete.position === "LEFT_WING";
  const isDefender =
    athlete.position === "CENTER_BACK" ||
    athlete.position === "LEFT_BACK" ||
    athlete.position === "RIGHT_BACK";
  const isMidfielder =
    athlete.position === "CENTRAL_MID" ||
    athlete.position === "DEFENSIVE_MID" ||
    athlete.position === "ATTACKING_MID";
  const isGoalkeeper = athlete.position === "GOALKEEPER";

  const defaultTacticalTitle = isAttacker
    ? "Ataque à Profundidade & Instinto de Finalização no Meio-Espaço"
    : isMidfielder
    ? "Controle de Ritmo, Condução Progressiva e Visão Espacial"
    : isDefender
    ? "Imposição em Duelos Aéreos e Qualidade na Primeira Linha de Construção"
    : isGoalkeeper
    ? "Envergadura, Segurança na Saída de Gol e Cobertura de Linha Alta"
    : "Inteligência Tática e Polivalência Posicional";

  const defaultTacticalSummary = isAttacker
    ? `Atleta com perfil agressivo de ataque aos espaços vazios e excelente leitura de desmarque diagonal entre lateral e zagueiro. Demonstra alto volume de presença na grande área, com capacidade de finalização de primeira perna e cabeça sob pressão. Mostra intensidade na recomposição imediata pós-perda e coordenação na pressão alta sobre a saída adversária.`
    : isMidfielder
    ? `Meio-campista dinâmico com refinada orientação corporal antes do domínio da bola. Notável capacidade de quebrar linhas de marcação adversárias através de passes verticais progressivos e mudanças rápidas de corredor. Oferece consistência na temporização de combate e coberturas defensivas nas zonas centrais.`
    : isDefender
    ? `Zagueiro com forte imposição física e excelente tempo de bola em interceptações e cortes pelo alto. Atua com maturidade na linha de impedimento e assegura estabilidade nas transições defensivas. Na fase com bola, apresenta compostura técnica para iniciar a construção curta ou lançamentos diagonais com precisão.`
    : isGoalkeeper
    ? `Goleiro com envergadura privilegiada, reflexos ágeis em chutes à queima-roupa e ótima leitura de antecipação como líbero. Transmite segurança na comunicação com o bloco defensivo e demonstra técnica apurada com os pés na saída sob pressão.`
    : `Jogador versátil que combina disciplina tática, boa ocupação de espaços e rápida resposta às instruções da comissão técnica nas diversas fases da partida.`;

  const defaultStrengths = isAttacker
    ? [
        "Desmarque de ruptura rápido no espaço às costas dos defensores.",
        "Compostura e precisão na finalização em espaços reduzidos na área.",
        "Agressividade na pressão defensiva inicial e bloqueio de linhas de passe.",
        "Capacidade de acelerar jogadas em transição ofensiva rápida.",
      ]
    : isMidfielder
    ? [
        "Qualidade no passe progressivo e inversão qualificada de corredor.",
        "Retenção de posse sob forte pressão do adversário no círculo central.",
        "Leitura tática para antecipação e recuperação de segundas bolas.",
        "Excelente tomada de decisão na transição ataque-defesa.",
      ]
    : isDefender
    ? [
        "Domínio absoluto em duelos aéreos defensivos e cortes dentro da área.",
        "Timing apurado no desarme por antecipação em velocidade.",
        "Saída de bola limpa com quebra de primeira linha de pressão adversária.",
        "Liderança vocal e alinhamento coordenado do bloco defensivo.",
      ]
    : [
        "Reflexos rápidos e impulsão elástica em bolas difíceis.",
        "Comando de voz e organização em lances de bola parada.",
        "Precisão em lançamentos longos para início de contra-ataque.",
        "Postura fria e confiante em momentos decisivos do confronto.",
      ];

  const defaultWeaknesses = isAttacker
    ? [
        "Temporização em disputas aéreas de tiro de meta em campo aberto.",
        "Paciência na retenção de pivô de costas para a marcação pesada.",
        "Uso do pé não dominante em situações de finalização pressionada.",
      ]
    : isMidfielder
    ? [
        "Ocupação da área para finalização de média distância em bloco baixo.",
        "Equilíbrio de faltas táticas para contenção sem acúmulo de cartões.",
        "Intensidade física na recomposição de sprints longos no final da partida.",
      ]
    : isDefender
    ? [
        "Agilidade de recuperação na mudança rápida de direção em campo aberto.",
        "Ajuste de botes no terço médio para evitar faltas em zonas de risco.",
        "Aproveitamento ofensivo em bolas paradas na área adversária.",
      ]
    : [
        "Saídas aéreas em bolas cruzadas fechadas com aglomeração na pequena área.",
        "Agilidade no apoio com o pé não preferencial sob pressão de atacante.",
        "Reposição rápida com a mão após defesas seguras.",
      ];

  const tacticalTitle =
    athlete.analysisNotes?.tacticalTitle || defaultTacticalTitle;
  const tacticalSummary =
    athlete.analysisNotes?.tacticalSummary || defaultTacticalSummary;
  const strengths =
    athlete.analysisNotes?.strengths && athlete.analysisNotes.strengths.length > 0
      ? athlete.analysisNotes.strengths
      : defaultStrengths;
  const weaknesses =
    athlete.analysisNotes?.weaknesses && athlete.analysisNotes.weaknesses.length > 0
      ? athlete.analysisNotes.weaknesses
      : defaultWeaknesses;

  const videoLinks = athlete.videoLinks ?? [];

  return (
    <div
      className={cn(
        "relative w-full h-[280mm] max-h-[280mm] bg-[#fdfcf8] text-zinc-950 flex flex-col justify-between p-8 print:p-6 print:m-0 print:h-[280mm] print:max-h-[280mm] overflow-hidden select-text border border-zinc-200 shadow-2xl print:shadow-none print:border-none",
        "break-after-page print:break-after-page",
        className
      )}
      style={{
        pageBreakAfter: "always",
        breakAfter: "page",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {/* ─── Top Header (Editorial TNS Minimalist) ─────────────────────────── */}
      <div className="flex items-center justify-between border-b-2 border-zinc-950 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-zinc-950 flex items-center justify-center text-white font-black text-xs print:bg-black print:text-white">
            TNS
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Página {pageIndex < 10 ? `0${pageIndex}` : pageIndex} &bull; Avaliação Qualitativa
              </span>
              <span className="text-[10px] text-zinc-400 font-bold">&bull;</span>
              <span className="text-xs font-black uppercase text-zinc-900 font-sans">
                {athlete.name}
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 font-medium">
              Análise Tática, Ocupação Espacial &amp; Relatório de Forças
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-[9px] text-zinc-500">
          <p className="font-bold text-zinc-900 uppercase">
            {POSITION_LABELS[athlete.position]} &bull; {athlete.team.name}
          </p>
          <p>Ref: {docRef}</p>
        </div>
      </div>

      {/* ─── Main Content Canvas ───────────────────────────────────────────── */}
      <div className="flex-1 my-3 flex flex-col justify-between space-y-3 overflow-hidden">
        {/* Bloco 1: Resumo Tático com Título Forte */}
        <div className="rounded-xl border border-zinc-300/80 bg-white p-4 shadow-2xs print:border-zinc-300">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-100">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-zinc-950 text-white flex items-center justify-center text-xs print:bg-black print:text-white">
                <Compass className="h-3.5 w-3.5 text-indigo-400" />
              </div>
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-sans">
                Resumo Tático &bull; Leitura do Analista Chefe
              </h3>
            </div>
            <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase bg-zinc-100 px-2 py-0.5 rounded">
              Avaliação Oficial
            </span>
          </div>

          <h4 className="text-sm font-black text-zinc-900 font-sans leading-snug mb-2">
            &ldquo;{tacticalTitle}&rdquo;
          </h4>

          <p className="text-xs text-zinc-700 leading-relaxed font-sans text-justify">
            {tacticalSummary}
          </p>

          {/* Tactical Video Clips Bar (Issue #14) */}
          {videoLinks.length > 0 && (
            <div className="mt-3 pt-2 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-600">
                <Video className="h-3.5 w-3.5 text-indigo-600" />
                <span>Videoteca Vinculada ({videoLinks.length} clipes analisados):</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {videoLinks.slice(0, 3).map((video, idx) => (
                  <a
                    key={video.id || idx}
                    href={video.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-mono font-bold hover:bg-indigo-100 transition-colors"
                  >
                    <Play className="h-2.5 w-2.5 fill-current" />
                    <span className="max-w-[120px] truncate">{video.title || "Clipe Tático"}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bloco 2: Duas Colunas - Pontos Fortes & A Desenvolver */}
        <div className="grid grid-cols-2 gap-3 print-avoid-break">
          {/* Coluna 1: Pontos Fortes (Emerald Highlight) */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-emerald-200/80">
                <div className="h-5 w-5 rounded bg-emerald-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider font-sans">
                  Pontos Fortes &bull; Vantagens
                </h4>
              </div>

              <ul className="space-y-1.5 text-left">
                {strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <span className="leading-snug">{str}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[9px] font-mono text-emerald-800 font-bold mt-2 pt-1 border-t border-emerald-200/60 uppercase">
              Impacto imediato na dinâmica da equipe
            </p>
          </div>

          {/* Coluna 2: A Desenvolver (Amber/Indigo Highlight) */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-2 mb-2 border-b border-amber-200/80">
                <div className="h-5 w-5 rounded bg-amber-500 text-white flex items-center justify-center">
                  <Target className="h-3.5 w-3.5" />
                </div>
                <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider font-sans">
                  A Desenvolver &bull; Foco de Treino
                </h4>
              </div>

              <ul className="space-y-1.5 text-left">
                {weaknesses.map((weak, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-zinc-800">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <span className="leading-snug">{weak}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="text-[9px] font-mono text-amber-800 font-bold mt-2 pt-1 border-t border-amber-200/60 uppercase">
              Oportunidades de margem de evolução
            </p>
          </div>
        </div>

        {/* Bloco 3: Campinho Tático Espacial (Tactical Pitch Heatmap) */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-2xs print:border-zinc-300 print-avoid-break">
          <div className="grid grid-cols-12 gap-3 items-center">
            {/* Left: Campinho Tático Renderizado em Modo Editorial Off-White */}
            <div className="col-span-5 flex justify-center">
              <TacticalPitchHeatmap
                position={athlete.position}
                athleteName={athlete.name}
                totalMatches={athlete.totalMatches}
                totalMinutes={athlete.totalMinutes}
                goals={athlete.canonicalMetrics?.["goals"]?.total ?? 0}
                assists={athlete.canonicalMetrics?.["assists"]?.total ?? 0}
                variant="editorial"
                showBiometrics={false}
                className="w-full max-w-[240px] p-2 border-none shadow-none"
              />
            </div>

            {/* Right: Leitura Espacial & Zonas de Ação */}
            <div className="col-span-7 flex flex-col justify-between space-y-2 text-left pl-2 border-l border-zinc-200">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="h-5 w-5 rounded bg-zinc-950 text-white flex items-center justify-center text-[10px] font-mono font-bold">
                    <Layers className="h-3 w-3" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-950 font-sans">
                    Distribuição Espacial &bull; Áreas de Calor
                  </h4>
                </div>

                <p className="text-[11px] text-zinc-600 leading-relaxed font-sans mb-3">
                  O mapa ao lado consolida a amostragem de <strong>{athlete.totalMinutes}&apos; minutos</strong> em <strong>{athlete.totalMatches} partidas oficiais</strong>. Os focos térmicos refletem maior tempo de permanência e interações ativas com e sem bola durante as fases da partida.
                </p>
              </div>

              {/* 3 Metric Mini Pills */}
              <div className="grid grid-cols-3 gap-2 font-mono text-center pt-2 border-t border-zinc-100">
                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-1.5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">Terço Principal</p>
                  <p className="text-xs font-black text-zinc-950 uppercase mt-0.5">
                    {isAttacker ? "Ofensivo" : isDefender ? "Defensivo" : "Central"}
                  </p>
                </div>

                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-1.5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">Raio de Ação</p>
                  <p className="text-xs font-black text-emerald-800 mt-0.5">
                    {isAttacker ? "Alto / Caixa" : isDefender ? "Compacto" : "Box-to-Box"}
                  </p>
                </div>

                <div className="rounded-lg bg-zinc-50 border border-zinc-200 p-1.5">
                  <p className="text-[9px] text-zinc-500 uppercase font-bold">Densidade</p>
                  <p className="text-xs font-black text-zinc-950 mt-0.5">
                    {athlete.totalMatches >= 5 ? "Alta (Fidedigna)" : "Inicial"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-indigo-50/60 border border-indigo-100 p-2 mt-1">
                <p className="text-[10px] text-indigo-950 leading-tight font-sans">
                  <strong>Nota Metodológica:</strong> Coordenadas normatizadas conforme convenção FIFA/Opta. As linhas de ataque direcionam-se sempre no sentido vertical ascendente (&uarr;).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Footer ─────────────────────────────────────────────────── */}
      <div className="pt-3 border-t border-zinc-200 flex items-center justify-between text-[10px] text-zinc-500 print-avoid-break">
        <span>The Net Scouting &bull; Divisão de Inteligência &amp; Análise Qualitativa</span>
        <span className="font-mono font-bold text-zinc-950">
          Página {pageIndex} de {totalPages} &bull; Análise Qualitativa &amp; Espacial
        </span>
      </div>
    </div>
  );
}
