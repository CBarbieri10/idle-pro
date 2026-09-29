"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
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
import { createTeam, updateTeam, deleteTeam } from "@/lib/actions/teams";

type League = { id: string; name: string; season: string };

type Team = {
  id: string;
  name: string;
  shortName: string | null;
  country: string;
  city: string | null;
  leagueId: string | null;
};

// ─── Create / Edit Form ───────────────────────────────────────────────────────

function TeamForm({
  leagues,
  team,
  onDone,
}: {
  leagues: League[];
  team?: Team;
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [leagueId, setLeagueId] = useState(team?.leagueId ?? "none");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    if (leagueId !== "none") fd.set("leagueId", leagueId);
    else fd.delete("leagueId");

    startTransition(async () => {
      if (team) await updateTeam(team.id, fd);
      else await createTeam(fd);
      onDone();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Nome do clube *
          </label>
          <Input name="name" defaultValue={team?.name} required className="bg-muted/50 border-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Sigla
          </label>
          <Input name="shortName" defaultValue={team?.shortName ?? ""} placeholder="FLA" className="bg-muted/50 border-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            País *
          </label>
          <Input name="country" defaultValue={team?.country ?? "Brasil"} required className="bg-muted/50 border-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Cidade
          </label>
          <Input name="city" defaultValue={team?.city ?? ""} className="bg-muted/50 border-none" />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Liga
          </label>
          <Select value={leagueId} onValueChange={(v) => setLeagueId(v ?? "none")}>
            <SelectTrigger className="bg-muted/50 border-none">
              <SelectValue placeholder="Selecionar liga" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem liga</SelectItem>
              {leagues.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name} ({l.season})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {team ? "Salvar alterações" : "Criar clube"}
        </Button>
      </div>
    </form>
  );
}

// ─── Create Button ────────────────────────────────────────────────────────────

export function CreateTeamButton({ leagues }: { leagues: League[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Novo Clube</Button>} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Clube</DialogTitle>
        </DialogHeader>
        <TeamForm leagues={leagues} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Button ──────────────────────────────────────────────────────────────

export function EditTeamButton({ team, leagues }: { team: Team; leagues: League[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Clube</DialogTitle>
        </DialogHeader>
        <TeamForm team={team} leagues={leagues} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Button ────────────────────────────────────────────────────────────

export function DeleteTeamButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" />}>
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir clube</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir <span className="font-semibold text-foreground">{name}</span>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => startTransition(async () => { await deleteTeam(id); setOpen(false); })}
          >
            {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
