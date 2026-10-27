"use client";

import { Suspense, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  Shield,
  ArrowRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Sparkles,
} from "lucide-react";

// ─── Radar Chart SVG Component (Cybernetic / Data Science Visual) ───────────────
function RadarChartGraphic() {
  // 6 Polar Vertices: Center is (150, 150), Radius is 110
  // Angles: 0, 60, 120, 180, 240, 300 degrees (-90 deg offset for top vertex)
  const categories = [
    { label: "PAdj Defensivo", val: 96, x: 150, y: 40 },
    { label: "Construção", val: 88, x: 245, y: 95 },
    { label: "Intensidade", val: 92, x: 245, y: 205 },
    { label: "QI Tático", val: 95, x: 150, y: 260 },
    { label: "Valor de Mercado", val: 84, x: 55, y: 205 },
    { label: "Eficiência", val: 90, x: 55, y: 95 },
  ];

  // Polygon coordinates for high-performance player (scale based on val / 100)
  // Center: (150, 150), R = 110
  // P1: (150, 150 - 110 * 0.96) = (150, 44.4)
  // P2: (150 + 95.26 * 0.88, 150 - 55 * 0.88) = (233.8, 101.6)
  // P3: (150 + 95.26 * 0.92, 150 + 55 * 0.92) = (237.6, 200.6)
  // P4: (150, 150 + 110 * 0.95) = (150, 254.5)
  // P5: (150 - 95.26 * 0.84, 150 + 55 * 0.84) = (69.9, 196.2)
  // P6: (150 - 95.26 * 0.90, 150 - 55 * 0.90) = (64.3, 100.5)
  const activePolygonPoints = "150,44.4 233.8,101.6 237.6,200.6 150,254.5 69.9,196.2 64.3,100.5";
  // Benchmark polygon points (average league level ~ 60%)
  const benchmarkPolygonPoints = "150,84 207,117 207,183 150,216 93,183 93,117";

  return (
    <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center select-none">
      <svg
        viewBox="0 0 300 300"
        className="w-full h-full overflow-visible drop-shadow-[0_0_25px_rgba(16,185,129,0.18)]"
      >
        <defs>
          <radialGradient id="radarRadial" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--data-1)" stopOpacity="0.32" />
            <stop offset="70%" stopColor="var(--data-1)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--data-1)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="polyStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="50%" stopColor="var(--data-1)" />
            <stop offset="100%" stopColor="var(--data-1)" />
          </linearGradient>
        </defs>

        {/* Concentric Polygons (Web Rings: 25%, 50%, 75%, 100%) */}
        {[0.25, 0.5, 0.75, 1].map((scale, i) => {
          const r = 110 * scale;
          const h = r * 0.5;
          const w = r * 0.866;
          const pts = `150,${150 - r} ${150 + w},${150 - h} ${150 + w},${150 + h} 150,${150 + r} ${150 - w},${150 + h} ${150 - w},${150 - h}`;
          return (
            <polygon
              key={i}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
              strokeDasharray={i === 3 ? "none" : "3,3"}
            />
          );
        })}

        {/* Radial Axes */}
        {categories.map((cat, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const x2 = 150 + Math.cos(angle) * 110;
          const y2 = 150 + Math.sin(angle) * 110;
          return (
            <line
              key={i}
              x1="150"
              y1="150"
              x2={x2}
              y2={y2}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
            />
          );
        })}

        {/* Benchmark Area (League Average) */}
        <polygon
          points={benchmarkPolygonPoints}
          fill="rgba(255,255,255,0.03)"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        {/* Active Elite Performer Area */}
        <polygon
          points={activePolygonPoints}
          fill="url(#radarRadial)"
          stroke="url(#polyStroke)"
          strokeWidth="2.2"
        />

        {/* Active Data Points */}
        {[
          { x: 150, y: 44.4 },
          { x: 233.8, y: 101.6 },
          { x: 237.6, y: 200.6 },
          { x: 150, y: 254.5 },
          { x: 69.9, y: 196.2 },
          { x: 64.3, y: 100.5 },
        ].map((pt, i) => (
          <g key={i}>
            <circle
              cx={pt.x}
              cy={pt.y}
              r="4"
              className="fill-emerald-400 animate-pulse"
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r="7"
              fill="none"
              stroke="var(--data-1)"
              strokeWidth="1"
              opacity="0.6"
            />
          </g>
        ))}

        {/* Center Target Indicator */}
        <circle cx="150" cy="150" r="3" fill="var(--data-1)" />
      </svg>

      {/* Floating Axis Labels */}
      <div className="absolute -top-3 text-[10px] font-mono font-bold tracking-wider text-emerald-400 bg-black/60 px-2 py-0.5 rounded border border-emerald-500/20 backdrop-blur-md">
        PADJ DEF 96
      </div>
      <div className="absolute top-16 -right-5 text-[10px] font-mono font-bold tracking-wider text-zinc-300 bg-black/60 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md">
        CONSTR 88
      </div>
      <div className="absolute bottom-16 -right-5 text-[10px] font-mono font-bold tracking-wider text-cyan-400 bg-black/60 px-2 py-0.5 rounded border border-cyan-500/20 backdrop-blur-md">
        INTENS 92
      </div>
      <div className="absolute -bottom-3 text-[10px] font-mono font-bold tracking-wider text-emerald-400 bg-black/60 px-2 py-0.5 rounded border border-emerald-500/20 backdrop-blur-md">
        QI TÁTICO 95
      </div>
      <div className="absolute bottom-16 -left-7 text-[10px] font-mono font-bold tracking-wider text-zinc-300 bg-black/60 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md">
        VALOR 84
      </div>
      <div className="absolute top-16 -left-6 text-[10px] font-mono font-bold tracking-wider text-emerald-300 bg-black/60 px-2 py-0.5 rounded border border-white/10 backdrop-blur-md">
        EFIC 90
      </div>
    </div>
  );
}

