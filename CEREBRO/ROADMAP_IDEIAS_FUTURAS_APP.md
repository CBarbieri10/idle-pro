# 🗺️ Roadmap de Inovação & Inteligência: Da Teoria ao App

**Data de Registro:** Outubro de 2026  
**Origem:** Síntese dos 7 Módulos de Especialização (`CEREBRO`)  
**Destino:** Projeto `idle-pro` (Fase 6 e Expansões Futuras)  

---

## 🎯 Visão Geral
Este documento consolida as ideias de produtos, algoritmos e funcionalidades derivadas de 33 aulas com analistas e cientistas de ponta (Palmeiras, Norwich City, SECA/UFMG, etc.). Ele serve como guia estratégico para evolução do software após a conclusão do MVP estruturado nas Fases 1 a 5 do `idle-pro`.

---

## 📦 Módulos de Expansão (Backlog Estratégico)

### 1. 📈 Motor Estatístico & Preditivo (Prof. Eleandro)
*   **Cálculo Automatizado do IDG (Índice de Desempenho Global):**
    *   Algoritmo que processa a dispersão dos parâmetros do atleta:
        *   $< 15\%$: Alta estabilidade / Regularidade de elite.
        *   $15\% \text{ a } 30\%$: Média estabilidade.
        *   $> 30\%$: Instabilidade crítica (alerta para comissão).
*   **Detecção Inteligente de Outliers (Z-Score):**
    *   O sistema avalia a distribuição dos dados de cada atleta.
    *   Se houver *outliers*, aplica automaticamente o Coeficiente de Variação de **Tornqvist (CVT)** (usando a mediana).
    *   Se não houver, aplica o de **Pearson (CVP)** (usando a média).
*   **Curva de Aprendizagem e Teto de Rendimento ($K$ e $R$):**
    *   Regressão por Mínimos Quadrados para estimar a velocidade de aprendizado ($R$) e o patamar máximo ($K$).
    *   Disparo de alerta preventivo entre as rodadas 9 e 12 caso o reforço/atleta tenha tendência de estagnação abaixo da meta.
*   **Matrizes de Correlação e Eliminação de Redundâncias:**
    *   Matriz $R$, $P$-Valor e $R^2$ para identificar métricas redundantes e enxugar o dashboard para o treinador.
*   **Tratamento do "Zero Técnico":**
    *   Injeção automática de $0.001$ em parâmetros de taxa de conversão zerados para evitar erros de divisão por zero sem distorcer o cálculo.

---

### 2. 🔍 Módulo de Scouting 360º & Recrutamento (Prof. Frederico Forte - Norwich)
*   **Relatório Profissional em 3 Blocos (Padrão Premier League):**
    1.  *Geral:* Dados biométricos, posição primária/secundária, nível atual vs. nível futuro projetado.
    2.  *Corpo Analítico:* Pareceres objetivos divididos em Técnica, Tática, Física e **Mental/Social**.
    3.  *Recomendação:* Monitorar, Aprofundar ou Descartar + fit estratégico com o modelo de jogo.
*   **Dossiê Social & Diligência:**
    *   Registro de histórico de agentes, estabilidade familiar, histórico de lesões crônicas (recorrência muscular) e risco de adaptação cultural/climática.
*   **Calculadora de Elegibilidade GBE / Visto:**
    *   Checklist e pontuação para transferência ao futebol europeu e ligas regulamentadas.
*   **Matriz Visual de Risco (Performance Atual vs. Potencial):**
    *   Quadrante que classifica alvos entre: "Produto Pronto", "Diamante Bruto", "Aposta de Risco" ou "Descarte".

---

### 3. 🗺️ Módulo de Análise Tática, Espacial e Bolas Paradas (Profs. Gibson, Roberto Torrecilhas e Pombo)
*   **Mapeamento de Zona de Ouro e Funil:**
    *   Cálculo de finalizações de 1 toque no miolo da área vs. chutes improdutivos de longe.
    *   Classificação defensiva: eficiência na "Proteção do Funil".
*   **Métricas Espaciais de Posicionamento:**
    *   Razão Profundidade/Largura (identificação de jogo apoiado vs. transição direta).
    *   Tempo de permanência em Terço Final vs. Campo de Ataque estático.
    *   Ocupação dos 5 Corredores (Laterais, Meio-Espaços e Central).
*   **Distância entre Setores:**
    *   Detecção matemática de "time partido" (distância Defesa-Meio vs. Meio-Ataque).
*   **Inteligência de Bolas Paradas:**
    *   Dossiê de escanteios e faltas (~30% dos gols): batedores simultâneos (espaço de dúvida com canhoto/destro), uso de bloqueios e métrica HOPES.

---

### 4. 🤖 Assistente Tático com RAG (AI First - Prof. Leonardo Barbosa)
*   **Chatbot Analista Privado:**
    *   IA contextualizada (System Prompt especialista) conectada diretamente ao banco de dados PostgreSQL do `idle-pro`.
    *   Permite perguntas livres da comissão: *"Quais laterais da nossa liga têm maior volume de passes progressivos e baixo custo?"*
*   **Gerador Automático de Relatórios de Pré/Pós-Jogo:**
    *   Síntese em Markdown e PDF combinando dados quantitativos e observações qualitativas para envio rápido no pós-jogo.

---

## 🚦 Estratégia de Implementação Recomendada

```
[Fase Atual: MVP idle-pro]
T05 (Importação Excel/CSV) ➔ T06 (Normalização Canônica) ➔ T07/T08 (Catálogo & Portfólio) ➔ T09-T14 (Metas & Motor PDF)
                                    │
                                    ▼ (App 100% funcional e estável)
[Fase 6: Expansão CEREBRO]
Módulo 1 (Motor IDG & Estatística) ➔ Módulo 2 (Scout 360º Norwich) ➔ Módulo 3 (Espacial & Bolas Paradas) ➔ Módulo 4 (IA / RAG)
```

---
*Documento arquivado no CEREBRO para consulta e ativação futura.*
