import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { Providers } from "@/components/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Net Scouting | Portal de Inteligência Esportiva",
  description:
    "Sistema de scout e análise de performance para o futebol de base. Gerencie atletas, clubes, métricas e relatórios em um só lugar.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex bg-[#080a0f] text-foreground">
        <Providers>
          <div id="app-shell" className="relative flex min-h-screen w-full">
            {/* Global Cinematic B&W Stadium & Folded Texture Backdrop */}
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
            >
              {/* High-contrast black and white stadium image */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.16] grayscale contrast-125"
                style={{
                  backgroundImage: "url('/images/stadium-bw-bg.jpg')",
                }}
              />
              {/* Folded paper and dark charcoal canvas texture */}
              <div className="folded-canvas absolute inset-0 opacity-80 mix-blend-overlay" />
              {/* Tactical dark gradient vignette ensuring readability */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#080a0f]/85 via-[#080a0f]/75 to-[#050608]/95" />
              {/* Subtle top ambient glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-15%,rgba(0,230,118,0.06),transparent_70%)]" />
            </div>

            {/* Sidebar */}
            <AppSidebar />

            {/* Main content area */}
            <div className="relative z-10 flex flex-1 flex-col min-w-0 w-full">
              <AppHeader />
              <main className="flex-1 min-w-0 w-full p-4 md:p-6 lg:p-8">{children}</main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
