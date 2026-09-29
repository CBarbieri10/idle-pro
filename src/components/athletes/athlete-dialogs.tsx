"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { createAthlete, updateAthlete, deleteAthlete } from "@/lib/actions/athletes";
import { POSITION_LABELS, FOOT_LABELS } from "@/lib/domain";
import { Position, FootPreference } from "@prisma/client";

type Team = { id: string; name: string };

type Athlete = {
  id: string;
  name: string;
  position: Position;
  teamId: string;
  nationalTeamId: string | null;
  birthDate: Date | null;
  nationality: string | null;
  height: number | null;
  weight: number | null;
  footPreference: FootPreference;
  notes: string | null;
};

// ─── Shared Form ──────────────────────────────────────────────────────────────

function AthleteForm({
  teams,
  athlete,
  onDone,
}: {
  teams: Team[];
  athlete?: Athlete;
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [position, setPosition] = useState<string>(athlete?.position ?? "STRIKER");
  const [teamId, setTeamId] = useState(athlete?.teamId ?? "");
  const [nationalTeamId, setNationalTeamId] = useState(athlete?.nationalTeamId ?? "none");
  const [foot, setFoot] = useState<string>(athlete?.footPreference ?? "RIGHT");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    fd.set("position", position);
    fd.set("teamId", teamId);
    fd.set("footPreference", foot);
    if (nationalTeamId !== "none") fd.set("nationalTeamId", nationalTeamId);
    else fd.delete("nationalTeamId");

    startTransition(async () => {
      if (athlete) await updateAthlete(athlete.id, fd);
      else await createAthlete(fd);
      onDone();
    });
  }

  const birthDateStr = athlete?.birthDate
    ? new Date(athlete.birthDate).toISOString().split("T")[0]
    : "";

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Name */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome completo *</label>
          <Input name="name" defaultValue={athlete?.name} required className="bg-muted/50 border-none" />
        </div>

        {/* Position */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Posição *</label>
          <Select value={position} onValueChange={(v) => setPosition(v ?? "STRIKER")}>
            <SelectTrigger className="bg-muted/50 border-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(POSITION_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Foot */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pé dominante</label>
          <Select value={foot} onValueChange={(v) => setFoot(v ?? "RIGHT")}>
            <SelectTrigger className="bg-muted/50 border-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(FOOT_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Club */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clube *</label>
          <Select value={teamId} onValueChange={(v) => setTeamId(v ?? "")}>
            <SelectTrigger className="bg-muted/50 border-none">
              <SelectValue placeholder="Selecionar clube" />
            </SelectTrigger>
            <SelectContent>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* National Team */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Seleção (opcional)</label>
          <Select value={nationalTeamId} onValueChange={(v) => setNationalTeamId(v ?? "none")}>
            <SelectTrigger className="bg-muted/50 border-none">
              <SelectValue placeholder="Sem seleção" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sem seleção</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Nationality */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nacionalidade</label>
          <Input name="nationality" defaultValue={athlete?.nationality ?? ""} placeholder="Brasileiro" className="bg-muted/50 border-none" />
        </div>

        {/* Birth date */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Data de nascimento</label>
          <Input name="birthDate" type="date" defaultValue={birthDateStr} className="bg-muted/50 border-none" />
        </div>

        {/* Height */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Altura (cm)</label>
          <Input name="height" type="number" defaultValue={athlete?.height ?? ""} placeholder="180" className="bg-muted/50 border-none" />
        </div>

        {/* Weight */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Peso (kg)</label>
          <Input name="weight" type="number" defaultValue={athlete?.weight ?? ""} placeholder="75" className="bg-muted/50 border-none" />
        </div>

        {/* Notes */}
        <div className="col-span-2 space-y-1">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Anotações</label>
          <textarea
            name="notes"
            defaultValue={athlete?.notes ?? ""}
            rows={2}
            placeholder="Notas sobre o atleta..."
            className="w-full rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none resize-none focus:ring-1 focus:ring-ring/50"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>Cancelar</Button>
        <Button type="submit" size="sm" disabled={isPending || !teamId}>
          {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
          {athlete ? "Salvar alterações" : "Cadastrar atleta"}
        </Button>
      </div>
    </form>
  );
}

// ─── Create Button ────────────────────────────────────────────────────────────

export function CreateAthleteButton({ teams }: { teams: Team[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-1.5"><Plus className="h-4 w-4" /> Novo Atleta</Button>} />
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Cadastrar Atleta</DialogTitle>
        </DialogHeader>
        <AthleteForm teams={teams} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

// ─── Edit Button ──────────────────────────────────────────────────────────────

export function EditAthleteButton({ athlete, teams }: { athlete: Athlete; teams: Team[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" />}>
        <Pencil className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Atleta</DialogTitle>
        </DialogHeader>
        <AthleteForm athlete={athlete} teams={teams} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

// ─── Delete Button ────────────────────────────────────────────────────────────

export function DeleteAthleteButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive" />}>
        <Trash2 className="h-3.5 w-3.5" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Excluir atleta</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir <span className="font-semibold text-foreground">{name}</span>? Esta ação não pode ser desfeita.
        </p>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await deleteAthlete(id);
                setOpen(false);
                router.refresh();
              })
            }
          >
            {isPending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
