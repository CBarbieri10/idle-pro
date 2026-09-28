# ADR-004: Sistema de Relatórios com Páginas Composíveis

**Status:** accepted
**Date:** 2026-09-28
**Context:** A análise dos templates visuais existentes (feitos no Canva) revelou que os relatórios da The Net Scouting são compostos por tipos de páginas reutilizáveis. Cada relatório monta uma sequência diferente dessas páginas. Foram identificados os seguintes tipos de página:
- **Capa:** Branding + nome do atleta + match info + escudo + foto
- **Pré-Jogo:** Análise tática do adversário + link de vídeo + escudo adversário
- **Pós-Jogo:** Observação pós-partida + foto de ação + link de vídeo
- **Raio-X:** Scouting detalhado + foto + link de vídeo
- **Metas:** Indicadores atuais vs. metas com objetivos textuais + foto

**Decision:** O motor de relatórios usará um sistema de **templates composíveis por páginas**:
1. Cada tipo de página é um componente React renderizável pelo `@react-pdf/renderer`.
2. Um "Tipo de Relatório" (ex: "Relatório de Scouting") é uma lista ordenada de tipos de página.
3. O analista monta o relatório selecionando quais páginas incluir e em qual ordem.
4. Cada página recebe dados do banco (métricas, textos, URLs de vídeo, fotos) e renderiza no layout padronizado com branding The Net Scouting.

**Consequences:**
- ✅ Máxima flexibilidade: novos tipos de página podem ser adicionados sem alterar o motor
- ✅ Tipos de relatório pré-definidos aceleram o fluxo (o analista não precisa montar do zero toda vez)
- ✅ Layout visual consistente garantido por componentes padronizados
- ⚠️ Cada tipo de página é um componente React específico — exige desenvolvimento individual
- ⚠️ O branding (logo, cores, fontes) precisa ser configurável para o futuro multi-tenant (V2)
