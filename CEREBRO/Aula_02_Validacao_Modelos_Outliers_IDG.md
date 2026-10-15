# Aula 02: Validação de Modelos, Outliers e Índice de Desempenho Global (IDG)

**Data:** Outubro de 2026  
**Professor:** Eleandro  
**Módulo:** Matemática e Estatística Aplicada ao Futebol  

---

## 📌 Ideia Central e Resumo
A segunda aula de estatística foca em como auditar e refinar os modelos matemáticos. A principal lição é o abandono da "Média" como verdade absoluta, introduzindo a "Mediana" para evitar que pontos fora da curva (*Outliers*) contaminem a análise. Além disso, o professor apresenta as ferramentas matemáticas para comparar métricas de naturezas diferentes (ex: passes vs. desarmes) através dos Coeficientes de Variação (Pearson e Tornqvist), culminando no **Índice de Desempenho Global (IDG)**, que resume a regularidade de um atleta em um único percentual.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Validação do Modelo (Coeficiente de Correlação de Spearman - CCS)
Não basta gerar uma "Curva de Desempenho", é preciso provar que ela é estatisticamente válida.
*   O CCS não compara os dados brutos, mas sim o **ranqueamento (postos)** dos dados reais versus os projetados pela curva. 
*   Se o CCS for alto (ex: 85%), é **altamente relevante** afirmar que a curva descreve com precisão a performance do atleta. Se for baixo (ex: 12%), o desempenho do atleta está aleatório e a curva é fraca. 
*   *Nota:* O CCS também funciona para métricas negativas (ex: perder a posse de bola). Um CCS negativo forte (-90%) indica que o jogador está consistentemente perdendo performance.

### 2. Média vs. Mediana e o Perigo dos *Outliers*
*   **Média:** Soma de todos os valores dividida pela quantidade. É perigosa porque sofre contaminação severa se houver um dado absurdo.
*   **Outlier:** Um dado discrepante (ex: um centroavante que faz 5 gols por temporada e, do nada, faz 30 em um único ano. O 30 é um *outlier*). Outliers são identificados matematicamente pelo **Z-Score**.
*   **Mediana:** O termo central de uma amostra ordenada. **Regra de Ouro:** Se houver *outliers* nos dados do jogador, NUNCA use a média para avaliá-lo; use a mediana, pois ela ignora as distorções extremas.

### 3. Comparando Grandezas Distintas (Coeficientes de Variação)
Como comparar a eficiência de finalização de um atacante com a eficiência de passe de um meia?
*   **CVP (Coeficiente de Variação de Pearson):** Desvio Padrão dividido pela Média. Usado apenas quando **NÃO** há outliers.
*   **CVT (Coeficiente de Variação de Tornqvist):** Desvio Padrão dividido pela Mediana. Usado quando **HÁ** outliers.
*   Transformar métricas puras em Coeficientes de Variação permite colocar ações diferentes na mesma base percentual para comparação direta.

### 4. Indicador de Desempenho (Individual)
Mede quão próximo o atleta está da meta estipulada pelo treinador.
*   **Fórmula:** $100 \times \frac{K}{\text{Indicador de Excelência}}$
*   Onde $K$ é o Patamar Máximo que o atleta está conseguindo entregar atualmente e o *Indicador de Excelência* é o objetivo tático (ex: treinador exige 12.000 metros percorridos).

### 5. Índice de Desempenho Global (IDG)
É a consolidação dos Coeficientes de Variação de vários parâmetros (ex: os 5 parâmetros principais de um atacante) em um único número que revela a estabilidade/regularidade do atleta:
*   **< 15%:** Baixa Dispersão / Alta Estabilidade (Atleta extremamente regular).
*   **15% a 30%:** Média Estabilidade.
*   **> 30%:** Alta Dispersão / Baixa Estabilidade (Atleta muito instável/inconsistente).

---

## ⚽ Aplicação Prática (Mão na Massa)

### Limite de Parâmetros no Modelo
*   **A Regra dos 7:** Na modelagem de um elenco, não se deve ultrapassar 7 parâmetros táticos/técnicos por posição. 
*   *Motivo:* 7 parâmetros x 11 posições = 77 parâmetros globais. Para calcular 77 parâmetros, você precisará coletar mais de 150 indicadores brutos (ex: para gerar o parâmetro "Eficiência de Chute", você precisa dos indicadores "Chutes Totais" e "Chutes no Alvo"). Ultrapassar isso torna a coleta inviável sem automação de altíssimo custo.

### Uso da IA Generativa na Estatística
*   Ferramentas como ChatGPT, Claude ou Gemini (assim como Copilots no Antigravity) sabem programar Dashboards em HTML/JS com perfeição.
*   Porém, a **arquitetura do dado** deve ser humana. A IA pode escrever o código do gráfico, mas a decisão de usar o cálculo de *Tornqvist (CVT)* em vez de *Pearson (CVP)* devido à presença de um *outlier* detectado na temporada deve ser do Analista de Desempenho. A IA acelera a codificação, mas não substitui o rigor estatístico.

---
**Tags:** #estatistica #matematica #CCS #Spearman #Outliers #Mediana #ZScore #CVP #CVT #IDG #Performance #aula02
