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
          bg-sidebar border-r border-sidebar-border
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:sticky md:top-0 md:h-screen md:shrink-0
        `}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-6 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">
              TNS
            </span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-sidebar-foreground">
              THE NET
            </h1>
            <p className="text-[10px] font-medium tracking-[0.2em] text-sidebar-foreground/60">
              SCOUTING
            </p>
          </div>
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
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
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium
                  transition-colors duration-150
                  ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  }
                `}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4">
          <Separator className="mb-4 bg-sidebar-border" />
          <p className="text-[10px] text-sidebar-foreground/40">
            Portal de Inteligência Esportiva
          </p>
          <p className="text-[10px] text-sidebar-foreground/30">
            v1.0.0 MVP
          </p>
        </div>
      </aside>
    </>
  );
}