// ─── Inner Login Form Component ───────────────────────────────────────────────
function ExecutiveLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallbackUrl = searchParams.get("callbackUrl");
  // Default target is /performance/squad (A Sala de Guerra)
  const targetDestination =
    rawCallbackUrl && rawCallbackUrl !== "/" && rawCallbackUrl !== "/login"
      ? rawCallbackUrl
      : "/performance/squad";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Quick fill helper for testing & executive demonstration
  function handleQuickFillAdmin() {
    setEmail("admin@overviewscout.com");
    setPassword("admin123");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const result = await signIn("credentials", {
          email: email.trim(),
          password,
          redirect: false,
        });

        if (!result || result.error) {
          setError(
            "Credenciais inválidas. Acesso restrito a pessoal autorizado."
          );
          return;
        }

        setIsSuccess(true);

        // Smooth transition effect before navigating to A Sala de Guerra
        setTimeout(() => {
          router.push(targetDestination);
          router.refresh();
        }, 500);
      } catch (err) {
        console.error("Auth error:", err);
        setError(
          "Credenciais inválidas. Acesso restrito a pessoal autorizado."
        );
      }
    });
  }

  return (
    <div className="w-full max-w-[420px] mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-zinc-700 text-[11px] font-bold tracking-wider uppercase mb-3">
          <Shield className="h-3.5 w-3.5 text-zinc-900" />
          Acesso Corporativo Seguro
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-950">
          Central de Inteligência
        </h2>
        <p className="text-sm text-zinc-500 mt-2 leading-relaxed">
          Autentique suas credenciais credenciadas para desbloquear a Sala de
          Guerra e os relatórios analíticos confidenciais.
        </p>
      </div>

      {/* Quick Access Credentials Banner */}
      <div className="mb-6 p-3 rounded-xl bg-zinc-100/80 border border-zinc-200/90 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-zinc-700">
          <Sparkles className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-medium">
            Acesso de Demonstração (Admin)
          </span>
        </div>
        <button
          type="button"
          onClick={handleQuickFillAdmin}
          className="text-xs font-semibold text-zinc-900 hover:text-emerald-700 underline underline-offset-2 transition-colors cursor-pointer"
        >
          Preencher dados
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50/80 p-4 text-sm text-red-900 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-950">Falha de Autenticação</p>
            <p className="text-red-700 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Success Notification */}
      {isSuccess && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 text-sm text-emerald-900 flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-emerald-950">Acesso Autorizado</p>
            <p className="text-emerald-700 text-xs mt-0.5">
              Conexão criptografada estabelecida. Redirecionando para a Sala de Guerra...
            </p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Email Field */}
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-bold text-zinc-700 uppercase tracking-wider"
          >
            E-mail Corporativo
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              disabled={isPending || isSuccess}
              placeholder="admin@overviewscout.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 outline-none transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-xs font-bold text-zinc-700 uppercase tracking-wider"
            >
              Senha de Segurança
            </label>
            <span className="text-[11px] text-zinc-400 font-medium cursor-not-allowed">
              Recuperar Chave
            </span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              disabled={isPending || isSuccess}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-11 pl-10 pr-11 rounded-xl border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 shadow-xs focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5 outline-none transition-all disabled:opacity-50 font-mono tracking-tight"
            />
            <button
              type="button"
              tabIndex={-1}
              aria-label={showPassword ? "Ocultar senha" : "Exibir senha"}
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-700 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Session Persistence */}
        <div className="flex items-center justify-between pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900/10 cursor-pointer accent-zinc-900"
            />
            <span className="text-xs text-zinc-600 font-medium">
              Manter sessão de inteligência ativa
            </span>
          </label>
          <span className="text-[11px] font-mono text-zinc-400">TLS 1.3</span>
        </div>

        {/* Main CTA Button: 'Acessar Central de Inteligência' */}
        <button
          type="submit"
          disabled={isPending || isSuccess || !email || !password}
          className="group relative w-full h-12 rounded-xl bg-zinc-950 hover:bg-zinc-800 active:scale-[0.99] text-white font-semibold text-sm shadow-md shadow-zinc-950/20 hover:shadow-zinc-950/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer overflow-hidden"
        >
          {/* Subtle button sheen animation */}
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform ease-out" />

          {isPending ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>Validando Credenciais...</span>
            </>
          ) : isSuccess ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-emerald-400 animate-pulse" />
              <span>Acesso Concedido</span>
            </>
          ) : (
            <>
              <span>Acessar Central de Inteligência</span>
              <ArrowRight className="h-4 w-4 text-zinc-400 group-hover:text-white group-hover:translate-x-0.5 transition-all" />
            </>
          )}
        </button>
      </form>

      {/* Apple / Vercel minimalist security footer */}
      <div className="mt-10 pt-6 border-t border-zinc-200/80 text-center space-y-3">
        <p className="text-xs text-zinc-500">
          Precisa de suporte ou novas credenciais?{" "}
          <span className="text-zinc-900 font-medium hover:underline cursor-pointer">
            Fale com a Diretoria de Futebol
          </span>
        </p>
        <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-400">
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-emerald-600" /> Criptografia de Ponta
          </span>
          <span>•</span>
          <span>SLA 99.9%</span>
          <span>•</span>
          <span>Overview Scout Pro</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page with Split-Screen Layout ───────────────────────────────────────
