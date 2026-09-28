# ADR-006: Stack Tecnológica — Next.js + Tailwind + shadcn/ui + Prisma + PostgreSQL

**Status:** accepted
**Date:** 2026-09-28
**Context:** O produto é um portal web full-stack com autenticação, CRUD de entidades, importação de dados, e geração de PDF. Requer SSR para performance, API routes para lógica de backend, e uma UI rica e responsiva.
**Decision:**
- **Framework:** Next.js 14+ com App Router (RSC + Server Actions)
- **UI:** Tailwind CSS + shadcn/ui (componentes acessíveis e customizáveis)
- **ORM:** Prisma (type-safe, migrations automáticas, introspecção de schema)
- **Banco:** PostgreSQL (relacional, JSONB para métricas brutas, extensível)
- **PDF:** `@react-pdf/renderer` (componentes React → PDF estático)
- **Auth:** NextAuth.js (credentials provider no MVP, OAuth na V2)
**Consequences:**
- ✅ Full-stack em um projeto só (sem backend separado)
- ✅ Type-safety ponta a ponta (TypeScript + Prisma + React)
- ✅ shadcn/ui fornece componentes de tabela, formulário, dialog prontos para uso
- ✅ Prisma migrations facilitam evolução do schema
- ⚠️ `@react-pdf/renderer` roda em Node.js — geração de PDFs pesados pode precisar de queue/worker na V2
- ⚠️ App Router + RSC tem curva de aprendizado para padrões de data fetching
