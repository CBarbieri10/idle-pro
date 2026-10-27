"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Plus,
  Loader2,
  FolderPlus,
  Check,
  FileText,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  getUserPortfolios,
  getAthletePortfolios,
  addAthleteToPortfolio,
  removeAthleteFromPortfolio,
  createPortfolio,
  type ShadowBoardPortfolioSummary,
} from "@/lib/actions/portfolios";
import { cn } from "@/lib/utils";

interface AddToPortfolioDialogProps {
  athleteId: string;
  athleteName: string;
  athletePosition?: string;
  athleteClub?: string;
  variant?: "icon" | "button" | "card";
  className?: string;
}

export function AddToPortfolioDialog({
  athleteId,
  athleteName,
  athletePosition,
  athleteClub,
  variant = "icon",
  className,
}: AddToPortfolioDialogProps) {
  const [open, setOpen] = useState(false);
  const [portfolios, setPortfolios] = useState<ShadowBoardPortfolioSummary[]>([]);
  const [assignedPortfolioIds, setAssignedPortfolioIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Criação de novo portfólio inline
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPortfolioName, setNewPortfolioName] = useState("");
  const [newPortfolioDesc, setNewPortfolioDesc] = useState("");
  const [notes, setNotes] = useState("");

  const isSavedInAny = assignedPortfolioIds.length > 0;

  // Carrega dados quando o modal é aberto
  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([getUserPortfolios(), getAthletePortfolios(athleteId)])
        .then(([allPortfolios, savedIds]) => {
          setPortfolios(allPortfolios);
          setAssignedPortfolioIds(savedIds);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [open, athleteId]);

  // Alterna vínculo do atleta com um portfólio
  function handleTogglePortfolio(portfolioId: string) {
    const isCurrentlyAssigned = assignedPortfolioIds.includes(portfolioId);

    // Otimista
    if (isCurrentlyAssigned) {
      setAssignedPortfolioIds((prev) => prev.filter((id) => id !== portfolioId));
    } else {
      setAssignedPortfolioIds((prev) => [...prev, portfolioId]);
    }

    startTransition(async () => {
      try {
        if (isCurrentlyAssigned) {
          await removeAthleteFromPortfolio(portfolioId, athleteId);
        } else {
          await addAthleteToPortfolio(portfolioId, athleteId, notes);
        }
      } catch (err) {
        console.error("Erro ao sincronizar portfólio:", err);
        // Reverte em caso de erro
        if (isCurrentlyAssigned) {
          setAssignedPortfolioIds((prev) => [...prev, portfolioId]);
        } else {
          setAssignedPortfolioIds((prev) => prev.filter((id) => id !== portfolioId));
        }
      }
    });
  }

  // Cria novo portfólio e adiciona o atleta na hora
  function handleCreateAndAssign() {
    if (!newPortfolioName.trim()) return;

    startTransition(async () => {
      const res = await createPortfolio({
        name: newPortfolioName.trim(),
        description: newPortfolioDesc.trim() || undefined,
      });

      if (res.ok && res.portfolio) {
        const newP = res.portfolio;
        await addAthleteToPortfolio(newP.id, athleteId, notes);

        setPortfolios((prev) => [...prev, { ...newP, itemCount: 1 }]);
        setAssignedPortfolioIds((prev) => [...prev, newP.id]);
        setNewPortfolioName("");
        setNewPortfolioDesc("");
        setIsCreatingNew(false);
      }
    });
  }

  return (
    <>
      {/* ─── Botão Disparador (Trigger) ──────────────────────────────────────── */}
      {variant === "icon" ? (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border",
            isSavedInAny
              ? "bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:bg-amber-500/30"
              : "bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10",
            className
          )}
          title={
            isSavedInAny
              ? `Salvo no Shadow Board (${assignedPortfolioIds.length} lista${
                  assignedPortfolioIds.length > 1 ? "s" : ""
                })`
              : "Adicionar ao Shadow Board (Shortlists)"
          }
        >
          {isSavedInAny ? (
            <BookmarkCheck className="h-4 w-4 fill-amber-400/20 text-amber-400" />
          ) : (
            <Bookmark className="h-4 w-4" />
          )}
        </button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
          className={cn(
            "rounded-xl border font-bold text-xs gap-1.5 transition-all shadow-sm",
            isSavedInAny
              ? "bg-amber-500/15 border-amber-500/40 text-amber-300 hover:bg-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
              : "bg-white/5 border-white/10 text-zinc-200 hover:text-white hover:bg-white/10",
            className
          )}
        >
          {isSavedInAny ? (
            <BookmarkCheck className="h-3.5 w-3.5 fill-amber-400/20 text-amber-400" />
          ) : (
            <Bookmark className="h-3.5 w-3.5" />
          )}
          <span>
            {isSavedInAny
              ? `No Shadow Board (${assignedPortfolioIds.length})`
              : "Adicionar ao Shadow Board"}
          </span>
        </Button>
      )}

      {/* ─── Modal / Dialog de Seleção e Criação de Portfólio ───────────────── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-card border border-white/10 text-white rounded-2xl p-5 shadow-2xl">
          <DialogHeader className="pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Bookmark className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-sm font-black text-white truncate flex items-center gap-2">
                  <span>Adicionar ao Shadow Board</span>
                  <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] font-mono px-1.5 py-0">
                    Shortlist
                  </Badge>
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 truncate mt-0.5">
                  Salvar <strong className="text-white">{athleteName}</strong> em suas
                  listas estratégicas
                </DialogDescription>
              </div>
            </div>

            {/* Ficha rápida do Atleta */}
            {(athletePosition || athleteClub) && (
              <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/[0.04] text-[11px] text-zinc-400">
                {athletePosition && (
                  <span className="font-semibold text-zinc-300">{athletePosition}</span>
                )}
                {athletePosition && athleteClub && <span>&bull;</span>}
                {athleteClub && <span>{athleteClub}</span>}
              </div>
            )}
          </DialogHeader>

          {/* ─── Lista de Portfólios Existentes ──────────────────────────────── */}
          <div className="space-y-3 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-300 font-mono uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-cyan-400" />
                Selecione as Listas:
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {assignedPortfolioIds.length} selecionada
                {assignedPortfolioIds.length === 1 ? "" : "s"}
              </span>
            </div>

            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-zinc-400">
                <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
                <span className="text-xs font-mono">Carregando seus portfólios...</span>
              </div>
            ) : portfolios.length === 0 ? (
              <div className="py-6 text-center text-xs text-zinc-400 bg-white/[0.02] border border-white/5 rounded-xl p-4">
                Nenhum portfólio encontrado. Crie o seu primeiro abaixo!
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {portfolios.map((portfolio) => {
                  const isAssigned = assignedPortfolioIds.includes(portfolio.id);
                  return (
                    <div
                      key={portfolio.id}
                      onClick={() => handleTogglePortfolio(portfolio.id)}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition-all",
                        isAssigned
                          ? "bg-amber-500/15 border-amber-500/50 text-white shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                          : "bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-bold flex items-center gap-1.5">
                          <span className="truncate">{portfolio.name}</span>
                          {isAssigned && (
                            <span className="text-[10px] text-amber-400 font-mono font-bold">
                              (Salvo)
                            </span>
                          )}
                        </div>
                        {portfolio.description && (
                          <p className="text-[10px] text-zinc-400 truncate mt-0.5">
                            {portfolio.description}
                          </p>
                        )}
                      </div>

                      <div
                        className={cn(
                          "h-5 w-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors",
                          isAssigned
                            ? "bg-amber-500 border-amber-400 text-black shadow-sm"
                            : "border-white/20 bg-black/40"
                        )}
                      >
                        {isAssigned && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ─── Campo de Nota de Observação (Scout Note) ─────────────────────── */}
          <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
            <label className="text-[11px] font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="h-3 w-3 text-emerald-400" />
              Nota de Observação (Opcional):
            </label>
            <Input
              placeholder="Ex: Excelente 1v1, contrato expira em dez/26..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-9 text-xs bg-black/50 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-amber-500"
            />
          </div>

          {/* ─── Criar Novo Portfólio na Hora ─────────────────────────────────── */}
          <div className="pt-2 border-t border-white/[0.06]">
            {!isCreatingNew ? (
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-white/20 hover:border-amber-500/50 hover:bg-amber-500/5 text-zinc-300 hover:text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Criar Novo Portfólio na Hora</span>
              </button>
            ) : (
              <div className="p-3 rounded-xl bg-white/[0.03] border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 font-mono uppercase">
                    Novo Portfólio
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-[10px] text-zinc-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <Input
                  placeholder="Nome (ex: Alvos Laterais - Janela de Inverno)"
                  value={newPortfolioName}
                  onChange={(e) => setNewPortfolioName(e.target.value)}
                  className="h-8 text-xs bg-black/60 border-white/15 text-white placeholder:text-zinc-500 rounded-lg"
                  autoFocus
                />

                <Input
                  placeholder="Descrição breve (opcional)"
                  value={newPortfolioDesc}
                  onChange={(e) => setNewPortfolioDesc(e.target.value)}
                  className="h-8 text-xs bg-black/60 border-white/15 text-white placeholder:text-zinc-500 rounded-lg"
                />

                <Button
                  type="button"
                  size="sm"
                  onClick={handleCreateAndAssign}
                  disabled={!newPortfolioName.trim() || isPending}
                  className="w-full h-8 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black rounded-lg gap-1.5 shadow-md"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <FolderPlus className="h-3.5 w-3.5" />
                  )}
                  <span>Criar &amp; Salvar Atleta</span>
                </Button>
              </div>
            )}
          </div>

          {/* ─── Botão de Fechar / Concluir ───────────────────────────────────── */}
          <div className="pt-2 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="px-4 text-xs font-bold bg-white/10 hover:bg-white/20 text-white rounded-xl"
            >
              Concluído
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
