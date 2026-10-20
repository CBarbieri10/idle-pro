"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Bookmark,
  FolderPlus,
  Trash2,
  ExternalLink,
  Save,
  Check,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  Compass,
  FileText,
  Clock,
  Layers,
  Shield,
  Loader2,
  Calendar,
} from "lucide-react";
import {
  type ShadowBoardPortfolioSummary,
  type ShadowBoardAthleteItem,
  createPortfolio,
  deletePortfolio,
  removeAthleteFromPortfolio,
  updatePortfolioItemNotes,
} from "@/lib/actions/portfolios";
import { getClubColors } from "@/lib/club-colors";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface PortfolioManagerViewProps {
  portfolios: ShadowBoardPortfolioSummary[];
  activePortfolio: ShadowBoardPortfolioSummary;
  items: ShadowBoardAthleteItem[];
}

export function PortfolioManagerView({
  portfolios,
  activePortfolio,
  items,
}: PortfolioManagerViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Modal para criar novo portfólio
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Estado local para deleção de portfólio
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Manipulador de criação de portfólio
  function handleCreatePortfolio() {
    if (!newTitle.trim()) return;

    startTransition(async () => {
      const res = await createPortfolio({
        name: newTitle.trim(),
        description: newDesc.trim() || undefined,
      });

      if (res.ok && res.portfolio) {
        setNewTitle("");
        setNewDesc("");
        setCreateModalOpen(false);
        router.push(`/market/portfolios?portfolioId=${res.portfolio.id}`);
      }
    });
  }

  // Manipulador de deleção de portfólio
  function handleDeletePortfolio() {
    startTransition(async () => {
      await deletePortfolio(activePortfolio.id);
      setDeleteConfirmOpen(false);
      router.push("/market/portfolios");
    });
  }

  // Manipulador de remoção de atleta
  function handleRemoveAthlete(athleteId: string) {
    startTransition(async () => {
      await removeAthleteFromPortfolio(activePortfolio.id, athleteId);
    });
  }

  return (
    <div className="space-y-6">
      {/* ─── Abas Horizontais dos Portfólios (Shortlists) ───────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-2 min-w-max py-1">
          {portfolios.map((p) => {
            const isActive = p.id === activePortfolio.id;
            return (
              <Link
                key={p.id}
                href={`/market/portfolios?portfolioId=${p.id}`}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border shrink-0",
                  isActive
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300 shadow-[0_0_16px_rgba(245,158,11,0.2)]"
                    : "bg-white/[0.03] border-white/[0.08] text-zinc-400 hover:text-white hover:bg-white/[0.07]"
                )}
              >
                <Bookmark
                  className={cn(
                    "h-3.5 w-3.5",
                    isActive ? "text-amber-400 fill-amber-400/20" : "text-zinc-500"
                  )}
                />
                <span>{p.name}</span>
                <span
                  className={cn(
                    "text-[10px] font-mono px-1.5 py-0.2 rounded-md font-extrabold",
                    isActive ? "bg-amber-400 text-black" : "bg-white/10 text-zinc-400"
                  )}
                >
                  {p.itemCount}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Botão para Nova Shortlist */}
        <Button
          onClick={() => setCreateModalOpen(true)}
          size="sm"
          className="rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs gap-1.5 shrink-0 shadow-md"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          <span>Nova Shortlist</span>
        </Button>
      </div>

      {/* ─── Banner Executivo do Portfólio Ativo ────────────────────────────── */}
      <div className="rounded-2xl border border-white/10 bg-[#0c101d]/85 backdrop-blur-xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
              Shortlist Estratégica
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {items.length} {items.length === 1 ? "atleta monitorado" : "atletas monitorados"}
            </span>
          </div>

          <h2 className="text-xl font-black text-white mt-1">{activePortfolio.name}</h2>
          {activePortfolio.description && (
            <p className="text-xs text-zinc-400 mt-0.5 max-w-2xl">
              {activePortfolio.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <Link
            href="/athletes"
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-zinc-200 transition-all"
          >
            <Compass className="h-3.5 w-3.5 text-emerald-400" />
            <span>Buscar Atletas</span>
          </Link>

          {portfolios.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmOpen(true)}
              className="rounded-xl border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold"
              title="Excluir este portfólio"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          )}
        </div>
      </div>

      {/* ─── Tabela Executiva do Shadow Board ───────────────────────────────── */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-[#0c101d]/50 p-12 text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
            <Bookmark className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Nenhum atleta nesta shortlist ainda
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
              Utilize o Motor de Busca Avançada da Liga para filtrar jogadores por Z-Score,
              estabilidade IDG e biometria, e clique no marcador para salvá-los aqui.
            </p>
          </div>
          <Link
            href="/athletes"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg transition-all"
          >
            <Compass className="h-4 w-4" />
            <span>Explorar Catálogo da Liga</span>
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-[#0c101d]/85 backdrop-blur-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02] text-[11px] font-mono uppercase text-zinc-400 tracking-wider">
                  <th className="py-3 px-4">Atleta</th>
                  <th className="py-3 px-3">Clube Canônico</th>
                  <th className="py-3 px-3">Posição</th>
                  <th className="py-3 px-3 text-center">Z-Score Térmico</th>
                  <th className="py-3 px-3 min-w-[240px]">Nota de Observação (Scout Note)</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-xs">
                {items.map((item) => {
                  const a = item.athlete;
                  const clubColors = getClubColors(a.team?.name);

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-white/[0.03] transition-colors group"
                    >
                      {/* Atleta: Foto, Nome e Idade */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 shrink-0 flex items-center justify-center">
                            {a.photoUrl ? (
                              <Image
                                src={a.photoUrl}
                                alt={a.name}
                                fill
                                className="object-cover"
                                sizes="40px"
                              />
                            ) : (
                              <span className="font-mono font-bold text-xs text-zinc-400">
                                {a.name
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <Link
                              href={`/athletes/${a.id}`}
                              className="font-black text-white hover:text-emerald-400 transition-colors block truncate max-w-[160px]"
                            >
                              {a.name}
                            </Link>
                            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              {a.age ? <span>{a.age} anos</span> : null}
                              {a.height ? (
                                <>
                                  <span>&bull;</span>
                                  <span>{a.height}cm</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Clube Canônico */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          {a.team?.logoUrl ? (
                            <div className="h-5 w-5 relative overflow-hidden rounded">
                              <img
                                src={a.team.logoUrl}
                                alt={a.team.name}
                                className="h-full w-full object-contain"
                              />
                            </div>
                          ) : (
                            <div
                              className="h-4 w-4 rounded-full border flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: clubColors.primaryColor,
                                borderColor: clubColors.secondaryColor,
                              }}
                            >
                              <Shield className="h-2 w-2 text-white" />
                            </div>
                          )}
                          <span
                            className="font-bold text-[11px] truncate max-w-[110px]"
                            style={{
                              color:
                                clubColors.primaryColor === "#ffffff"
                                  ? "#ffffff"
                                  : clubColors.primaryColor,
                            }}
                          >
                            {a.team?.shortName || a.team?.name || "Sem Clube"}
                          </span>
                        </div>
                      </td>

                      {/* Posição Tática */}
                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 border-white/15 text-zinc-300"
                        >
                          {a.positionLabel}
                        </Badge>
                      </td>

                      {/* Z-Score Térmico e IDG */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={cn(
                              "font-mono font-black text-xs px-2 py-0.5 rounded-md border",
                              a.isNegative
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.15)]"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                            )}
                          >
                            Z {a.zScore}
                          </span>
                          {a.idgScore != null && (
                            <span className="text-[10px] font-mono text-zinc-400 mt-0.5">
                              IDG: {a.idgScore.toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Nota de Observação (Scout Note) Editável */}
                      <td className="py-3 px-3">
                        <PortfolioItemNotesCell
                          portfolioId={activePortfolio.id}
                          athleteId={a.id}
                          initialNotes={item.notes || ""}
                        />
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/athletes/${a.id}`}
                            className="h-8 px-2.5 rounded-lg border border-white/10 bg-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-zinc-300 hover:text-emerald-300 text-xs font-bold inline-flex items-center gap-1 transition-all"
                            title="Abrir Dossiê Completo"
                          >
                            <span>Dossiê</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleRemoveAthlete(a.id)}
                            disabled={isPending}
                            className="h-8 w-8 rounded-lg border border-white/5 bg-black/40 hover:bg-rose-500/20 hover:border-rose-500/30 text-zinc-500 hover:text-rose-300 flex items-center justify-center transition-colors disabled:opacity-40"
                            title="Remover desta shortlist"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Modal para Criar Novo Portfólio ─────────────────────────────────── */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-md bg-[#0c101d] border border-white/10 text-white rounded-2xl p-5 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-white/[0.08]">
            <DialogTitle className="text-sm font-black text-white flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-amber-400" />
              <span>Criar Nova Shortlist (Shadow Board)</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-0.5">
              Defina o nome da lista para agrupar e monitorar alvos de contratação.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 font-mono uppercase">
                Nome da Shortlist:
              </label>
              <Input
                placeholder="Ex: Alvos Laterais - Janela de Inverno"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="h-9 text-xs bg-black/50 border-white/10 text-white placeholder:text-zinc-500 rounded-xl"
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-zinc-300 font-mono uppercase">
                Descrição ou Objetivo (Opcional):
              </label>
              <Input
                placeholder="Ex: Laterais sub-23 com Z-score positivo para reposição imediata"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="h-9 text-xs bg-black/50 border-white/10 text-white placeholder:text-zinc-500 rounded-xl"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCreateModalOpen(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreatePortfolio}
              disabled={!newTitle.trim() || isPending}
              className="text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-xl"
            >
              {isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              ) : (
                <FolderPlus className="h-3.5 w-3.5 mr-1" />
              )}
              <span>Criar Shortlist</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── Modal de Confirmação para Excluir Portfólio ─────────────────────── */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm bg-[#0c101d] border border-rose-500/30 text-white rounded-2xl p-5 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-black text-white flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              <span>Excluir Shortlist?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-1">
              Tem certeza de que deseja excluir o portfólio{" "}
              <strong className="text-white">"{activePortfolio.name}"</strong>? Todos os
              vínculos de atletas salvos nesta lista serão removidos em cascata.
            </DialogDescription>
          </DialogHeader>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirmOpen(false)}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleDeletePortfolio}
              disabled={isPending}
              className="text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : null}
              <span>Confirmar Exclusão</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/**
 * Célula de edição rápida de Notas de Observação do Scout
 */
function PortfolioItemNotesCell({
  portfolioId,
  athleteId,
  initialNotes,
}: {
  portfolioId: string;
  athleteId: string;
  initialNotes: string;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaved, setIsSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (notes === initialNotes) return;

    startTransition(async () => {
      await updatePortfolioItemNotes(portfolioId, athleteId, notes);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    });
  }

  return (
    <div className="relative flex items-center gap-1.5">
      <Input
        value={notes}
        onChange={(e) => {
          setNotes(e.target.value);
          setIsSaved(false);
        }}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSave();
          }
        }}
        placeholder="Adicionar nota de scout..."
        className="h-8 text-xs bg-black/40 border-white/10 text-zinc-200 placeholder:text-zinc-600 rounded-lg pr-7 focus-visible:ring-amber-500"
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-amber-400" />
        ) : isSaved ? (
          <Check className="h-3 w-3 text-emerald-400" />
        ) : notes !== initialNotes ? (
          <button
            type="button"
            onClick={handleSave}
            className="text-[10px] text-amber-400 hover:text-amber-300 font-bold"
            title="Salvar nota"
          >
            <Save className="h-3 w-3" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
