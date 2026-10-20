import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isLoggedIn = !!session;
  const pathname = nextUrl.pathname;

  // Public routes that don't require authentication
  const isAuthRoute = pathname.startsWith("/login");
  const isApiAuthRoute = pathname.startsWith("/api/auth");
  const isApiChatRoute =
    pathname.startsWith("/api/chat") ||
    pathname.startsWith("/api/ai");

  // Allow auth API routes and AI chat route
  if (isApiAuthRoute || isApiChatRoute) return NextResponse.next();

  // If on login page and already logged in → redirect to dashboard or athlete profile
  if (isAuthRoute) {
    if (isLoggedIn) {
      const role = session?.user?.role;
      const athleteId = session?.user?.athleteId;
      if (role === "ATHLETE" && athleteId) {
        return NextResponse.redirect(new URL(`/athletes/${athleteId}`, nextUrl));
      }
      return NextResponse.redirect(new URL("/performance/squad", nextUrl));
    }
    return NextResponse.next();
  }

  // All other routes require authentication
  if (!isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const user = session?.user;
  const role = user?.role;
  const athleteId = user?.athleteId;

  const isImportRoute = pathname.startsWith("/admin");
  const isLeadersRoute = pathname.startsWith("/competition");
  const isCatalogRoute = pathname.startsWith("/catalog") || pathname === "/league";
  const isAthletesDirectory = pathname === "/athletes";

  // 1. Isolamento de Perfil ATHLETE (Passo 2):
  // Um usuário ATHLETE não pode navegar livremente pelo banco de talentos;
  // O painel dele é restrito à sua própria página de perfil (/athletes/[meu-id]).
  if (role === "ATHLETE") {
    // Bloquear /admin/import, /competition/leaders, catálogo e diretório de atletas
    if (isImportRoute || isLeadersRoute || isCatalogRoute || isAthletesDirectory) {
      if (athleteId) {
        return NextResponse.redirect(new URL(`/athletes/${athleteId}`, nextUrl));
      }
      return NextResponse.redirect(new URL("/", nextUrl));
    }

    // Se tentar acessar o perfil de outro atleta (/athletes/[outro-id]), redireciona para o seu
    if (pathname.startsWith("/athletes/")) {
      const targetId = pathname.split("/athletes/")[1]?.split("/")[0];
      if (targetId && athleteId && targetId !== athleteId) {
        return NextResponse.redirect(new URL(`/athletes/${athleteId}`, nextUrl));
      }
    }
  }

  // 2. Bloqueio de rotas: Apenas ANALYST, CLUB (e ADMIN) têm permissão para /admin/import e /competition/leaders
  if (isImportRoute || isLeadersRoute) {
    if (role !== "ANALYST" && role !== "CLUB" && role !== "ADMIN") {
      const redirectUrl = athleteId
        ? new URL(`/athletes/${athleteId}`, nextUrl)
        : new URL("/", nextUrl);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
