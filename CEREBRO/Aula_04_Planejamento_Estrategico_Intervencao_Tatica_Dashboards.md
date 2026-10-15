# Aula 04: Planejamento Estratégico, Intervenção Tática e Dashboards Finais

**Data:** Outubro de 2026  
**Professor:** Eleandro (com participação de Ricardo Pombo)  
**Módulo:** Matemática e Estatística Aplicada ao Futebol  

---

## 📌 Ideia Central e Resumo
A aula final deste módulo coroa o uso do modelo estatístico (IDG + Curvas de Desempenho + Matrizes de Correlação). O professor Eleandro mostra como dividir o campeonato em "Tiers" (fases) para aplicar intervenções cirúrgicas no desenvolvimento dos atletas, evitando que cheguem ao fim da temporada sem corrigir suas deficiências. A principal lição é que os dados por si só não têm valor se não forem transformados em **Insights Acionáveis** para o treinador. Por fim, o Professor Pombo demonstra a integração de métricas de eficiência coletiva (xG, Gols, Aproveitamento) em Dashboards de BI.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Divisão Estratégica do Campeonato (Modelo de 38 Rodadas)
Para não agir de forma reativa, o cientista de dados deve dividir a temporada em blocos de intervenção:
*   **Rodada 1 à 4:** Formação das características e sistema de jogo.
*   **Rodada 5 à 8:** Consolidação dos parâmetros de monitoramento.
*   **Rodada 9 à 12:** Fortalecimento da performance. (Fase crítica para sugerir dispensas ou contratações antes da janela de transferência abrir, amparado pela Curva de Aprendizado dos atletas).
*   **Rodada 13 à 16:** Polimento (Refinamento do que já está dando certo).
*   **Rodada 17 à 25:** Estabilização da regularidade (onde os times campeões se desgarram).
*   **Rodada 26 à 38:** Vigilância (Manutenção da performance e proteção contra estafa/lesões).

### 2. A Missão Tripla do Analista no Pós-Jogo
O que entregar ao treinador na manhã seguinte a uma partida?
1.  **Verificar:** As recomendações da semana passada foram acatadas e executadas no jogo?
2.  **Identificar:** Novos *insights* e correlações gerados pelo jogo de ontem.
3.  **Recomendar:** O que deve ser o foco do treino desta semana baseado nos dados (Ex: o lateral cruzou muito no vazio; foco no preenchimento da área).

### 3. O Zero Técnico (Manipulação Responsável de Dados)
*   Em parâmetros que medem eficiência (de 0 a 100%), um resultado de "Zero Absoluto" (ex: 0 gols em 0 finalizações) pode "quebrar" a fórmula de Mínimos Quadrados devido a uma divisão por zero.
*   **Solução:** Inserir o *Zero Técnico* (ex: $0.01$ ou $0.001$), uma ordem de grandeza inferior ao menor dado real da planilha. Isso mantém a viabilidade matemática sem contaminar a realidade estatística do atleta.

### 4. O Cuidado Ético e Prático com Outliers
*   Excluir *outliers* (pontos muito fora da curva) da base de dados apenas para a linha do gráfico ficar "mais bonita" é um erro que maquia a realidade.
*   O *outlier* é um fato. O analista não deve excluí-lo dos cálculos finais, mas sim isolá-lo momentaneamente apenas para entender a sensibilidade do modelo. A presença constante de *outliers* indica instabilidade emocional, tática ou física que deve ser trabalhada pela comissão.

---

## 🛠 Stack Tecnológico e Ferramentas

### Dashboards de Monitoramento (Excel/Google Sheets)
*   **Input:** Variáveis extraídas de plataformas (SofaScore, FBref) inseridas na aba de dados.
*   **Processamento (Automático):** A planilha calcula o $K$ (Patamar Máximo), $R$ (Taxa de Aprendizagem) e o $IDG$ (Índice de Desempenho Global).
*   **Aba Radar:** Mostra o retrato atual da última partida.
*   **Aba Matrizes:** Mostra o $P$-Valor e o $R^2$ para provar quais parâmetros têm sincronia útil ou quais são redundantes.

### Dashboards de Eficiência Coletiva (PowerBI / Looker Studio)
*   Demonstrado pelo Prof. Pombo: Cruzamento de **XG Criado vs. Gols Reais** e **XGA (Expectativa de Gols Sofridos) vs. Gols Sofridos Reais**.
*   O Flamengo de 2025 foi usado como case: Campeão com pequena margem de pontos sobre o Palmeiras porque apresentou uma **Eficiência de Aproveitamento** sutilmente superior na conversão do seu XG, além de maior solidez defensiva (menor XGA).

---

## ⚽ Aplicação Prática (Mão na Massa)

### Consultoria Individualizada (O Novo Mercado)
*   A aula mostrou o "Scout Reverso". O analista não é funcionário do clube, mas sim contratado pela agência/staff do jogador.
*   O cientista de dados monitora (ex: 5 a 12 parâmetros específicos, como "Eficiência sob pressão" ou "Taxa de verticalidade") e informa o atleta de forma particular.
*   **Exemplo:** O modelo acusou queda drástica na "Eficiência sob Pressão" de um jovem zagueiro. A análise qualitativa cruzada mostrou que o erro era de *Posicionamento Corporal*. Uma intervenção direta no treinamento do atleta resolveu o defeito antes dele subir ao profissional de um gigante paulista.

---
**Tags:** #estatistica #ZeroTecnico #PlanejamentoEstrategico #Outliers #EficienciaColetiva #XG #LookerStudio #Dashboards #aula04
