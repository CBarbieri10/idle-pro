# ADR-007: Catálogo de Liga como Dado de Referência Compartilhado

**Status:** accepted
**Date:** 2026-09-28
**Context:** O analista precisa comparar seus atletas com outros jogadores da mesma posição na liga. Isso requer um catálogo com todos os ~600 atletas do campeonato (20 times × 30 jogadores), atualizado por rodada via importação de Excel das plataformas. No MVP single-tenant, esse catálogo é gerido pela The Net Scouting. Na V2 multi-tenant, será dado compartilhado entre organizações.
**Decision:**
1. Existem dois conceitos distintos de "atleta no sistema":
   - **Catálogo da Liga:** Todos os atletas do campeonato com métricas canônicas atualizadas por rodada. Usado para comparações, rankings por posição e benchmarking.
   - **Portfólio do Analista:** Subconjunto de atletas que o analista está acompanhando de perto, com anotações, clipes, relatórios e métricas detalhadas (brutas + canônicas).
2. O analista "adiciona ao portfólio" um atleta do catálogo para acompanhá-lo com profundidade. Dados do catálogo fluem para o portfólio automaticamente.
3. A importação de Excel por rodada alimenta o catálogo da liga inteira de uma vez.
**Consequences:**
- ✅ Comparações de posição ficam naturais (filtro: "todos os laterais-direitos da Série A2")
- ✅ Dados de liga atualizados por rodada via bulk import
- ✅ Separação clara entre "dados da liga" e "meu trabalho de análise"
- ⚠️ Na V2, o catálogo precisa ser compartilhado entre tenants sem duplicação
- ⚠️ Importação em massa (~600 atletas × N métricas) precisa ser performática
