# ADR-001: MVP Single-Tenant — Multi-Tenancy Adiado

**Status:** accepted
**Date:** 2026-09-28
**Context:** A spec original mencionava multi-tenancy para V2. Durante o grilling, o cliente confirmou que o MVP será usado exclusivamente pela The Net Scouting. Outras empresas entram apenas após consolidação do produto.
**Decision:** O MVP não terá isolamento de dados multi-tenant (org_id, schemas separados). Haverá autenticação simples (login de analistas da The Net Scouting), mas sem conceito de "Organização/Empresa". O schema do banco será projetado para facilitar a adição futura de `organization_id` em todas as tabelas raiz.
**Consequences:**
- ✅ Reduz complexidade do MVP significativamente (sem RLS, sem tenant routing)
- ✅ Acelera entrega da V1
- ⚠️ A migração para multi-tenant na V2 exigirá adicionar `organization_id` como FK em todas as tabelas e implementar Row Level Security no PostgreSQL
- ⚠️ Todos os seeders e queries devem evitar hardcoding de IDs globais para facilitar a transição
