"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Shield,
  FileText,
  Trophy,
  CalendarDays,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Atletas",
    href: "/athletes",
    icon: Users,
  },
  {
    label: "Clubes",
    href: "/teams",
    icon: Shield,
  },
  {
    label: "Jogos",
    href: "/matches",
    icon: CalendarDays,
  },
  {
    label: "Catálogo da Liga",
    href: "/league",
    icon: Trophy,
  },
  {
    label: "Relatórios",
    href: "/reports",
    icon: FileText,
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-64 
          bg-[#070a10]/90 backdrop-blur-2xl border-r border-white/[0.08] shadow-[4px_0_30px_rgba(0,0,0,0.6)]
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:sticky md:top-0 md:h-screen md:shrink-0
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3.5 px-6 pt-6 pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-[0_0_20px_rgba(0,230,118,0.35)] ring-1 ring-white/20 shrink-0">
            <span className="text-sm font-black text-black font-mono tracking-tighter">
              TNS
            </span>
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black tracking-tight text-white leading-none">
              THE NET
            </h1>
            <p className="text-[10px] font-bold tracking-[0.25em] text-emerald-400 mt-1 uppercase">
              SCOUTING PRO
            </p>
          </div>
        </div>

        {/* Live Network Status Indicator */}
        <div className="mx-4 mb-3 px-3 py-1.5 rounded-lg bg-emerald-500/[0.07] border border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider">
              Scout Online
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold text-zinc-400">v2.0</span>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4" />

        {/* Nav */}
        <nav className="flex-1 space-y-1.5 px-3 py-4">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13px] font-bold
                  transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border-l-2 border-emerald-400 text-white shadow-lg shadow-emerald-500/5"
                      : "text-zinc-400 hover:text-white hover:bg-white/[0.05]"
                  }
                `}
              >
                <item.icon
                  className={`h-4 w-4 shrink-0 transition-colors ${
                    isActive
                      ? "text-emerald-400"
                      : "text-zinc-500 group-hover:text-emerald-400"
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 pb-5 pt-3">
          <div className="p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm">
            <p className="text-[11px] font-bold text-zinc-300">
              Portal de Inteligência Esportiva
            </p>
            <p className="text-[10px] text-zinc-500 mt-0.5">
              Enterprise Scouting Platform
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
