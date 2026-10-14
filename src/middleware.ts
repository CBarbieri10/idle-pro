import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const user = session?.user as { role?: string; athleteId?: string } | undefined;
  const role = user?.role;
  const athleteId = user?.athleteId;

  const isImportRoute = pathname.startsWith("/admin");
  const isLeadersRoute = pathname.startsWith("/competition");
  const isCatalogRoute = pathname.startsWith("/catalog") || pathname === "/league";
  const isAthletesDirectory = pathname === "/athletes";

  // 1. Redirecionar não autenticados tentando acessar áreas protegidas
  if (!session && (isImportRoute || isLeadersRoute)) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Isolamento de Perfil ATHLETE (Passo 2):
  // Um usuário ATHLETE não pode navegar livremente pelo banco de talentos;
  // O painel dele é restrito à sua própria página de perfil (/athletes/[meu-id]).
  if (role === "ATHLETE") {
    // Bloquear /admin/import, /competition/leaders, catálogo e diretório de atletas
    if (isImportRoute || isLeadersRoute || isCatalogRoute || isAthletesDirectory) {
      if (athleteId) {
        return NextResponse.redirect(new URL(`/athletes/${athleteId}`, req.nextUrl.origin));
      }
      return NextResponse.redirect(new URL("/", req.nextUrl.origin));
    }

    // Se tentar acessar o perfil de outro atleta (/athletes/[outro-id]), redireciona para o seu
    if (pathname.startsWith("/athletes/")) {
      const targetId = pathname.split("/athletes/")[1]?.split("/")[0];
      if (targetId && athleteId && targetId !== athleteId) {
        return NextResponse.redirect(new URL(`/athletes/${athleteId}`, req.nextUrl.origin));
      }
    }
  }

  // 3. Bloqueio de rotas: Apenas ANALYST, CLUB (e ADMIN) têm permissão para /admin/import e /competition/leaders
  if (isImportRoute || isLeadersRoute) {
    if (role !== "ANALYST" && role !== "CLUB" && role !== "ADMIN") {
      const redirectUrl = athleteId
        ? new URL(`/athletes/${athleteId}`, req.nextUrl.origin)
        : new URL("/", req.nextUrl.origin);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/competition/:path*",
    "/athletes/:path*",
    "/athletes",
    "/catalog/:path*",
    "/league/:path*",
  ],
};
