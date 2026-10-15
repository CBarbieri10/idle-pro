# Índice do CÉREBRO

**Atualizado:** 14/10/2026 · **Pasta única:** `idle-pro/CEREBRO/` (ignorada no git via `.gitignore`)

> Professores só estão indicados onde o próprio arquivo informa. Nos demais, a coluna fica em branco para ser preenchida.

## Módulo Análise Tática (Torrecilhas, Gibson)
| Arquivo | Professor | Tema | Regra/Recurso no app |
|---|---|---|---|
| `Aula_01_Padronizacao_Tatica_Tomada_Decisao_Visao_Analista.md` | Roberto Torrecilhas | Cognição, scanning, filtros do analista | Regra 3 (cognitiva) |
| `Aula_02_Avaliacao_Posicional_Estrategia_Jogo.md` | Roberto Torrecilhas | Viés de Wald, estruturação do elenco, indicadores por posição | Regra 6 (Wald) |
| `Aula_03_Analise_Tatica_Defensiva_Padroes_Marcacao.md` | Roberto Torrecilhas | 1x1 defensivo, regiões de risco, duelo aéreo | Regras 1 e 2 |
| `Aula_02_03_Complemento_Slides_ADCD_Torrecilhas.md` | Roberto Torrecilhas | Complemento dos slides Word (Aulas 0 a 3) | Ideias de métricas novas |
| `Aula_02_Analise_Tatica_Individual_Coletiva_Gibson_Praca_COMPLETA.md` | Gibson Moreira Praça | Análise individual e coletiva (94 slides) | Regras 4 e 5, leaderboards coletivos |

## Módulo Scouting (Frederico Forte)
| Arquivo | Tema |
|---|---|
| `Aula_01_Fundamentos_Scout_Moderno.md` | Scouting como gestão de risco |
| `Aula_02_Dimensao_Tatica_Fases_Jogo_KPIs.md` | Fases do jogo e KPIs por posição |
| `Aula_03_Avaliacao_360_Tecnica_Fisica_Mental_Social.md` | Avaliação 360° |
| `Aula_04_Estrategias_Recrutamento_Relatorios_Profissionais.md` | Modelos de recrutamento e relatório |
| `Forte_Slides_CBF_Academy_Dias_1a4_COMPLEMENTO.md` | Slides oficiais (OCR): fichas dos 6 modelos, KPIs das 8 posições, 360°, matriz performance × potencial, relatório em 3 blocos, GBE/ESC |

## Demais aulas
| Aula | Arquivos |
|---|---|
| 01 | `Analise_Desempenho_Tatica_Futebol`, `Ciencia_Dados_Futebol`, `Matematica_Estatistica_Modelagem_Padroes`, `Metricas_Espaciais_Individuais_Interpretacao_Comunicacao`, `Nivelamento_Python` |
| 02 | `Analise_Posicional_Rastreamento_Dados_Tracking`, `Estruturacao_Projetos_GitHub_Visao_Computacional`, `Metricas_Avancadas_xG_Vantagens_Taticas`, `Nivelamento_Python`, `Validacao_Modelos_Outliers_IDG` |
| 03 | `Captacao_Base_Vies_Maturacional_Fluidez_Tatica`, `Ciencia_Dados_Futebol`, `Dashboard_Analitico_Matrizes_Correlacao`, `Exploracao_Espacial_Razao_Profundidade_Largura`, `Nivelamento_Python` |
| 04 | `Analise_Sistemica_Adversarios_Bolas_Paradas`, `Captacao_Dados_Dashboards_Posicionamento_Analista`, `Ciencia_Dados_Futebol`, `Nivelamento_Python`, `Planejamento_Estrategico_Intervencao_Tatica_Dashboards` |
| 05 a 10 | `Nivelamento_Python` |

## Produto
*   `ROADMAP_IDEIAS_FUTURAS_APP.md` — backlog estratégico do app (Fase 6 em diante).

## Fontes
| Fonte | Local | Situação |
|---|---|---|
| PDFs Forte (Dias 1 a 4) | `Desktop/aulas pdfs` | ✅ Ingeridos por OCR → `Forte_Slides_..._COMPLEMENTO.md` |
| PDF Gibson | `Desktop/aulas pdfs` (cópia única; 2 duplicatas apagadas) | ✅ Coberto pela nota COMPLETA |
| Word Torrecilhas (Aulas 0–3) | `Desktop/overview/aulas` | ✅ Texto ingerido → `Aula_02_03_Complemento_...`; quadros desenhados não lidos |

## Como adicionar novos PDFs
1. Coloque o PDF em `Desktop/aulas pdfs`.
2. Rode: `D:\cerebro_venv\Scripts\python.exe D:\cerebro_scratch\processar_pdfs.py`
3. O texto sai em `D:\cerebro_scratch\saida\`. PDFs já processados e duplicados são avisados e pulados.
4. Peça ao assistente para interpretar e encaixar no CÉREBRO.
