# ADR-008: Fotos de Atletas via Upload Manual no MVP

**Status:** accepted
**Date:** 2026-09-28
**Context:** Os relatórios incluem fotos dos atletas (retrato e ação). O cliente expressou desejo de busca automática de fotos. Porém, scraping de sites como Transfermarkt, SofaScore ou Google Images apresenta riscos legais (direitos de imagem, Terms of Service), fragilidade técnica (scrapers quebram frequentemente) e custo de manutenção desproporcional para MVP.
**Decision:** No MVP, fotos de atletas serão inseridas via **upload manual** pelo analista (PNG/JPG/WebP). O sistema armazena as imagens em storage local ou cloud (S3/Supabase Storage) e as associa ao perfil do atleta. Para V2, avaliar integração com APIs oficiais que forneçam fotos licenciadas (ex: API do Transfermarkt Pro, se disponível).
**Consequences:**
- ✅ Zero risco legal com direitos de imagem
- ✅ Implementação simples e confiável
- ✅ Analista controla exatamente qual foto usar em cada contexto
- ⚠️ Trabalho manual de buscar e fazer upload das fotos
- ⚠️ Fotos de ação (jogador em campo) precisam ser cortadas/editadas antes do upload
