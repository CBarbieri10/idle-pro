# ADR-002: Armazenamento Dual de Métricas (Bruto + Canônico)

**Status:** accepted
**Date:** 2026-09-28
**Context:** Diferentes plataformas (Wyscout, Sofascore, Sportsbase) exportam métricas com granularidades distintas. O Sportsbase detalha "chutes para fora", enquanto o Wyscout agrupa tudo em "finalizações". O cliente quer preservar ambos os níveis de detalhe.
**Decision:** Adotar modelo de armazenamento dual:
1. **Métricas Brutas (raw_metrics):** Armazena o dado exatamente como veio da plataforma de origem, com referência à fonte e ao formato original. Schema flexível (JSONB) para acomodar campos variáveis por plataforma.
2. **Métricas Canônicas (canonical_metrics):** Vocabulário padronizado do sistema (ex: "Finalizações", "Passes Certos", "Duelos Aéreos/90"). Calculado a partir dos dados brutos via regras de normalização configuráveis.
**Consequences:**
- ✅ Nenhum dado é perdido na importação
- ✅ Comparações entre atletas usam sempre o vocabulário canônico
- ✅ Analistas avançados podem consultar os dados brutos quando precisam de granularidade extra
- ⚠️ Requer manutenção de regras de mapeamento bruto → canônico por plataforma
- ⚠️ JSONB para raw_metrics sacrifica tipagem forte, mas ganha flexibilidade
