import Image from "next/image";
import { Shield } from "lucide-react";
import type { ReactNode } from "react";
import { getClubColors, getContrastTextColor } from "@/lib/club-colors";

export interface HeroKpi {
  label: string;
  value: string;
  hint?: string;
}

export interface HeroInfo {
  label: string;
  value: string;
}

interface AthleteHeroProps {
  name: string;
  initials: string;
  positionLabel: string;
  teamName: string | null;
  teamLogoUrl: string | null;
  photoUrl: string | null;
  photoHasAlpha: boolean;
  info: HeroInfo[];
  kpis: HeroKpi[];
  /** Selo de estabilidade, ao lado da posição */
  badges?: ReactNode;
  /** Ações (editar/excluir), canto superior direito */
  actions?: ReactNode;
}

/**
 * Cabeçalho do atleta: fundo na cor do clube (misturada ao grafite), escudo do clube
 * como marca d'água, foto PNG recortada, dados básicos e faixa de números.
 * Sem foto, mostra as iniciais. Clubes de cor clara ganham camada mais escura
 * para manter o contraste do texto branco.
 */
export function AthleteHero({
  name,
  initials,
  positionLabel,
  teamName,
  teamLogoUrl,
  photoUrl,
  photoHasAlpha,
  info,
  kpis,
  badges,
  actions,
}: AthleteHeroProps) {
  const club = getClubColors(teamName);
  const isLightClub = getContrastTextColor(club.primaryColor) === "#111111";
  const primaryShare = isLightClub ? 38 : 60;

  const background = [
    `linear-gradient(115deg,`,
    `color-mix(in srgb, ${club.primaryColor} ${primaryShare}%, var(--bg-app)) 0%,`,
    `color-mix(in srgb, ${club.secondaryColor} 22%, color-mix(in srgb, ${club.primaryColor} 32%, var(--bg-app))) 58%,`,
    `var(--hero-end) 100%)`,
  ].join(" ");

  return (
    <section
      aria-label={`Perfil de ${name}`}
      className="relative overflow-hidden rounded-[10px] border border-border"
      style={{ background }}
    >
      {/* Camada de contraste para o texto branco (mais forte em clubes de cor clara) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(90deg, rgba(0,0,0,${isLightClub ? 0.55 : 0.28}) 0%, rgba(0,0,0,${isLightClub ? 0.35 : 0.1}) 60%, transparent 100%)`,
        }}
      />

      {/* Escudo do clube como marca d'água */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-12 h-[340px] w-[340px] opacity-[0.16]"
      >
        {teamLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={teamLogoUrl} alt="" className="h-full w-full object-contain" />
        ) : (
          <Shield className="h-full w-full text-white" strokeWidth={1} />
        )}
      </div>

      <div className="relative z-10 flex flex-col items-start gap-5 px-6 pt-6 sm:flex-row sm:items-end">
        {/* Foto PNG recortada (ou iniciais) */}
        {photoUrl && photoHasAlpha ? (
          <div className="relative h-[230px] w-[190px] shrink-0 self-center sm:self-end">
            <Image
              src={photoUrl}
              alt={name}
              fill
              priority
              unoptimized
              sizes="190px"
              className="object-contain object-bottom drop-shadow-[0_14px_22px_rgba(0,0,0,0.55)]"
            />
          </div>
        ) : photoUrl ? (
          <div className="relative mb-6 h-[170px] w-[140px] shrink-0 self-center overflow-hidden rounded-[10px] border border-white/20 sm:self-end">
            <Image src={photoUrl} alt={name} fill priority unoptimized sizes="140px" className="object-cover" />
          </div>
        ) : (
          <div className="mb-6 flex h-[150px] w-[150px] shrink-0 items-center justify-center self-center rounded-full border border-white/25 bg-black/30 font-heading text-5xl font-semibold text-white sm:self-end">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-black/35 px-2 py-0.5 text-xs font-medium text-white">
                  {positionLabel}
                </span>
                {badges}
              </div>
              <h1 className="font-heading text-4xl font-semibold leading-none tracking-tight text-white sm:text-5xl">
                {name}
              </h1>
              <p className="mt-2 flex items-center gap-2 text-sm text-white/80">
                {teamLogoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={teamLogoUrl} alt="" className="h-5 w-5 object-contain" />
                ) : (
                  <Shield className="h-4 w-4" />
                )}
                <span>{teamName ?? "Sem clube"}</span>
              </p>
            </div>
            {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
          </div>

          <dl className="mt-4 flex flex-wrap gap-2">
            {info.map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-white/15 bg-black/35 px-3 py-1.5 backdrop-blur-sm"
              >
                <dt className="text-[11px] text-white/60">{item.label}</dt>
                <dd className="text-sm font-medium text-white">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Faixa de números */}
      {kpis.length > 0 && (
        <div className="relative z-10 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-x-4 gap-y-3 border-t border-white/15 bg-black/40 px-6 py-3 backdrop-blur-sm">
          {kpis.map((k) => (
            <div key={k.label} className="min-w-0">
              <p className="truncate text-[11px] text-white/65">{k.label}</p>
              <p className="font-heading text-2xl font-semibold leading-tight text-white tabular-nums">
                {k.value}
              </p>
              {k.hint && <p className="truncate text-[11px] text-white/55 tabular-nums">{k.hint}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
