# The Net Scouting — Design System & Diretrizes Visuais (Enterprise Edition)

Este documento estabelece o padrão visual, tokens de design, regras de tipografia e padrões de interface para a plataforma **The Net Scouting (TNS)**. O objetivo é garantir uma experiência visual executiva, moderna e de alto padrão (nível enterprise), eliminando qualquer aspecto de rascunho ou protótipo amador.

---

## 1. Filosofia de Design & Identidade

- **Propósito:** Software executivo para diretores de futebol, scouts chefes e analistas de mercado.
- **Tom de Voz Visual:** Sério, tecnológico, cirúrgico, refinado e focado em dados acionáveis.
- **Abordagem:** **Dark Mode Nativo Profundo** com superfícies em camadas (Obsidian / Dark Slate), acentos luminosos de alta precisão e impressão em papel com padrão **Dossiê Executivo A4**.

---

## 2. Paleta de Cores e Tokens Semânticos

### 2.1 Superfícies Dark Mode (Hierarquia em Camadas)
| Token | Cor Hex | OKLCH / CSS | Função |
|---|---|---|---|
| `--bg-base` | `#090a0f` | `oklch(0.12 0.006 285)` | Fundo da aplicação (Obsidian profundo) |
| `--bg-surface` | `#11131a` | `oklch(0.16 0.008 285)` | Cards principais, tabelas e painéis |
| `--bg-surface-elevated` | `#171a24` | `oklch(0.20 0.010 285)` | Cards flutuantes, modais e tooltips |
| `--bg-surface-highlight` | `#202433` | `oklch(0.25 0.012 285)` | Hover states, linhas ativas e seleções |
| `--border-subtle` | `#1f2333` | `oklch(1 0 0 / 8%)` | Divisores discretos entre seções |
| `--border-strong` | `#2f354d` | `oklch(1 0 0 / 16%)` | Contornos de cards e botões interativos |

### 2.2 Cores de Acento & Metodologia Tática
| Categoria | Token | Cor Hex | Aplicação |
|---|---|---|---|
| **Marca / Primário** | `--tns-primary` | `#6366f1` (Indigo 500) | Ações primárias, identidade TNS e logos |
| **Destaque Per-90 (Elite)** | `--metric-highlight` | `#10b981` (Emerald 500) | Números de alto rendimento, percentis > 75% |
| **Ataque / Produção** | `--cat-attack` | `#f43f5e` (Rose 500) | Gols, xG, finalizações, dribles |
| **Construção / Passe** | `--cat-possession`| `#3b82f6` (Blue 500) | Passes certos, bolas longas, progressão |
| **Defesa / Combate** | `--cat-defense` | `#10b981` (Emerald 500) | Desarmes, interceptações, duelos |
| **Status / Avaliação** | `--tns-amber` | `#f59e0b` (Amber 500) | Notas de atuação, rankings e favoritos |

---

## 3. Tipografia & Tratamento Numérico

### 3.1 Famílias Tipográficas
- **Texto Base da Aplicação, Tabelas e Dashboards:** `Geist Sans` (`--font-geist-sans`) aplicado como padrão global (`html, body`). Foco absoluto em alta densidade de informação e máxima legibilidade de dados em modo escuro.
- **Grandes Títulos Executivos (Headings) & Cabeçalho do PDF:** `Lora` (`--font-serif-luxury` / `font-serif`) estritamente reservada para H1, títulos nobres de seções e identificação do Dossiê Executivo A4, conferindo sofisticação editorial.
- **Métricas e Dados:** `Geist Mono` (`--font-geist-mono`) com `tabular-nums` obrigatório em tabelas, cards e percentis para evitar tremor e desalinhamento numérico.

