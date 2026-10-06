"use client";

import React from "react";
import { Shield, Sparkles } from "lucide-react";
import { POSITION_LABELS, FOOT_LABELS, formatAge, formatHeight } from "@/lib/domain";
import { cn } from "@/lib/utils";
import type { RaioXAthleteSheetData } from "@/components/reports/athlete-raio-x-sheet";

interface ReportCoverProps {
  athlete: RaioXAthleteSheetData;
  className?: string;
}

export function ReportCover({ athlete, className }: ReportCoverProps) {
  const photo = athlete.actionPhotoUrl || athlete.photoUrl;
  const initials = athlete.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const reportDate = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  const docRef = `TNS-DOSSIER-${athlete.id.slice(0, 6).toUpperCase()}`;

  return (
    <div
      className={cn(
        "relative w-full h-[280mm] max-h-[280mm] bg-[#fdfcf8] text-zinc-950 flex flex-col justify-between p-10 print:p-8 print:m-0 print:h-[280mm] print:max-h-[280mm] overflow-hidden select-text border border-zinc-200/80 shadow-2xl print:shadow-none print:border-none",
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
      {/* Top Header & Branding (Minimalist Editorial Luxury) */}
      <div className="flex items-start justify-between border-b-2 border-zinc-950 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-zinc-950 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-md print:bg-black print:text-white">
            TNS
          </div>
          <div>
            <h1 className="text-base font-black tracking-tighter uppercase leading-none text-zinc-950 font-sans">
              The Net Scouting
            </h1>
            <p className="text-[10px] font-bold tracking-[0.25em] text-zinc-500 uppercase mt-1">
              Divisão de Inteligência & Scouting Executivo
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="inline-block px-2.5 py-1 rounded bg-zinc-950 text-white font-mono text-[9px] font-bold tracking-widest uppercase print:bg-black print:text-white">
            Dossiê Confidencial
          </span>
          <p className="font-mono text-[10px] text-zinc-500 font-bold mt-1.5">
            Ref: {docRef}
          </p>
        </div>
      </div>

      {/* Hero Visual Area (Photo Full Bleed or Editorial Frame) */}
      <div className="relative flex-1 my-6 flex items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-100 to-zinc-200/60 border border-zinc-300/80 shadow-inner print:border-zinc-300">
        {photo ? (
          <div className="relative h-full w-full flex items-center justify-center p-4">
            <img
              src={photo}
              alt={athlete.name}
              className={cn(
                "max-h-[145mm] w-auto max-w-full object-contain filter drop-shadow-2xl transition-all",
                athlete.photoHasAlpha && "object-contain"
              )}
            />
            {/* Subtle light vignette overlay */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-zinc-200/40 via-transparent to-transparent" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-12">
            <div className="h-32 w-32 rounded-3xl bg-zinc-950 text-white flex items-center justify-center font-black text-4xl shadow-xl mb-4 font-sans">
              {initials}
            </div>
            <p className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
              Fotografia Oficial em Processamento
            </p>
          </div>
        )}

        {/* Club Floating Watermark/Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-zinc-200 shadow-sm print:bg-white">
          <Shield className="h-4 w-4 text-zinc-900" />
          <span className="text-xs font-black uppercase tracking-wider text-zinc-900">
            {athlete.team.name}
          </span>
        </div>

        {/* Tactical Badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-emerald-600 text-white px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm print:bg-emerald-600 print:text-white">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Prodigy Scout Report</span>
        </div>
      </div>

      {/* Lower Third: Massive Magazine Typography & Metadata Grid */}
      <div className="border-t-2 border-zinc-950 pt-5">
        <p className="text-xs font-bold font-mono tracking-[0.3em] uppercase text-zinc-500 mb-1">
          Relatório Executivo de Avaliação de Talento
        </p>

        {/* Massive Name */}
        <h2 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-zinc-950 font-sans leading-none mb-5">
          {athlete.name}
        </h2>

        {/* Key Attributes Bar: Posição, Idade, Clube, Data do Relatório */}
        <div className="grid grid-cols-4 gap-3 pt-4 border-t border-zinc-200 text-left">
          <div className="border-l-2 border-zinc-900 pl-3">
            <p className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-wider">
              Posição
            </p>
            <p className="text-sm font-black text-zinc-950 uppercase mt-0.5 truncate">
              {POSITION_LABELS[athlete.position]}
            </p>
          </div>

          <div className="border-l-2 border-zinc-900 pl-3">
            <p className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-wider">
              Idade
            </p>
            <p className="text-sm font-black text-zinc-950 uppercase mt-0.5">
              {athlete.birthDate ? formatAge(new Date(athlete.birthDate)) : "—"}
            </p>
          </div>

          <div className="border-l-2 border-zinc-900 pl-3">
            <p className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-wider">
              Clube
            </p>
            <p className="text-sm font-black text-zinc-950 uppercase mt-0.5 truncate">
              {athlete.team.name}
            </p>
          </div>

          <div className="border-l-2 border-zinc-900 pl-3">
            <p className="text-[9px] font-bold font-mono text-zinc-500 uppercase tracking-wider">
              Data do Relatório
            </p>
            <p className="text-sm font-black text-zinc-950 capitalize mt-0.5">
              {reportDate}
            </p>
          </div>
        </div>

        {/* Bottom Micro Footer */}
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-200 text-[9px] text-zinc-500 font-mono">
          <span>The Net Scouting &bull; Sistema Integrado de Inteligência do Futebol</span>
          <span className="font-bold text-zinc-900 uppercase">Página 1 de 4 &bull; Capa Oficial</span>
        </div>
      </div>
    </div>
  );
}
