import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { WyscoutDropzone } from "@/components/admin/wyscout-dropzone";
import Link from "next/link";
import { ChevronRight, ShieldCheck, Database, Sparkles, Layers, Cpu } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Importação de Planilhas Wyscout | Overview Scout",
  description:
    "Motor Híbrido de Ingestão com Fuzzy Match para enriquecimento de dados estatísticos dos atletas do Brasileirão",
};

export default async function AdminImportPage() {
  const session = await auth();

  // Rota protegida: apenas ANALYST e CLUB (e ADMIN) têm permissão
  if (!session?.user) {
    redirect("/login?callbackUrl=/admin/import");
  }

  const userRole = session.user.role;
  if (userRole !== "ANALYST" && userRole !== "CLUB" && userRole !== "ADMIN") {
    if (userRole === "ATHLETE" && session.user.athleteId) {
      redirect(`/athletes/${session.user.athleteId}`);
    }
    redirect("/");
  }

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto py-2">
      {/* ─── Breadcrumb ───────────────────────────────────────────────────── */}
      <nav className="flex items-center gap-2 text-xs text-zinc-400">
        <Link href="/dashboard" className="hover:text-white transition-colors">
          Início
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <Link href="/athletes" className="hover:text-white transition-colors">
          Atletas
        </Link>
        <ChevronRight className="h-3 w-3 text-zinc-600" />
        <span className="text-emerald-400 font-bold">Importação Wyscout</span>
      </nav>

      {/* ─── Methodological Architecture Cards ────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0c101d]/60 backdrop-blur-md p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Cpu className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Leitura Híbrida (.xlsx / .csv)
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Parser server-side de alto desempenho para planilhas complexas com até 75 indicadores canônicos.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c101d]/60 backdrop-blur-md p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Fuzzy Match & Fusão de Dados
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Algoritmo de similaridade de strings (Dice + Levenshtein) para cruzar automaticamente com a base de 673 atletas.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c101d]/60 backdrop-blur-md p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-white">
              Injeção no Cérebro Tático
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
              Cálculo imediato de Per-90, PAdj e ativação em tempo real das regras das Aulas 1, 2 e 3 do Professor Roberto Torrecilhas.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Main Interactive Dropzone ────────────────────────────────────── */}
      <WyscoutDropzone />
    </div>
  );
}
