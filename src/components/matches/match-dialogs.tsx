"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createMatch, updateMatch, deleteMatch, type MatchInput } from "@/lib/actions/matches";
import {
  VENUE_LABELS,
  OUTCOME_LABELS,
  OUTCOME_STYLES,
  matchOutcome,
  toDateInput,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { MatchVenue } from "@prisma/client";

export type Option = { id: string; name: string };

export type EditableMatch = {
  id: string;
  date: Date | string;
  teamId: string;
  opponentName: string;
  opponentId: string | null;
  venue: MatchVenue;
  competition: string;
  leagueId: string | null;
  round: string | null;
  goalsFor: number | null;
  goalsAgainst: number | null;
  notes: string | null;
};

const COMMON_COMPETITIONS = [
  "Brasileirão Série A",
  "Brasileirão Série B",
  "Copa do Brasil",
  "Campeonato Estadual",
  "Copa Libertadores",
  "Copa Sul-Americana",
  "Amistoso",
];

const labelCls = "text-xs font-medium text-muted-foreground uppercase tracking-wider";
const fieldCls = "bg-muted/50 border-none";

// ─── Form ────────────────────────────────────────────────────────────────────

export function MatchForm({
  teams,
  leagues,
  match,
  defaultTeamId,
  onSaved,
  onCancel,
}: {
  teams: Option[];
  leagues: Option[];
  match?: EditableMatch;
  defaultTeamId?: string;
  onSaved: (id: string) => void;
  onCancel: () => void;
}) {
  const uid = useId();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [date, setDate] = useState(match ? toDateInput(match.date) : new Date().toISOString().slice(0, 10));
  const [teamId, setTeamId] = useState(match?.teamId ?? defaultTeamId ?? "");
  const [venue, setVenue] = useState<MatchVenue>(match?.venue ?? "HOME");
  const [opponentName, setOpponentName] = useState(match?.opponentName ?? "");
  const [competition, setCompetition] = useState(match?.competition ?? "");
  const [leagueId, setLeagueId] = useState(match?.leagueId ?? "none");
  const [round, setRound] = useState(match?.round ?? "");
  const [goalsFor, setGoalsFor] = useState(match?.goalsFor?.toString() ?? "");
  const [goalsAgainst, setGoalsAgainst] = useState(match?.goalsAgainst?.toString() ?? "");
  const [notes, setNotes] = useState(match?.notes ?? "");

  const outcome = matchOutcome(
    goalsFor === "" ? null : Number(goalsFor),
    goalsAgainst === "" ? null : Number(goalsAgainst)
  );
  const teamName = teams.find((t) => t.id === teamId)?.name ?? "Clube";

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const opponent = teams.find(
      (t) => t.name.toLowerCase() === opponentName.trim().toLowerCase()
    );
    const input: MatchInput = {
      date,
      teamId,
      venue,
      opponentName: opponent?.name ?? opponentName,
      opponentId: opponent?.id ?? null,
      competition,
      leagueId: leagueId === "none" ? null : leagueId,
      round,
      goalsFor,
      goalsAgainst,
      notes,
    };
    startTransition(async () => {
      const res = match ? await updateMatch(match.id, input) : await createMatch(input);
      if (!res.ok) return setError(res.error);
      onSaved(match ? match.id : (res.data as { id: string }).id);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className={labelCls} htmlFor={`${uid}-date`}>Data *</label>
          <Input id={`${uid}-date`} type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={fieldCls} />
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Mando</label>
          <div className="flex h-8 rounded-lg bg-muted/50 p-0.5">
            {(Object.keys(VENUE_LABELS) as MatchVenue[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setVenue(v)}
                className={cn(
                  "flex-1 rounded-md text-xs font-medium transition-all",
                  venue === v ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {VENUE_LABELS[v]}
              </button>
            ))}
          </div>
        </div>

        <div className="col-span-2 space-y-1">
          <label className={labelCls}>Clube de referência *</label>
          <Select
            value={teamId}
            onValueChange={(v) => setTeamId(v ?? "")}
            items={teams.map((t) => ({ value: t.id, label: t.name }))}
          >
            <SelectTrigger className={cn(fieldCls, "w-full")}>
              <SelectValue placeholder="Selecionar clube" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 space-y-1">
          <label className={labelCls} htmlFor={`${uid}-opp`}>Adversário *</label>
          <Input
            id={`${uid}-opp`}
            required
            list={`${uid}-teams`}
            value={opponentName}
            onChange={(e) => setOpponentName(e.target.value)}
            placeholder="Digite ou escolha um clube cadastrado"
            className={fieldCls}
          />
          <datalist id={`${uid}-teams`}>
            {teams.filter((t) => t.id !== teamId).map((t) => <option key={t.id} value={t.name} />)}
          </datalist>
        </div>

        <div className="space-y-1">
          <label className={labelCls} htmlFor={`${uid}-comp`}>Competição *</label>
          <Input
            id={`${uid}-comp`}
            required
            list={`${uid}-comps`}
            value={competition}
            onChange={(e) => setCompetition(e.target.value)}
            placeholder="Brasileirão Série A"
            className={fieldCls}
          />
          <datalist id={`${uid}-comps`}>
            {[...leagues.map((l) => l.name), ...COMMON_COMPETITIONS].map((c) => <option key={c} value={c} />)}
          </datalist>
        </div>

        <div className="space-y-1">
          <label className={labelCls} htmlFor={`${uid}-round`}>Rodada / Fase</label>
          <Input id={`${uid}-round`} value={round} onChange={(e) => setRound(e.target.value)} placeholder="Rodada 12" className={fieldCls} />
        </div>

        <div className="col-span-2 space-y-1">
          <label className={labelCls}>Liga (catálogo)</label>
          <Select
            value={leagueId}
            onValueChange={(v) => setLeagueId(v ?? "none")}
            items={[{ value: "none", label: "Nenhuma" }, ...leagues.map((l) => ({ value: l.id, label: l.name }))]}
          >
            <SelectTrigger className={cn(fieldCls, "w-full")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma</SelectItem>
              {leagues.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Scoreboard */}
        <div className="col-span-2 space-y-1">
          <label className={labelCls}>Resultado</label>
          <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
            <span className="flex-1 truncate text-right text-sm font-semibold">{teamName}</span>
            <Input
              aria-label="Gols pró"
              type="number"
              min={0}
              value={goalsFor}
              onChange={(e) => setGoalsFor(e.target.value)}
              className="h-10 w-14 border-none bg-background/60 text-center text-lg font-bold tabular-nums"
            />
            <span className="text-muted-foreground">×</span>
            <Input
              aria-label="Gols contra"
              type="number"
              min={0}
              value={goalsAgainst}
              onChange={(e) => setGoalsAgainst(e.target.value)}
              className="h-10 w-14 border-none bg-background/60 text-center text-lg font-bold tabular-nums"
            />
            <span className="flex-1 truncate text-sm font-semibold">{opponentName || "Adversário"}</span>
            {outcome && (
              <span className={cn("rounded-md px-2 py-0.5 text-xs font-bold ring-1", OUTCOME_STYLES[outcome])}>
                {OUTCOME_LABELS[outcome]}
              </span>
            )}
          </div>
        </div>

        <div className="col-span-2 space-y-1">
          <label className={labelCls} htmlFor={`${uid}-notes`}>Observações</label>
          <textarea
            id={`${uid}-notes`}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contexto do jogo, escalação, condições..."
            className="w-full resize-none rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:ring-1 focus:ring-ring/50"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={pending || !teamId} id="match-form-submit">
          {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {match ? "Salvar jogo" : "Registrar jogo"}
        </Button>
      </div>
    </form>
  );
}

// ─── Dialog buttons ──────────────────────────────────────────────────────────

export function CreateMatchButton({ teams, leagues }: { teams: Option[]; leagues: Option[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5" id="create-match-button">
            <CalendarPlus className="h-4 w-4" /> Novo Jogo
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Jogo</DialogTitle>
        </DialogHeader>
        <MatchForm
          teams={teams}
          leagues={leagues}
          onSaved={() => { setOpen(false); router.refresh(); }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function EditMatchButton({ match, teams, leagues }: { match: EditableMatch; teams: Option[]; leagues: Option[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Editar jogo" />}>
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Jogo</DialogTitle>
        </DialogHeader>
        <MatchForm
          teams={teams}
          leagues={leagues}
          match={match}
          onSaved={() => { setOpen(false); router.refresh(); }}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

export function DeleteMatchButton({ id, label, metricsCount }: { id: string; label: string; metricsCount: number }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Excluir jogo" className="text-muted-foreground hover:text-destructive" />}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir jogo</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Excluir <span className="font-semibold text-foreground">{label}</span>?
          {metricsCount > 0 && (
            <> As <span className="font-semibold text-foreground">{metricsCount}</span> ficha(s) de métricas vinculadas também serão removidas.</>
          )}
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteMatch(id);
                setOpen(false);
                router.refresh();
              })
            }
          >
            {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
