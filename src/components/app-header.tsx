"use client";

import { Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
      {/* Search */}
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

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
              CB
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium">Analista</p>
            <p className="text-xs text-muted-foreground">The Net Scouting</p>
          </div>
        </div>
      </div>
    </header>
  );
}
