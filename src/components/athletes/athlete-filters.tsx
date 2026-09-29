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

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar atleta..."
          defaultValue={searchParams.get("search") ?? ""}
          onChange={(e) => updateParam("search", e.target.value)}
          className="pl-9 bg-muted/50 border-none"
        />
      </div>

      {/* Position filter */}
      <Select
        defaultValue={searchParams.get("position") ?? "ALL"}
        onValueChange={(v) => updateParam("position", v ?? "ALL")}
      >
        <SelectTrigger className="w-full sm:w-44 bg-muted/50 border-none">
          <SelectValue placeholder="Posição" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todas posições</SelectItem>
          {Object.entries(POSITION_LABELS).map(([key, label]) => (
            <SelectItem key={key} value={key}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Team filter */}
      <Select
        defaultValue={searchParams.get("teamId") ?? "ALL"}
        onValueChange={(v) => updateParam("teamId", v ?? "ALL")}
      >
        <SelectTrigger className="w-full sm:w-48 bg-muted/50 border-none">
          <SelectValue placeholder="Clube" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">Todos os clubes</SelectItem>
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
