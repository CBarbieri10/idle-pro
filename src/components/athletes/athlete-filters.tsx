"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { POSITION_LABELS } from "@/lib/domain";

type Team = { id: string; name: string };

export function AthleteFilters({ teams }: { teams: Team[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const currentPosition = searchParams.get("position") || "ALL";
  const currentTeamId = searchParams.get("teamId") || "ALL";

  const selectedPositionLabel =
    currentPosition !== "ALL"
      ? POSITION_LABELS[currentPosition as keyof typeof POSITION_LABELS] ?? currentPosition
      : "Todas as Posições";

  const selectedTeamName =
    currentTeamId !== "ALL"
      ? teams.find((t) => t.id === currentTeamId)?.name ?? "Clube Selecionado"
      : "Todos os Clubes";

  return (
    <div className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-white/10 bg-[#0d121d]/85 backdrop-blur-md p-3.5 shadow-xl">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input
          placeholder="Buscar atleta por nome..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value)}
          className="pl-10 h-10 text-xs bg-black/40 border-white/10 text-white placeholder:text-zinc-500 rounded-xl focus-visible:ring-[#00e676]"
        />
      </div>

      {/* Position filter */}
      <Select
        value={currentPosition}
        onValueChange={(v) => updateParam("position", v ?? "ALL")}
      >
        <SelectTrigger className="w-full sm:w-48 h-10 text-xs bg-black/40 border-white/10 text-white rounded-xl">
          <span className="truncate">{selectedPositionLabel}</span>
        </SelectTrigger>
        <SelectContent className="bg-[#121724] border-white/10 text-white z-50">
          <SelectItem value="ALL">Todas as Posições</SelectItem>
          {Object.entries(POSITION_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Team filter */}
      <Select
        value={currentTeamId}
        onValueChange={(v) => updateParam("teamId", v ?? "ALL")}
      >
        <SelectTrigger className="w-full sm:w-52 h-10 text-xs bg-black/40 border-white/10 text-white rounded-xl">
          <span className="truncate">{selectedTeamName}</span>
        </SelectTrigger>
        <SelectContent className="bg-[#121724] border-white/10 text-white z-50">
          <SelectItem value="ALL">Todos os Clubes</SelectItem>
          {teams.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
