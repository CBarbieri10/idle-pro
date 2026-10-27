import type { Metadata } from "next";
import { IBM_Plex_Sans, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Providers } from "@/components/providers";
import { CompareDock } from "@/components/compare/compare-dock";

const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Overview Scout - Plataforma de Inteligência Esportiva e Scouting",
  description:
    "Overview Scout - Plataforma de Inteligência Esportiva e Scouting. Sistema de scout e análise de performance para o futebol de elite e de base. Gerencie atletas, clubes, métricas e relatórios em um só lugar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${plex.variable} ${barlow.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex bg-background text-foreground">
        <Providers>
          <div id="app-shell" className="relative flex min-h-screen w-full">
            {/* Fundo de estádio P&B fixo, com camada escura por cima */}
            <div
              aria-hidden
              className="app-backdrop pointer-events-none fixed inset-0 z-0 print:hidden"
            />

            {/* Sidebar */}
            <AppSidebar />

            {/* Main content area */}
            <div className="relative z-10 flex flex-1 flex-col min-w-0 w-full print:block print:w-full print:p-0">
              <AppHeader />
              <main className="flex-1 min-w-0 w-full px-4 py-6 md:px-8 lg:px-10 max-w-[1720px] mx-auto print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white">
                {children}
              </main>
            </div>

            {/* Global Persistent Head-to-Head Compare Dock */}
            <CompareDock />
          </div>
        </Providers>
      </body>
    </html>
  );
}
