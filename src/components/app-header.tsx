"use client";

import { Bell, Search, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { signOut, useSession } from "next-auth/react";
import { ScoutingCopilotDrawer } from "@/components/ai/scouting-copilot-drawer";

export function AppHeader() {
  const { data: session } = useSession();

  const userName = session?.user?.name ?? "Analista";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const userRole = session?.user?.role;
  const isAthlete = userRole === "ATHLETE";

  const roleConfig: Record<string, { label: string; badgeClass: string }> = {
    ATHLETE: { label: "Atleta", badgeClass: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
    CLUB: { label: "Clube", badgeClass: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
    ANALYST: { label: "Analista", badgeClass: "bg-indigo-500/15 text-indigo-300 border-indigo-500/30" },
    ADMIN: { label: "Admin", badgeClass: "bg-purple-500/15 text-purple-300 border-purple-500/30" },
  };

  const currentRole = userRole ? roleConfig[userRole] : null;

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
      {/* Search - oculto para atletas para isolamento de banco de talentos */}
      {!isAthlete ? (
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar atletas, clubes..."
              className="pl-9 bg-muted/50 border-none"
            />
          </div>
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400 font-mono">
            Portal Individual de Performance &bull; Overview Scout
          </span>
        </div>
      )}

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        <ScoutingCopilotDrawer />

        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium leading-none">{userName}</p>
              {currentRole && (
                <span className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded border ${currentRole.badgeClass}`}>
                  {currentRole.label}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Overview Scout</p>
          </div>
        </div>

        {/* Logout */}
        <Button
          id="logout-button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Sair"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
