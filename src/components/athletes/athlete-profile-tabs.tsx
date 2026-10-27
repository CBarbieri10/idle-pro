"use client";

import React, { useState } from "react";
import { LayoutDashboard, ListOrdered, Brain, Clapperboard, UserCog } from "lucide-react";

export interface ProfileTabDef {
  id: string;
  label: string;
  icon: "overview" | "games" | "analysis" | "videos" | "admin";
  content: React.ReactNode;
}

const ICONS = {
  overview: LayoutDashboard,
  games: ListOrdered,
  analysis: Brain,
  videos: Clapperboard,
  admin: UserCog,
} as const;

/**
 * Navegação principal do perfil do atleta. Apenas a aba ativa é renderizada,
 * o que mantém a página curta e evita gráficos medindo largura 0 em abas ocultas.
 */
export function AthleteProfileTabs({ tabs }: { tabs: ProfileTabDef[] }) {
  const [active, setActive] = useState(tabs[0]?.id);
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        className="flex w-full gap-5 overflow-x-auto border-b border-border"
      >
        {tabs.map((tab) => {
          const Icon = ICONS[tab.icon];
          const isActive = tab.id === current?.id;
          return (
            <button
              key={tab.id}
              id={`athlete-tab-${tab.id}`}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-1 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div key={current?.id} role="tabpanel" className="animate-in fade-in duration-200">
        {current?.content}
      </div>
    </div>
  );
}