### 3.2 Escala e Hierarquia
- **Títulos Executivos (H1):** `text-xl` a `text-2xl`, `font-black`, `tracking-tight`, estilizados com `font-serif`.
- **Cabeçalhos de Seção (H2/H3):** `text-xs` a `text-sm`, `font-bold`, `uppercase`, `tracking-wider`, acompanhados de ícones semânticos de 14px.
- **Métricas Primárias (Per-90):** `font-black`, `font-mono`, `text-sm` a `text-lg`. Sufixo `/90` sempre em `text-[10px]` com opacidade atenuada (60-70%).
- **Micro-Labels de Apoio:** `text-[10px]` ou `text-[9px]`, `font-medium`, `text-muted-foreground`.

---

## 4. Sombras, Bordas e Efeitos Visuais

1. **Bordas Finas:** Evitar bordas pesadas. Usar `border border-white/10` ou `border border-white/5` com cantos suaves (`rounded-xl` para containers, `rounded-lg` para sub-cards).
2. **Glassmorphism Tático:** Fundos de cabeçalho e filtros utilizam `backdrop-blur-md bg-background/80` com contorno sutil.
3. **Hero Photo Stage:** Fotos de atletas com fundo transparente utilizam o gradiente `.photo-stage` com malha tática sutil em grade (grid lines a 4% de opacidade) para dar a impressão de estúdio holográfico.
4. **Micro-interações:** Hover com transição de 150ms (`transition-colors duration-150`), sem animações exageradas ou lentas.

---

## 5. Diretrizes do Relatório Executivo "Raio-X" (PDF / Print)

### 5.1 Especificação A4 Retrato
- Tamanho exato: `210mm x 297mm` (A4 Portrait).
- Margens: `8mm 10mm 8mm 10mm`.
- Toda a síntese executiva do atleta deve caber com perfeição em **1 única página**, sem transbordar para a página 2.

### 5.2 Regras de Isolamento de Impressão (`@media print`)
1. **Ocultação do Shell do App:** `#app-shell`, navegadores, barras de navegação, modais overlays e botões de ação são forçados para `display: none !important;`.
2. **Contraste em Papel Branco:** O relatório impresso inverte o fundo escuro para branco puro (`#ffffff`) com tipografia em preto/grafite profundo (`#09090b` / `#18181b`) para economizar tinta e garantir legibilidade fotográfica.
3. **Fidelidade de Cores:** `print-color-adjust: exact !important;` e `-webkit-print-color-adjust: exact !important;` ativos no container para preservar as cores do radar SVG e das categorias táticas.
4. **Sem Filtros SVG Pesados:** Na impressão, filtros de desfoque/glow (`feGaussianBlur`) são desativados (`filter: none !important`) para evitar bugs do renderizador Chromium PDF.
5. **Prevenção de Quebras de Página:** Todos os módulos de estatísticas (Ataque, Posse, Defesa e Radar) recebem `break-inside: avoid !important;` e `page-break-inside: avoid !important;`.
6. **Layout Bi-colunar Flexível:** O radar tático fica posicionado à esquerda (46% de largura) e as 3 caixas de métricas à direita (54% de largura) em layout flexível estável.

---

## 6. Status de Aplicação do Design System (Roadmap Visual)

- **[x] Fase 1 (Concluída):** Padronização dos tokens globais, `DESIGN.md` e correção definitiva do PDF do Raio-X (isolamento em clean iframe e rota dedicada `/athletes/[id]/raio-x`).
- **[x] Fase 2 (Concluída):** Repaginação da Lista e Cards de Atletas (`/athletes`, `/league` e `/scouting`) com layout fluido widescreen (5 colunas) e frosted glass.
- **[x] Fase 3 (Concluída):** Repaginação do Perfil Detalhado do Atleta (`/athletes/[id]`) com Dark Stage hero, campinho tático BeSoccer Pro, radar multi-eixo e similar athletes.
- **[x] Fase 4 (Concluída):** Polimento do Dashboard do Analista (`/` e `/reports`), sidebar com radar live badge e iluminação stadium.
- **[ ] Fase 5 (Atual / Em Desenvolvimento):** Videoteca Tática (Links externos categorizados), Módulo de Metas e Caderno Completo de Relatórios PDF.
