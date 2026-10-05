"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CalendarPlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
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
import { MatchForm, type Option } from "@/components/matches/match-dialogs";
import { saveRawMetric, deleteRawMetric } from "@/lib/actions/matches";
import {
  METRICS,
  METRIC_BY_KEY,
  METRIC_GROUPS,
  POSITION_PRESETS,
  SOURCE_LABELS,
  VENUE_LABELS,
  formatMatchDate,
  metricLabel,
  sortMetricKeys,
  type MetricData,
} from "@/lib/metrics";
import { cn } from "@/lib/utils";
import type { MatchVenue, MetricSource, Position } from "@prisma/client";

export type MatchOption = {
  id: string;
  date: Date | string;
  opponentName: string;
  competition: string;
  venue: MatchVenue;
  goalsFor: number | null;
  goalsAgainst: number | null;
  teamId: string;
  team: { name: string; shortName: string | null };
};

export type EditableMetric = {
  id: string;
  matchId: string;
  source: MetricSource;
  minutesPlayed: number | null;
  data: MetricData;
};

const labelCls = "text-xs font-medium text-muted-foreground uppercase tracking-wider";
const fieldCls = "bg-muted/50 border-none";

function matchLabel(m: MatchOption) {
  const score = m.goalsFor != null && m.goalsAgainst != null ? ` ${m.goalsFor}×${m.goalsAgainst}` : "";
  return `${formatMatchDate(m.date)} · ${m.team.shortName ?? m.team.name}${score} ${m.opponentName} (${VENUE_LABELS[m.venue]}) — ${m.competition}`;
}

// ─── Form ────────────────────────────────────────────────────────────────────

