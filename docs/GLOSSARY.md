# Glossário de Domínio — Portal de Inteligência Esportiva (The Net Scouting)

---

## Ação / Tagueamento

Evento bruto e isolado do jogo (ex: cabeceio, interceptação, finalização) capturado em ferramentas de terceiros (Wyscout, Sofascore, Sportsbase). É o grão atômico de análise tática.

**Também conhecido como:** Tag, Evento de jogo
**Não confundir com:** Métrica (que é o dado quantitativo agregado a partir das ações)

---

## Analista de Desempenho

O usuário principal do sistema no MVP. Profissional que coleta dados, produz análises táticas e gera relatórios para clubes ou atletas. Cada analista tem seu próprio portfólio de atletas.

**Também conhecido como:** Scout, Analista

---

## Atleta (Root Entity)

Entidade primária do sistema. Toda navegação e estruturação de dados gira em torno do perfil individual do jogador. Um atleta pertence a um clube e, opcionalmente, a uma seleção nacional.

**Não confundir com:** Entrada no Catálogo da Liga (que é o registro de referência com métricas básicas)

---

## Catálogo da Liga

Repositório de referência com todos os atletas de um campeonato (~600 por liga), atualizado por rodada via importação de Excel. Usado para comparações entre jogadores de mesma posição e benchmarking. Não contém anotações ou relatórios — apenas métricas canônicas.

**Não confundir com:** Portfólio do Analista (que é o subconjunto com dados profundos)

---

## Clipe Externo

Arquivo de vídeo já processado com marcações táticas, hospedado fora do sistema (Google Drive, YouTube, Vimeo) e referenciado na plataforma exclusivamente via URL. O sistema não faz upload, storage nem processamento de vídeo.

**Também conhecido como:** Vídeo, Clip
**Não confundir com:** Ação/Tagueamento (que é o evento descrito textualmente, não o vídeo)

---

## Métrica Bruta (Raw Metric)

Dado quantitativo exatamente como veio da plataforma de origem (Wyscout, Sofascore, Sportsbase), preservando a nomenclatura e granularidade original. Armazenado em formato flexível (JSONB) com referência à fonte.

**Não confundir com:** Métrica Canônica (que é a versão normalizada)

---

## Métrica Canônica (Canonical Metric)

Dado quantitativo normalizado para o vocabulário padronizado do sistema (ex: "Finalizações", "Passes Certos/90", "Duelos Aéreos/90"). Calculado a partir das métricas brutas via regras de mapeamento por plataforma. Usado para comparações entre atletas independente da fonte original.

**Também conhecido como:** Métrica normalizada, Indicador

---

## Meta

Indicador de performance com valor atual e valor-alvo definidos pelo analista para um atleta (ex: "Passes Precisos: Atual 56% → Meta 70%+"). Inclui objetivo textual que justifica a meta. Aparece na página de Metas do relatório.

---

## Página de Relatório (Report Page)

Componente visual atômico do relatório PDF. Cada tipo de página tem layout e dados específicos. Tipos identificados: **Capa**, **Pré-Jogo**, **Pós-Jogo**, **Raio-X**, **Metas**. Relatórios são compostos pela seleção e ordenação de páginas.

---

## Portfólio do Analista

Subconjunto de atletas que o analista acompanha com profundidade. Contém métricas brutas + canônicas, anotações, clipes externos, fotos e relatórios. O analista "puxa" atletas do Catálogo da Liga para seu portfólio.

**Não confundir com:** Catálogo da Liga (que é o repositório de referência com todos os atletas)

---

## Relatório Automatizado (Report)

Entregável final do sistema, exportado em PDF a partir de templates composíveis. Consolida avaliações textuais, métricas, fotos e links de vídeo. Substitui o processo manual de diagramação no Canva. Tipos existentes: Relatório de Scouting, Pré-Jogo, Pós-Jogo, Raio-X/Mercado, Temporada.

---

## Rodada (Matchday)

Unidade temporal de atualização de dados no sistema. As métricas do catálogo da liga são atualizadas a cada rodada do campeonato. As métricas individuais do portfólio podem ser atualizadas a cada jogo do atleta.

---

## Tipo de Relatório (Report Type)

Template pré-definido que determina quais tipos de página compõem o relatório e em qual ordem padrão. O analista pode customizar a composição a partir do template base.

**Exemplos:** "Relatório de Scouting" = Capa + Raio-X + Metas; "Relatório Pré-Jogo" = Capa + Pré-Jogo
