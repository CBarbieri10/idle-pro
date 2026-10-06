import { getCatalogAthletes } from "@/lib/actions/catalog";
import { LeagueLabView } from "@/components/catalog/league-lab-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Laboratório Analítico 2D (Moneyball) | The Net Scouting",
  description:
    "Matrizes de dispersão multidimensionais e detecção de anomalias estatísticas com medianas cruzadas",
};

export default async function LeagueLabPage() {
  const catalogData = await getCatalogAthletes();

  return <LeagueLabView athletes={catalogData.athletes} />;
}
