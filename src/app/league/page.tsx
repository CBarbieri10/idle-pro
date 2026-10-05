import { getCatalogAthletes } from "@/lib/actions/catalog";
import { getTeams } from "@/lib/actions/teams";
import { getPortfolioAthleteIds } from "@/lib/actions/portfolio";
import { LeagueCatalog } from "@/components/catalog/league-catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Catálogo da Liga | The Net Scouting",
  description: "Browse de atletas da liga com métricas Per-90, filtros avançados e comparação lado a lado",
};

export default async function LeagueCatalogPage() {
  const [catalogData, teams, portfolioAthleteIds] = await Promise.all([
    getCatalogAthletes(),
    getTeams(),
    getPortfolioAthleteIds(),
  ]);

  const teamOptions = teams.map((t) => ({ id: t.id, name: t.name }));

  return (
    <LeagueCatalog
      initialAthletes={catalogData.athletes}
      teams={teamOptions}
      initialPortfolioIds={portfolioAthleteIds}
    />
  );
}

