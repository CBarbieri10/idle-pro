"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoutingCopilotDrawer } from "@/components/ai/scouting-copilot-drawer";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-end border-b border-border bg-background/70 backdrop-blur-sm px-6">
      <div className="flex items-center gap-3">
        <ScoutingCopilotDrawer />
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground"
          aria-label="Notificações"
        >
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