function MetricForm({
  athleteId,
  athleteTeamId,
  position,
  matches,
  usedMatchIds,
  teams,
  leagues,
  metric,
  onDone,
}: {
  athleteId: string;
  athleteTeamId: string;
  position: Position;
  matches: MatchOption[];
  usedMatchIds: string[];
  teams: Option[];
  leagues: Option[];
  metric?: EditableMetric;
  onDone: () => void;
}) {
  const uid = useId();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [creatingMatch, setCreatingMatch] = useState(false);

  const preset = POSITION_PRESETS[position];
  const initialKeys = metric ? sortMetricKeys(Object.keys(metric.data), preset) : preset;

  const [matchId, setMatchId] = useState(metric?.matchId ?? "");
  const [source, setSource] = useState<MetricSource>(metric?.source ?? "MANUAL");
  const [minutes, setMinutes] = useState(metric?.minutesPlayed?.toString() ?? "");
  const [keys, setKeys] = useState<string[]>(initialKeys);
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(metric?.data ?? {}).map(([k, v]) => [k, String(v)]))
  );
  const [addKey, setAddKey] = useState("");
  const [customName, setCustomName] = useState("");

  const availableToAdd = useMemo(() => METRICS.filter((m) => !keys.includes(m.key)), [keys]);
  const matchItems = matches.map((m) => ({
    value: m.id,
    label: matchLabel(m) + (usedMatchIds.includes(m.id) && m.id !== metric?.matchId ? " · já lançado" : ""),
  }));

  function addField(key: string) {
    const k = key.trim();
    if (!k || keys.includes(k)) return;
    setKeys((prev) => [...prev, k]);
  }

  function removeField(key: string) {
    setKeys((prev) => prev.filter((k) => k !== key));
    setValues((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const data: MetricData = {};
    for (const k of keys) {
      const raw = values[k]?.trim().replace(",", ".");
      if (!raw) continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) return setError(`Valor inválido em "${metricLabel(k)}"`);
      const max = METRIC_BY_KEY[k]?.max;
      if (n < 0 || (max != null && n > max)) return setError(`"${metricLabel(k)}" fora do intervalo permitido`);
      data[k] = n;
    }
    startTransition(async () => {
      const res = await saveRawMetric(
        { athleteId, matchId, source, minutesPlayed: minutes, data },
        metric?.id
      );
      if (!res.ok) return setError(res.error);
      router.refresh();
      onDone();
    });
  }

  if (creatingMatch) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Registre o jogo e ele será selecionado automaticamente.</p>
        <MatchForm
          teams={teams}
          leagues={leagues}
          defaultTeamId={athleteTeamId}
          onSaved={(id) => {
            setMatchId(id);
            setCreatingMatch(false);
            router.refresh();
          }}
          onCancel={() => setCreatingMatch(false)}
        />
      </div>
    );
  }

  const groups = METRIC_GROUPS.map((g) => ({
    group: g as string,
    keys: keys.filter((k) => METRIC_BY_KEY[k]?.group === g),
  }));
  const custom = keys.filter((k) => !METRIC_BY_KEY[k]);
  if (custom.length) groups.push({ group: "Personalizadas", keys: custom });

  return (
    <form onSubmit={submit} className="space-y-5">
      {/* Match + source */}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <div className="flex items-center justify-between">
            <label className={labelCls}>Jogo *</label>
            <button
              type="button"
              onClick={() => setCreatingMatch(true)}
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              id="metric-new-match"
            >
              <CalendarPlus className="h-3 w-3" /> Novo jogo
            </button>
          </div>
          <Select value={matchId} onValueChange={(v) => setMatchId(v ?? "")} items={matchItems}>
            <SelectTrigger className={cn(fieldCls, "w-full")} id="metric-match-select">
              <SelectValue placeholder={matches.length ? "Selecionar jogo" : "Nenhum jogo cadastrado"} />
            </SelectTrigger>
            <SelectContent>
              {matchItems.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className={labelCls}>Fonte</label>
          <Select
            value={source}
            onValueChange={(v) => setSource((v as MetricSource) ?? "MANUAL")}
            items={(Object.keys(SOURCE_LABELS) as MetricSource[]).map((s) => ({ value: s, label: SOURCE_LABELS[s] }))}
          >
            <SelectTrigger className={cn(fieldCls, "w-full")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SOURCE_LABELS) as MetricSource[]).map((s) => (
                <SelectItem key={s} value={s}>{SOURCE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className={labelCls} htmlFor={`${uid}-min`}>Minutos jogados</label>
          <Input
            id={`${uid}-min`}
            type="number"
            min={0}
            max={130}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            placeholder="90"
            className={fieldCls}
          />
        </div>
      </div>

      {/* Dynamic metric fields */}
      <div className="space-y-4">
        {groups.filter((g) => g.keys.length).map(({ group, keys: gk }) => (
          <fieldset key={group} className="space-y-2">
            <legend className="text-[10px] font-semibold uppercase tracking-widest text-primary/80">{group}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {gk.map((k) => {
                const def = METRIC_BY_KEY[k];
                return (
                  <div key={k} className="group relative rounded-lg bg-muted/40 p-2 ring-1 ring-transparent focus-within:ring-primary/40">
                    <div className="mb-1 flex items-start justify-between gap-1">
                      <label htmlFor={`${uid}-${k}`} className="text-[11px] leading-tight text-muted-foreground">
                        {metricLabel(k)}{def?.unit === "percent" && " (%)"}
                      </label>
                      <button
                        type="button"
                        onClick={() => removeField(k)}
                        aria-label={`Remover ${metricLabel(k)}`}
                        className="opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <input
                      id={`${uid}-${k}`}
                      inputMode="decimal"
                      value={values[k] ?? ""}
                      onChange={(e) => setValues((p) => ({ ...p, [k]: e.target.value }))}
                      placeholder="—"
                      className="w-full bg-transparent text-lg font-bold tabular-nums text-foreground outline-none placeholder:text-muted-foreground/40"
                    />
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {/* Add fields */}
      <div className="grid grid-cols-1 gap-2 rounded-xl border border-dashed border-border/70 p-3 sm:grid-cols-2">
        <div className="flex gap-2">
          <Select
            value={addKey}
            onValueChange={(v) => { if (v) addField(v); setAddKey(""); }}
            items={availableToAdd.map((m) => ({ value: m.key, label: `${m.group} · ${m.label}` }))}
          >
            <SelectTrigger className={cn(fieldCls, "w-full")} size="sm">
              <SelectValue placeholder="+ Métrica do catálogo" />
            </SelectTrigger>
            <SelectContent>
              {availableToAdd.map((m) => (
                <SelectItem key={m.key} value={m.key}>{m.group} · {m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Input
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); addField(customName); setCustomName(""); }
            }}
            placeholder="Métrica personalizada"
            maxLength={80}
            className={cn(fieldCls, "h-7")}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => { addField(customName); setCustomName(""); }}
            disabled={!customName.trim()}
            aria-label="Adicionar métrica personalizada"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={pending || !matchId} id="metric-form-submit">
          {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {metric ? "Salvar métricas" : "Registrar métricas"}
        </Button>
      </div>
    </form>
  );
}

// ─── Dialog buttons ──────────────────────────────────────────────────────────

type SharedProps = Omit<React.ComponentProps<typeof MetricForm>, "onDone" | "metric">;

export function AddMetricButton(props: SharedProps) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" className="gap-1.5" id="add-metric-button">
            <BarChart3 className="h-4 w-4" /> Lançar Métricas
          </Button>
        }
      />
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lançar métricas do jogo</DialogTitle>
        </DialogHeader>
        {open && <MetricForm {...props} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

export function EditMetricButton({ metric, ...props }: SharedProps & { metric: EditableMetric }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Editar métricas" />}>
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar métricas</DialogTitle>
        </DialogHeader>
        {open && <MetricForm {...props} metric={metric} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  );
}

export function DeleteMetricButton({ id, label }: { id: string; label: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="ghost" size="icon-sm" aria-label="Excluir métricas" className="text-muted-foreground hover:text-destructive" />}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir métricas</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Remover a ficha de métricas de <span className="font-semibold text-foreground">{label}</span>? O jogo continuará cadastrado.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteRawMetric(id);
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
