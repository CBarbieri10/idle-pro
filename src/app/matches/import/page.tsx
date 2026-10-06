import { getTeams } from "@/lib/actions/teams";
import { getMappingTemplates } from "@/lib/actions/templates";
import { SpreadsheetImporter } from "@/components/import/spreadsheet-importer";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Importação de Métricas | The Net Scouting",
  description: "Importação de métricas por arquivo Excel ou CSV com área de revisão e resolução de atletas",
};

export default async function ImportMatchesPage() {
  const [teams, templates] = await Promise.all([
    getTeams(),
    getMappingTemplates(),
  ]);
  const teamOptions = teams.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/matches" className="hover:text-foreground transition-colors">
          Jogos
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">Importar Planilha</span>
      </nav>

      {/* Main Importer Flow */}
      <SpreadsheetImporter teams={teamOptions} initialTemplates={templates} />
    </div>
  );
}
