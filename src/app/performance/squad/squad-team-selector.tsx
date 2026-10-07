"use client";
import { useState, useTransition } from "react";
import { setMyTeam } from "@/lib/actions/performance";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function SquadTeamSelector({ teams }: { teams: {id: string, name: string}[] }) {
  const [selectedId, setSelectedId] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSelect = () => {
    if (!selectedId) return;
    startTransition(async () => {
      await setMyTeam(selectedId);
    });
  }

  return (
    <div className="space-y-4 max-w-sm mx-auto text-left">
      <Select value={selectedId} onValueChange={(val) => { if (val) setSelectedId(val); }}>
        <SelectTrigger className="w-full bg-black/40 border-white/10 text-white font-semibold">
          <SelectValue placeholder="Escolha um clube da base..." />
        </SelectTrigger>
        <SelectContent className="bg-[#0b101a] border-white/10 text-white max-h-60">
          {teams.map(t => (
            <SelectItem key={t.id} value={t.id} className="focus:bg-white/10">{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button 
        onClick={handleSelect} 
        disabled={!selectedId || isPending}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
        Selecionar Meu Elenco Oficial
      </Button>
    </div>
  );
}
