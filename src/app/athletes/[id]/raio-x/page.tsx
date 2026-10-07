import { notFound } from "next/navigation";
import Link from "next/link";
import { getAthleteById } from "@/lib/actions/athletes";
import { getAthleteStatsForProfile } from "@/lib/actions/portfolio";
import { getGoalsByAthlete } from "@/lib/actions/goals";
import { getVideoLinksByAthlete } from "@/lib/actions/video-links";
import {
  AthleteDossier,
  DEFAULT_PAGE_SELECTION,
  type DossierPageSelection,
} from "@/components/reports/dossier-builder";
import { PrintTriggerButton } from "@/components/reports/print-trigger-button";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const athlete = await getAthleteById(id);
  if (!athlete) return { title: "Dossiê Executivo" };
  return {
    title: `Dossiê Executivo (4 Páginas) — ${athlete.name} | The Net Scouting`,
    description: `Relatório executivo confidencial de scouting para ${athlete.name}`,
  };
}

export default async function AthleteRaioXPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pages?: string }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const pagesList = typeof search?.pages === "string" ? search.pages.split(",") : null;

  const pageSelection: DossierPageSelection = pagesList
    ? {
        cover: pagesList.includes("cover"),
        xray: pagesList.includes("xray"),
        analysis: pagesList.includes("analysis"),
        goals: pagesList.includes("goals"),
      }
    : DEFAULT_PAGE_SELECTION;

  const [athlete, athleteStats, goals, videoLinks] = await Promise.all([
    getAthleteById(id),
    getAthleteStatsForProfile(id),
    getGoalsByAthlete(id),
    getVideoLinksByAthlete(id),
  ]);

  if (!athlete) notFound();

  const raioXData = {
    id: athlete.id,
    name: athlete.name,
    position: athlete.position,
    birthDate: athlete.birthDate,
    nationality: athlete.nationality,
    height: athlete.height,
    weight: athlete.weight,
    footPreference: athlete.footPreference,
    photoUrl: athlete.photoUrl,
    photoHasAlpha: athlete.photoHasAlpha,
    actionPhotoUrl: athlete.actionPhotoUrl,
    team: {
      id: athlete.team.id,
      name: athlete.team.name,
      shortName: athlete.team.shortName,
      logoUrl: athlete.team.logoUrl,
    },
    totalMinutes: athleteStats?.totalMinutes ?? 0,
    totalMatches: athleteStats?.totalMatches ?? 0,
    canonicalMetrics: athleteStats?.metrics ?? {},
    recentMatches: athleteStats?.recentMatches ?? [],
    goals,
    videoLinks,
    idgScore: athlete.idgScore,
    stabilityCategory: athlete.stabilityCategory,
    analysisNotes: {
      tacticalTitle: athlete.tacticalTitle ?? undefined,
      tacticalSummary: athlete.tacticalSummary ?? undefined,
      strengths: athlete.tacticalStrengths.length > 0 ? athlete.tacticalStrengths : undefined,
      weaknesses: athlete.tacticalWeaknesses.length > 0 ? athlete.tacticalWeaknesses : undefined,
    },
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground py-6 px-4 print:p-0 print:bg-[#fdfcf8] print:text-black">
      {/* Top action bar (hidden during print) */}
      <div className="max-w-[210mm] mx-auto mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/athletes/${athlete.id}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o perfil de {athlete.name}
        </Link>

        <div className="flex items-center gap-2">
          <PrintTriggerButton />
        </div>
      </div>

      {/* A4 Dossier Multi-page Container */}
      <div className="max-w-[210mm] mx-auto print:p-0 print:w-full print:max-w-none">
        <AthleteDossier athlete={raioXData} pageSelection={pageSelection} />
      </div>
    </div>
  );
}
