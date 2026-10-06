import type { Metadata } from "next";
import { Geist, Geist_Mono, Lora } from "next/font/google";
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

const lora = Lora({
  variable: "--font-serif-luxury",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex bg-[#080a0f] text-foreground">
        <Providers>
          <div id="app-shell" className="relative flex min-h-screen w-full">
            {/* Global Cinematic B&W Stadium & Folded Texture Backdrop */}
            <div
              aria-hidden
              className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
            >
              {/* High-contrast black and white stadium image with folded texture */}
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat bg-fixed opacity-45 grayscale contrast-110"
                style={{
                  backgroundImage: "url('/images/stadium-bw-bg.jpg')",
                }}
              />
              {/* Tactical dark vignette preserving content legibility while keeping stadium and folds crisp */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#080a0f]/60 via-[#06080d]/45 to-[#040508]/85" />
              {/* Subtle electric emerald ambient floodlight glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_45%_at_50%_-10%,rgba(0,230,118,0.08),transparent_70%)]" />
            </div>

            {/* Sidebar */}
            <AppSidebar />

            {/* Main content area */}
            <div className="relative z-10 flex flex-1 flex-col min-w-0 w-full">
              <AppHeader />
              <main className="flex-1 min-w-0 w-full px-4 py-6 md:px-8 lg:px-10 max-w-[1720px] mx-auto">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
