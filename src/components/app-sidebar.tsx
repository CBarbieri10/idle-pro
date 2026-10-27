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
  TrendingUp,
  Video,
  Swords,
  Circle,
  UploadCloud,
  Bookmark,
  Scale,
  Plus,
  Search,
  LogOut,
  User as UserIcon,
  ListOrdered,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut, useSession } from "next-auth/react";

const menuGroups = [
  {
    title: "Trabalho",
    items: [
      { label: "Dashboard", href: "/", icon: LayoutDashboard },
      { label: "Atletas", href: "/athletes", icon: Users },
      { label: "Agenda", href: "/agenda", icon: CalendarDays },
      { label: "Central de vídeos", href: "/performance/videos", icon: Video },
      { label: "Relatórios", href: "/reports", icon: FileText },
    ],
  },
  {
    title: "Análise e mercado",
    items: [
      { label: "Evolução individual", href: "/performance/athlete", icon: TrendingUp },
      { label: "Sala de guerra", href: "/performance/squad", icon: Swords },
      { label: "Comparador head-to-head", href: "/market/compare", icon: Scale },
      { label: "Shadow board", href: "/market/portfolios", icon: Bookmark },
    ],
  },
  {
    title: "Competições e dados",
    items: [
      { label: "Clubes", href: "/teams", icon: Shield },
      { label: "Partidas", href: "/matches", icon: Circle },
      { label: "Catálogo da liga", href: "/league", icon: ListOrdered },
      { label: "Líderes da competição", href: "/competition/leaders", icon: Trophy },
    ],
  },
  {
    title: "Sistema",
    items: [{ label: "Importar Wyscout", href: "/admin/import", icon: UploadCloud }],
  },
];

const newItems = [
  { label: "Atleta", href: "/athletes" },
  { label: "Clipe", href: "/performance/videos" },
  { label: "Reunião", href: "/agenda" },
  { label: "Relatório", href: "/reports" },
];

const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  ANALYST: "Analista",
  CLUB: "Clube",
  ATHLETE: "Atleta",
};

export function AppSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const { data: session } = useSession();

  const userRole = session?.user?.role;
  const isAthlete = userRole === "ATHLETE";
  const athleteId = session?.user?.athleteId;
  const userName = session?.user?.name ?? "Analista";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const activeGroups = isAthlete
    ? [
        {
          title: "Meu painel",
          items: [
            {
              label: "Meu perfil",
              href: athleteId ? `/athletes/${athleteId}` : "/athletes",
              icon: UserIcon,
            },
            { label: "Minha agenda", href: "/agenda", icon: CalendarDays },
            { label: "Central de vídeos", href: "/performance/videos", icon: Video },
          ],
        },
      ]
    : menuGroups;

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label="Abrir ou fechar o menu"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-40 h-screen w-60
          bg-sidebar border-r border-border
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:sticky md:top-0 md:h-screen md:shrink-0
        `}
      >
        <div className="flex items-center gap-3 px-4 pt-5 pb-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
            OS
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight text-foreground">Overview Scout</p>
            <p className="text-[11px] leading-tight text-muted-foreground">
              {userRole ? roleLabels[userRole] : "Analista de desempenho"}
            </p>
          </div>
        </div>

        {!isAthlete && (
          <div className="px-4 space-y-2 pb-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                aria-label="Buscar atleta ou clube"
                placeholder="Buscar atleta ou clube"
                className="h-8 pl-8 text-xs bg-background/60"
              />
            </div>
            <div className="relative">
              <Button
                id="new-button"
                className="w-full h-8 gap-1.5 text-xs font-semibold"
                aria-haspopup="menu"
                aria-expanded={newOpen}
                onClick={() => setNewOpen((v) => !v)}
              >
                <Plus className="h-3.5 w-3.5" />
                Novo
              </Button>
              {newOpen && (
                <div
                  role="menu"
                  className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-popover p-1"
                >
                  {newItems.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      role="menuitem"
                      onClick={() => {
                        setNewOpen(false);
                        setMobileOpen(false);
                      }}
                      className="block rounded-md px-3 py-1.5 text-xs text-foreground hover:bg-accent"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <nav aria-label="Navegação principal" className="px-3 pb-4 space-y-4">
            {activeGroups.map((group) => (
              <div key={group.title}>
                <h3 className="px-3 text-[11px] font-medium text-muted-foreground mb-1">
                  {group.title}
                </h3>
                <div className="space-y-0.5">
                  {group.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href));

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive ? "page" : undefined}
                        className={`
                          group relative flex items-center gap-2.5 rounded-md px-3 py-1.5 text-[13px]
                          transition-colors
                          ${
                            isActive
                              ? "bg-accent text-foreground font-medium before:absolute before:left-0 before:top-1 before:bottom-1 before:w-0.5 before:rounded-full before:bg-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                          }
                        `}
                      >
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-primary" : "text-muted-foreground"
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </div>

        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-foreground">
              {userInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">{userName}</p>
              <p className="truncate text-[11px] text-muted-foreground">
                {userRole ? roleLabels[userRole] : ""}
              </p>
            </div>
            <Button
              id="logout-button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Sair"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
