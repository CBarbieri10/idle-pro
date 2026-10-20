"use client";

import React, { useId } from "react";
import { getContrastTextColor } from "@/lib/club-colors";
import { cn } from "@/lib/utils";

export interface ShirtSVGProps {
  /** Número da camisa (ex: 9, 10, '99'). Fallback: '-' */
  number?: string | number | null;
  /** Nome estampado nas costas (ex: 'PEDRO', 'ARRASCAETA') */
  playerName?: string | null;
  /** Cor primária da camisa (fundo do corpo e mangas) */
  primaryColor?: string;
  /** Cor secundária da camisa (gola, punhos e detalhes) */
  secondaryColor?: string;
  /** Cor terciária ou de acento (opcional, para costuras ou contorno) */
  accentColor?: string;
  /** Cor do texto e número (opcional; se omitida, calcula contraste automático) */
  textColor?: string;
  /** Classes CSS adicionais para o container SVG */
  className?: string;
  /** Exibir cabide decorativo no topo (estilo vestiário) */
  showHanger?: boolean;
}

export function ShirtSVG({
  number,
  playerName,
  primaryColor = "#c5241f",
  secondaryColor = "#111111",
  accentColor,
  textColor,
  className,
  showHanger = false,
}: ShirtSVGProps) {
  const uniqueId = useId().replace(/:/g, "");

  // Fallback e formatação do número
  const displayNumber =
    number !== undefined && number !== null && String(number).trim() !== ""
      ? String(number).trim()
      : "-";

  // Formatação do nome
  const displayName = playerName ? playerName.trim().toUpperCase() : null;

  // Cor do texto com cálculo de alto contraste
  const activeTextColor = textColor || getContrastTextColor(primaryColor);
  const activeAccentColor = accentColor || secondaryColor;

  return (
    <svg
      viewBox="0 0 240 280"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-full h-full select-none overflow-visible", className)}
      style={{ filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.45))" }}
    >
      <defs>
        {/* Gradiente sutil de iluminação para simular caimento do tecido esportivo */}
        <linearGradient id={`fabric-shading-${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.0" />
          <stop offset="80%" stopColor="#000000" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.28" />
        </linearGradient>

        {/* Gradiente para a gola e garras anatômicas */}
        <linearGradient id={`collar-grad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={secondaryColor} />
          <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.85" />
        </linearGradient>

        {/* Sombra de profundidade interna para a nuca */}
        <radialGradient id={`neck-shadow-${uniqueId}`} cx="50%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </radialGradient>
      </defs>

      {/* ─── Cabide Decorativo de Vestiário (Opcional) ───────────────────────── */}
      {showHanger && (
        <g opacity="0.8">
          {/* Gancho */}
          <path
            d="M 120,8 C 114,8 110,12 110,16 C 110,21 116,23 120,26 L 120,32"
            fill="none"
            stroke="#a1a1aa"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Barra do cabide */}
          <path
            d="M 80,38 L 120,30 L 160,38"
            fill="none"
            stroke="#71717a"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        </g>
      )}

      {/* ─── Corpo Principal da Camisa (Costas) ───────────────────────────────── */}
      <g id={`jersey-body-${uniqueId}`}>
        {/* Silhueta da Camisa de Futebol (Costas) */}
        <path
          d="
            M 92,26
            C 106,35 134,35 148,26
            L 194,44
            L 228,104
            L 198,124
            L 176,96
            L 174,250
            C 152,256 88,256 66,250
            L 64,96
            L 42,124
            L 12,104
            L 46,44
            Z
          "
          fill={primaryColor}
          stroke={secondaryColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Textura de Sombreamento e Caimento do Tecido */}
        <path
          d="
            M 92,26
            C 106,35 134,35 148,26
            L 194,44
            L 228,104
            L 198,124
            L 176,96
            L 174,250
            C 152,256 88,256 66,250
            L 64,96
            L 42,124
            L 12,104
            L 46,44
            Z
          "
          fill={`url(#fabric-shading-${uniqueId})`}
          pointerEvents="none"
        />
      </g>

      {/* ─── Mangas & Punhos (Secondary Color) ───────────────────────────────── */}
      {/* Punho Manga Esquerda */}
      <path
        d="M 12,104 L 42,124 L 37,131 L 7,111 Z"
        fill={secondaryColor}
        stroke={activeAccentColor}
        strokeWidth="0.8"
      />

      {/* Punho Manga Direita */}
      <path
        d="M 228,104 L 198,124 L 203,131 L 233,111 Z"
        fill={secondaryColor}
        stroke={activeAccentColor}
        strokeWidth="0.8"
      />

      {/* Costuras das Mangas (Estilo Raglan Esportivo) */}
      <path
        d="M 92,26 C 84,52 74,78 64,96"
        fill="none"
        stroke={secondaryColor}
        strokeWidth="1.5"
        strokeDasharray="3,2"
        opacity="0.6"
      />
      <path
        d="M 148,26 C 156,52 166,78 176,96"
        fill="none"
        stroke={secondaryColor}
        strokeWidth="1.5"
        strokeDasharray="3,2"
        opacity="0.6"
      />

      {/* ─── Gola Anatômica (Vista Posterior) ─────────────────────────────────── */}
      {/* Sombra interna da nuca */}
      <path
        d="M 92,26 C 106,38 134,38 148,26 C 138,20 102,20 92,26 Z"
        fill={`url(#neck-shadow-${uniqueId})`}
      />

      {/* Faixa externa da gola (Secondary Color) */}
      <path
        d="
          M 90,26
          C 106,37 134,37 150,26
          C 152,22 148,18 144,18
          C 130,24 110,24 96,18
          C 92,18 88,22 90,26
          Z
        "
        fill={`url(#collar-grad-${uniqueId})`}
        stroke={activeAccentColor}
        strokeWidth="1"
      />

      {/* ─── Barra Inferior da Camisa ────────────────────────────────────────── */}
      <path
        d="M 66,248 C 88,254 152,254 174,248 L 174,250 C 152,256 88,256 66,250 Z"
        fill={secondaryColor}
        opacity="0.75"
      />

      {/* ─── Tipografia Estampada: Nome do Atleta ────────────────────────────── */}
      {displayName && (
        <g id={`jersey-name-${uniqueId}`}>
          {/* Sombra sutil no texto para contraste máximo em camisas claras e escuras */}
          <text
            x="120"
            y="73"
            textAnchor="middle"
            fill="#000000"
            opacity="0.25"
            fontSize={displayName.length > 10 ? "13" : "15"}
            fontWeight="900"
            letterSpacing="2.5"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          >
            {displayName}
          </text>

          <text
            x="120"
            y="72"
            textAnchor="middle"
            fill={activeTextColor}
            fontSize={displayName.length > 10 ? "13" : "15"}
            fontWeight="900"
            letterSpacing="2.5"
            fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
          >
            {displayName}
          </text>
        </g>
      )}

      {/* ─── Tipografia Estampada: Número Central Gigante ─────────────────────── */}
      <g id={`jersey-number-${uniqueId}`}>
        {/* Sombra do número */}
        <text
          x="120"
          y={displayName ? "167" : "155"}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#000000"
          opacity="0.28"
          fontSize={displayNumber.length > 2 ? "68" : "86"}
          fontWeight="900"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"
          letterSpacing="-3"
        >
          {displayNumber}
        </text>

        {/* Número frontal nítido */}
        <text
          x="120"
          y={displayName ? "165" : "153"}
          textAnchor="middle"
          dominantBaseline="central"
          fill={activeTextColor}
          fontSize={displayNumber.length > 2 ? "68" : "86"}
          fontWeight="900"
          fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace"
          letterSpacing="-3"
        >
          {displayNumber}
        </text>
      </g>
    </svg>
  );
}
