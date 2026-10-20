import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  getUserPortfolios,
  getPortfolioDetails,
} from "@/lib/actions/portfolios";
import { PortfolioManagerView } from "@/components/portfolio/portfolio-manager-view";
import { Bookmark, Shield, Sparkles, FolderKanban } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shadow Board • Gestão de Portfólios | Overview Scout",
  description:
    "A Sala do Diretor: Gestão de shortlists estratégicas, anotações de observação e monitoramento de alvos prioritários de mercado.",
};

export default async function MarketPortfoliosPage({
  searchParams,
}: {
  searchParams: Promise<{ portfolioId?: string }>;
}) {
  const session = await auth();

  // Atleta não acessa o Shadow Board / Shortlists de diretoria
  if (session?.user?.role === "ATHLETE") {
    redirect("/");
  }

  const rawParams = await searchParams;
  const requestedPortfolioId = rawParams.portfolioId;

  const portfolios = await getUserPortfolios();

  if (portfolios.length === 0) {
    return null;
  }

  // Define portfólio ativo a partir da URL ou padrão (primeiro da lista)
  const activePortfolio =
    portfolios.find((p) => p.id === requestedPortfolioId) || portfolios[0];

  const { items } = await getPortfolioDetails(activePortfolio.id);

  return (
    <div className="space-y-6 w-full">
      {/* ─── Header Executivo: A Sala do Diretor ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 border border-amber-500/30 uppercase tracking-wider font-mono">
              <FolderKanban className="h-3 w-3" /> Shadow Board &bull; A Sala do Diretor
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {portfolios.length} {portfolios.length === 1 ? "shortlist ativa" : "shortlists ativas"}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2">
            Gestão de Portfólios &amp; Shortlists
          </h1>

          <p className="text-xs text-zinc-400 mt-0.5">
            Organize alvos de mercado descobertos no motor de busca, adicione observações
            técnicas confidenciais e acompanhe o Z-Score dinâmico dos atletas prioritários.
          </p>
        </div>
      </div>

      {/* ─── Visão do Gerenciador de Portfólios ───────────────────────────── */}
      <Suspense fallback={<div className="h-96 rounded-2xl bg-white/5 animate-pulse" />}>
        <PortfolioManagerView
          portfolios={portfolios}
          activePortfolio={activePortfolio}
          items={items}
        />
      </Suspense>
    </div>
  );
}
