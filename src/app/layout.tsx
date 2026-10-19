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

export default function RootLayout({ children }: { children: React.ReactNode }) {
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
              className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[#06080a] print:hidden"
            >
              {/* Tactical dark vignette */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#06080a] via-[#080b0f] to-[#040608]" />
              {/* Subtle cyan ambient glow */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(34,211,238,0.1),transparent_70%)]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(34,211,238,0.03),transparent_40%)]" />
            </div>

            {/* Sidebar */}
            <AppSidebar />

            {/* Main content area */}
            <div className="relative z-10 flex flex-1 flex-col min-w-0 w-full print:block print:w-full print:p-0">
              <AppHeader />
              <main className="flex-1 min-w-0 w-full px-4 py-6 md:px-8 lg:px-10 max-w-[1720px] mx-auto print:p-0 print:m-0 print:max-w-none print:w-full print:bg-white">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