export default function LoginPage() {
  return (
    <main className="min-h-screen w-full flex flex-col lg:flex-row bg-card overflow-x-hidden">
      {/* ────────────────────────────────────────────────────────────────────────
          LADO ESQUERDO: BRANDING & IMPACTO (Painel Escuro / Cibernético)
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full lg:w-[54%] xl:w-[58%] min-h-[520px] lg:min-h-screen bg-card flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden border-b lg:border-b-0 lg:border-r border-white/[0.08]">
        {/* Tactical Ambient Glows */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute top-1/2 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-[140px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-80 w-80 rounded-full bg-emerald-600/10 blur-[130px]" />

        {/* Matrix Dot Grid Overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.14]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* TOP BRAND HEADER */}
        <div className="relative z-10 flex items-center justify-between">
          {/* Logo Monogram & Name */}
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 shadow-[0_0_28px_rgba(16,185,129,0.45)] ring-1 ring-white/25 shrink-0">
              <span className="text-base font-black text-black font-mono tracking-tighter">
                OVS
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white leading-none">
                  OVERVIEW
                </span>
                <span className="text-lg font-black tracking-tight text-emerald-400 leading-none">
                  SCOUT
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-[0.25em] text-zinc-400 uppercase mt-1">
                PLATAFORMA EXECUTIVA DE INTELIGÊNCIA
              </p>
            </div>
          </div>

          {/* System Status Indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[11px] font-mono font-semibold tracking-wide text-emerald-300 uppercase">
              Core Ativo v4.2
            </span>
          </div>
        </div>

        {/* CENTER CONTENT: SLOGAN & RADAR / DATA SCIENCE SHOWCASE */}
        <div className="relative z-10 my-8 lg:my-auto flex flex-col items-center lg:items-start max-w-xl">
          {/* Executive Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-mono font-semibold tracking-wide uppercase mb-4">
            <Cpu className="h-3.5 w-3.5 text-emerald-400" />
            Algoritmo PAdj & Decisão Multidimensional
          </div>

          {/* Hero Slogan */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.1] text-center lg:text-left">
            O Motor de Decisão do{" "}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Futebol de Elite
            </span>
          </h1>

          <p className="text-zinc-400 text-sm sm:text-base mt-3 leading-relaxed text-center lg:text-left max-w-lg">
            Inteligência quantitativa para diretorias de futebol. Reduza o risco de
            contratações multimilionárias com modelos preditivos calibrados por posse e contexto tático.
          </p>

          {/* Radar & Floating Stats Visual Container */}
          <div className="w-full mt-8 flex flex-col items-center lg:items-start gap-6">
            {/* Radar Visual */}
            <div className="relative flex justify-center w-full lg:justify-start">
              <RadarChartGraphic />
            </div>

            {/* Floating Stats Grid (Data Science vibe) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              {/* Stat Card 1 */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Índice Global (IDG)
                  </span>
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-mono font-black text-white">
                    94.8
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">
                    +18.4%
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Top 1% Percentil Posicional
                </p>
              </div>

              {/* Stat Card 2 */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Normalização PAdj
                  </span>
                  <TrendingUp className="h-3.5 w-3.5 text-cyan-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-mono font-black text-white">
                    98º
                  </span>
                  <span className="text-[10px] font-mono font-bold text-cyan-400">
                    Z-Score +2.2σ
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  Ajustado por posse de bola
                </p>
              </div>

              {/* Stat Card 3 */}
              <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md hover:border-emerald-500/30 transition-colors">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider">
                    Shadow Board
                  </span>
                  <Database className="h-3.5 w-3.5 text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-mono font-black text-white">
                    3.420+
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    Atletas
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 mt-1">
                  14 Ligas Internacionais
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM BRAND FOOTER */}
        <div className="relative z-10 pt-6 mt-6 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
          <p>© 2026 Overview Scout Technologies Inc. Propriedade Intelectual Registrada.</p>
          <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-400">
            <span>SALA DE OPERAÇÕES</span>
            <span>•</span>
            <span className="text-emerald-400">CONFIDENCIAL</span>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          LADO DIREITO: ACESSO (Fundo Branco/Cinza Claro Estilo Apple / Vercel)
          ──────────────────────────────────────────────────────────────────────── */}
      <div className="relative w-full lg:w-[46%] xl:w-[42%] min-h-[500px] lg:min-h-screen bg-zinc-50 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        {/* Subtle Vercel-style ambient vignette */}
        <div className="pointer-events-none absolute inset-0 bg-radial from-transparent via-transparent to-zinc-200/40" />

        <div className="relative z-10 w-full">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center h-72 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                <p className="text-xs text-zinc-500 font-mono">
                  Carregando terminal seguro...
                </p>
              </div>
            }
          >
            <ExecutiveLoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
