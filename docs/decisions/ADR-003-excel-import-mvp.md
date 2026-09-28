# ADR-003: Importação via Excel no MVP — Screenshots e OCR Adiados

**Status:** accepted
**Date:** 2026-09-28
**Context:** O fluxo de trabalho do analista envolve coleta de dados de múltiplas fontes: Excel (.xlsx/.xlsm), tabelas, prints de tela e PDFs. O cliente confirmou que nem sempre consegue exportar Excel das plataformas, precisando recorrer a screenshots. Porém, OCR de screenshots é complexo, propenso a erros e custoso para MVP.
**Decision:** No MVP, duas vias de entrada de métricas:
1. **Importação de Excel/CSV:** Parser automático com mapeamento de colunas para o vocabulário canônico.
2. **Entrada manual via formulário:** Para quando o analista só tem prints ou PDFs — ele transcreve os dados manualmente no sistema.
Screenshots com OCR automático ficam mapeados para V2, quando houver volume que justifique o investimento técnico.
**Consequences:**
- ✅ MVP viável sem dependência de OCR/ML
- ✅ Parser de Excel é confiável e testável
- ⚠️ Analistas que dependem de screenshots terão trabalho manual de transcrição no MVP
- ⚠️ O formulário manual precisa ser ergonômico para minimizar fricção (autocomplete, presets por posição)
