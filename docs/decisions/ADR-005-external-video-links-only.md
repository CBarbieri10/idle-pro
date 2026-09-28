# ADR-005: Vídeos Exclusivamente via Link Externo (Zero Processamento de Mídia)

**Status:** accepted
**Date:** 2026-09-28
**Context:** O fluxo de trabalho de vídeo já existe fora do sistema: as decupagens são feitas em ferramentas especializadas (Wyscout, etc.) e os clipes finais são hospedados no Google Drive. O relatório em PDF inclui menção "CLIQUE NA IMAGEM PARA ABRIR O VÍDEO" com link para o clipe externo.
**Decision:** O sistema armazena exclusivamente URLs de clipes externos (Google Drive, YouTube, Vimeo, etc.), categorizadas por ação tática e atreladas ao atleta/jogo. Zero infraestrutura de vídeo: sem upload, sem transcoding, sem storage de mídia, sem player embutido.
**Consequences:**
- ✅ Zero custo de infraestrutura de vídeo (CDN, storage, transcoding)
- ✅ Aproveita o fluxo já existente do analista
- ✅ Links clicáveis no PDF gerado mantêm a funcionalidade atual
- ⚠️ Dependência total da disponibilidade do Google Drive / host externo
- ⚠️ Links podem quebrar se o arquivo for movido ou permissões alteradas
