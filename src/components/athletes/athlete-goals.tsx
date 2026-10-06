"use client";

import { useState, useTransition } from "react";
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Pencil,
  Check,
  X,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createGoal,
  updateGoalProgress,
  deleteGoal,
} from "@/lib/actions/goals";
import {
  GOAL_CATEGORIES,
  GOAL_UNITS,
  calculateGoalProgress,
  getCategoryBadgeClass,
} from "@/lib/goals";
import { METRICS } from "@/lib/metrics";
import { cn } from "@/lib/utils";

export interface GoalItem {
  id: string;
  athleteId: string;
  title: string;
  metric: string | null;
  currentValue: number;
  targetValue: number;
  unit: string;
  category: string;
  objective: string | null;
  isCompleted: boolean;
  createdAt: Date | string;
}

interface AthleteGoalsProps {
  athleteId: string;
  athleteName: string;
  goals: GoalItem[];
}

export function AthleteGoals({
  athleteId,
  athleteName,
  goals,
}: AthleteGoalsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Inline edit state
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // Form State
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(GOAL_CATEGORIES[0]);
  const [metric, setMetric] = useState<string>("none");
  const [currentValue, setCurrentValue] = useState<string>("0");
  const [targetValue, setTargetValue] = useState<string>("10");
  const [unit, setUnit] = useState<string>("absoluto");
  const [objective, setObjective] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Category counts
  const categoryCounts = goals.reduce<Record<string, number>>((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + 1;
    return acc;
  }, {});

  const presentCategories = Object.keys(categoryCounts);

  const completedCount = goals.filter((g) => g.isCompleted || g.currentValue >= g.targetValue).length;

  const filteredGoals =
    selectedCategory === "ALL"
      ? goals
      : goals.filter((g) => g.category === selectedCategory);

  function startInlineEdit(goal: GoalItem) {
    setEditingGoalId(goal.id);
    setEditValue(goal.currentValue);
  }

  function cancelInlineEdit() {
    setEditingGoalId(null);
  }

  function handleSaveInlineEdit(goal: GoalItem) {
    startTransition(async () => {
      try {
        await updateGoalProgress(goal.id, athleteId, Number(editValue));
        setEditingGoalId(null);
      } catch (err: unknown) {
        console.error("Erro ao atualizar progresso da meta:", err);
      }
    });
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    const targetNum = Number(targetValue);
    const currentNum = Number(currentValue);

    if (isNaN(targetNum) || targetNum <= 0) {
      setErrorMsg("A meta deve ser um número maior que zero.");
      return;
    }

    startTransition(async () => {
      try {
        await createGoal({
          athleteId,
          title,
          category,
          metric: metric === "none" ? undefined : metric,
          currentValue: isNaN(currentNum) ? 0 : currentNum,
          targetValue: targetNum,
          unit,
          objective: objective || undefined,
        });

        // Reset
        setTitle("");
        setCategory(GOAL_CATEGORIES[0]);
        setMetric("none");
        setCurrentValue("0");
        setTargetValue("10");
        setUnit("absoluto");
        setObjective("");
        setIsAddOpen(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Erro ao criar meta";
        setErrorMsg(msg);
      }
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja remover esta meta de desenvolvimento?")) return;

    startTransition(async () => {
      await deleteGoal(id, athleteId);
    });
  }

  return (
    <Card className="rounded-2xl border border-border-strong bg-bg-surface p-6 shadow-md" id="athlete-goals">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-xs">
            <Target className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-foreground font-serif">
                Metas de Desenvolvimento & KPIs
              </h2>
              <Badge variant="outline" className="text-[10px] font-mono px-2 py-0 border-white/10 text-muted-foreground">
                {completedCount}/{goals.length} atingidas
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Acompanhamento de objetivos táticos, técnicos e físicos com atualização rodada a rodada
            </p>
          </div>
        </div>

        {/* Add Button */}
        <Button
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-sm shadow-emerald-600/20 rounded-xl"
        >
          <Plus className="h-3.5 w-3.5" />
          Nova Meta
        </Button>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[540px] bg-[#0d1017] border border-white/15 text-foreground shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-black flex items-center gap-2 font-serif">
              <Target className="h-4 w-4 text-emerald-400" />
              Nova Meta de Desenvolvimento &bull; {athleteName}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-4 pt-2">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Título do Objetivo *
              </label>
              <Input
                type="text"
                placeholder="Ex: Alcançar 15 gols na temporada"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="bg-black/30 border-white/10 text-xs focus:border-emerald-500"
              />
            </div>

            {/* Category & Metric */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Categoria *
                </label>
                <Select value={category} onValueChange={(val) => setCategory(val ?? GOAL_CATEGORIES[0])}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-xs w-full">
                    <SelectValue placeholder="Selecione categoria" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12151e] border-white/15 text-foreground">
                    {GOAL_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat} className="text-xs">
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Métrica Vinculada (Opcional)
                </label>
                <Select value={metric} onValueChange={(val) => setMetric(val ?? "none")}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-xs w-full">
                    <SelectValue placeholder="Sem métrica vinculada" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12151e] border-white/15 text-foreground max-h-56">
                    <SelectItem value="none" className="text-xs">
                      Objetivo Livre / Sem Métrica
                    </SelectItem>
                    {METRICS.map((m) => (
                      <SelectItem key={m.key} value={m.key} className="text-xs">
                        {m.label} ({m.group})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Current Value, Target Value, Unit */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Valor Atual *
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={currentValue}
                  onChange={(e) => setCurrentValue(e.target.value)}
                  required
                  className="bg-black/30 border-white/10 text-xs focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Meta Alvo *
                </label>
                <Input
                  type="number"
                  step="any"
                  placeholder="10"
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  required
                  className="bg-black/30 border-white/10 text-xs focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Unidade *
                </label>
                <Select value={unit} onValueChange={(val) => setUnit(val ?? "absoluto")}>
                  <SelectTrigger className="bg-black/30 border-white/10 text-xs w-full">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#12151e] border-white/15 text-foreground">
                    {GOAL_UNITS.map((u) => (
                      <SelectItem key={u.value} value={u.value} className="text-xs">
                        {u.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Objective Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Orientações do Treinador / Scout (Opcional)
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Incentivar infiltrações diagonais nas costas da linha de 4 adversária para aumentar volume de finalização..."
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="w-full rounded-lg bg-black/30 border border-white/10 p-2.5 text-xs text-foreground placeholder:text-zinc-600 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAddOpen(false)}
                disabled={isPending}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Salvando...
                  </>
                ) : (
                  "Criar Meta"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Category Pills Filter */}
      {goals.length > 0 && presentCategories.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setSelectedCategory("ALL")}
            className={cn(
              "rounded-lg text-xs font-bold px-3 py-1 h-7 shrink-0 transition-colors",
              selectedCategory === "ALL"
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            )}
          >
            Todas ({goals.length})
          </Button>

          {presentCategories.map((cat) => (
            <Button
              key={cat}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "rounded-lg text-xs font-bold px-3 py-1 h-7 shrink-0 transition-colors",
                selectedCategory === cat
                  ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              )}
            >
              {cat} ({categoryCounts[cat]})
            </Button>
          ))}
        </div>
      )}

      {/* Goals Grid */}
      {filteredGoals.length === 0 ? (
        <div className="py-12 px-4 text-center">
          <div className="mx-auto h-12 w-12 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-center text-zinc-500 mb-3">
            <Target className="h-6 w-6 opacity-60" />
          </div>
          <h3 className="text-sm font-bold text-zinc-300">Nenhuma meta cadastrada</h3>
          <p className="text-xs text-zinc-500 max-w-md mx-auto mt-1 mb-4">
            Defina metas de desenvolvimento para {athleteName} e acompanhe o progresso rodada a rodada com edição rápida.
          </p>
          <Button
            size="sm"
            onClick={() => setIsAddOpen(true)}
            variant="outline"
            className="text-xs font-bold border-white/15 gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Criar Primeira Meta
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
          {filteredGoals.map((goal) => {
            const progress = calculateGoalProgress(goal.currentValue, goal.targetValue);
            const isEditing = editingGoalId === goal.id;

            return (
              <div
                key={goal.id}
                className={cn(
                  "relative rounded-xl border p-4.5 shadow-sm transition-all flex flex-col justify-between",
                  progress.isCompleted
                    ? "bg-gradient-to-b from-emerald-950/20 to-[#0b1410]/60 border-emerald-500/30 shadow-emerald-500/5"
                    : "bg-gradient-to-b from-[#131724]/90 to-[#0b0e17]/90 border-white/[0.09] hover:border-white/20"
                )}
              >
                <div>
                  {/* Top Bar: Category & Status Badge */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", getCategoryBadgeClass(goal.category))}
                    >
                      {goal.category}
                    </Badge>

                    {progress.isCompleted ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                        Meta Batida!
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-white/[0.05] text-zinc-400 border border-white/10">
                        <TrendingUp className="h-3 w-3 text-zinc-400" />
                        {progress.rawPercent}% atingido
                      </span>
                    )}
                  </div>

                  {/* Title & Metric Tag */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-black text-white leading-tight">
                      {goal.title}
                    </h4>
                  </div>

                  {goal.metric && (
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase mt-1">
                      Métrica: <span className="text-indigo-400">{goal.metric}</span>
                    </p>
                  )}

                  {/* Progress Numbers & Inline Edit */}
                  <div className="mt-3.5 mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-emerald-500/40">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditValue((prev) => Math.max(0, Number((prev - 1).toFixed(1))))}
                            className="h-6 w-6 text-zinc-300 hover:text-white"
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            step="any"
                            value={editValue}
                            onChange={(e) => setEditValue(Number(e.target.value))}
                            className="h-6 w-16 text-center text-xs font-mono font-bold bg-transparent border-none p-0 focus:ring-0"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveInlineEdit(goal);
                              if (e.key === "Escape") cancelInlineEdit();
                            }}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => setEditValue((prev) => Number((prev + 1).toFixed(1)))}
                            className="h-6 w-6 text-zinc-300 hover:text-white"
                          >
                            +
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            onClick={() => handleSaveInlineEdit(goal)}
                            disabled={isPending}
                            className="h-6 w-6 bg-emerald-600 hover:bg-emerald-500 text-white ml-1"
                            title="Salvar (Enter)"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={cancelInlineEdit}
                            className="h-6 w-6 text-zinc-400 hover:text-white"
                            title="Cancelar (Esc)"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div
                          onClick={() => startInlineEdit(goal)}
                          className="group/val cursor-pointer flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/20 hover:bg-white/[0.06] border border-white/[0.06] hover:border-emerald-500/30 transition-all"
                          title="Clique para atualizar o valor da rodada"
                        >
                          <span className={cn("text-base font-black font-mono tabular-nums", progress.colorClass)}>
                            {goal.currentValue}
                          </span>
                          <span className="text-xs font-mono text-zinc-500">
                            / {goal.targetValue} {goal.unit !== "absoluto" ? goal.unit : ""}
                          </span>
                          <Pencil className="h-2.5 w-2.5 text-zinc-600 group-hover/val:text-emerald-400 opacity-0 group-hover/val:opacity-100 transition-opacity ml-0.5" />
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <span className={cn("text-xs font-black font-mono tabular-nums", progress.colorClass)}>
                        {progress.rawPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-zinc-800/80 border border-white/[0.05]">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500 ease-out",
                        progress.progressBarClass,
                        progress.isCompleted && "shadow-[0_0_12px_rgba(16,185,129,0.6)]"
                      )}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>

                  {/* Objective text notes */}
                  {goal.objective && (
                    <p className="text-xs text-zinc-400 mt-3 line-clamp-2 leading-relaxed bg-black/20 p-2 rounded-lg border border-white/[0.04]">
                      {goal.objective}
                    </p>
                  )}
                </div>

                {/* Footer Action Bar */}
                <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
                  <span className="font-mono text-[10px]">
                    {isEditing ? "Pressione Enter para salvar" : "Clique no número para edição rápida"}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(goal.id)}
                    disabled={isPending}
                    className="h-6 w-6 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Excluir meta"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
