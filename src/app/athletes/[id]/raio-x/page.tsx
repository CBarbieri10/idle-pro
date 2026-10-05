import { notFound } from "next/navigation";
import Link from "next/link";
import { getAthleteById } from "@/lib/actions/athletes";
import { getAthleteStatsForProfile } from "@/lib/actions/portfolio";
import { AthleteRaioXSheet } from "@/components/reports/athlete-raio-x-sheet";
import { PrintTriggerButton } from "@/components/reports/print-trigger-button";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const athlete = await getAthleteById(id);
  if (!athlete) return { title: "Dossiê Raio-X" };
  return {
    title: `Dossiê Raio-X — ${athlete.name} | The Net Scouting`,
    description: `Relatório executivo confidencial de scouting para ${athlete.name}`,
  };
}

export default async function AthleteRaioXPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [athlete, athleteStats] = await Promise.all([
    getAthleteById(id),
    getAthleteStatsForProfile(id),
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
    },
    totalMinutes: athleteStats?.totalMinutes ?? 0,
    totalMatches: athleteStats?.totalMatches ?? 0,
    canonicalMetrics: athleteStats?.metrics ?? {},
    recentMatches: athleteStats?.recentMatches ?? [],
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-foreground py-6 px-4 print:p-0 print:bg-white print:text-black">
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

      {/* A4 Sheet Container */}
      <div className="max-w-[210mm] mx-auto bg-white text-black shadow-2xl rounded-xl p-8 print:p-0 print:shadow-none print:rounded-none print:w-full print:max-w-none">
        <AthleteRaioXSheet athlete={raioXData} />
      </div>
    </div>
  );
}
