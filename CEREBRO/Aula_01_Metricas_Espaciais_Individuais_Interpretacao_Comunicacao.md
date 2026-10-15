# Aula 01: Métricas Espaciais Individuais, Interpretação e Comunicação

**Data:** Outubro de 2026  
**Professor:** Gibson Moreira Praça (SECA / UFMG)  
**Módulo:** Análise de Desempenho e Ciência de Dados no Futebol  

---

## 📌 Ideia Central e Resumo
A aula final do módulo prático de Análise Posicional foca na extração e interpretação de **Métricas Espaciais Individuais** a partir de dados brutos de rastreamento (*Tracking Data* / Coordenadas X e Y). O professor demonstra como traduzir coordenadas cartesianas em *insights* acionáveis sobre o comportamento dos atletas em campo (tempo no ataque, tempo na defesa, ocupação de corredores). A aula encerra com as diretrizes metodológicas para a elaboração do Trabalho Final, ressaltando que o maior desafio do analista não é gerar o dado, mas sim comunicá-lo de forma simples e visual para a comissão técnica.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Métricas Espaciais Individuais (Equações Matemáticas Oficiais)
A partir do plano cartesiano do gramado ($X \in [0, 105]\text{ m}$; $Y \in [0, 68]\text{ m}$), computam-se as variáveis táticas individuais por frame e normalizadas:

*   **Índice de Exploração Espacial ($IEE$):**
    Mede a distância euclidiana média entre a posição instantânea do atleta $(P_{xi}, P_{yi})$ a cada momento e sua posição média global $(\mu_x, \mu_y)$ na partida:
    $$IEE_i = \sqrt{(P_{xi} - \mu_x)^2 + (P_{yi} - \mu_y)^2} \qquad IEE = \frac{1}{K}\sum_{i=1}^{K} IEE_i$$
    *Interpretação:* Jogadores com alto $IEE$ cobrem amplas faixas de campo (ex: volantes *box-to-box*, pontas com flutuação interna livre). Jogadores com baixo $IEE$ têm atuação estática e estrita de setor (ex: zagueiro central, volante 5 de contenção).
*   **Tempo no Campo de Ataque ($TCA$) e de Defesa ($TCD$):**
    Para origem defensiva no marco zero ($P_0 = 0\text{ m}$):
    $$TCA = \frac{\sum (P_{xi} > 52,5)}{N_{\text{total}}} \times 100\% \qquad TCD = \frac{\sum (P_{xi} \le 52,5)}{N_{\text{total}}} \times 100\%$$
    *Insight de Contexto:* Zagueiros com $TCA > 40\%$ indicam domínio territorial esmagador da equipe sobre o adversário, exigindo alta velocidade na corrida de recuperação para cobrir campo aberto.
*   **Tempo no Último Terço Ofensivo ($TUO$) e Defensivo ($TUD$):**
    $$TUO = \frac{\sum (P_{xi} > 70,0)}{N_{\text{total}}} \times 100\% \qquad TUD = \frac{\sum (P_{xi} < 35,0)}{N_{\text{total}}} \times 100\%$$
    *Insight de Contexto:* A presença consistente de meio-campistas (camisas 8 e 10) no $TUO$ ($> 20\%$) correlaciona-se diretamente com volume de finalizações e assistências geradas dentro da área.
*   **Distância Média Entre Jogadores Específicos ($Dist_{AB}$):**
    $$Dist_{AB} = \frac{1}{K}\sum_{i=1}^{K} \sqrt{(A_{xi} - B_{xi})^2 + (A_{yi} - B_{yi})^2}$$
    *Aplicação:* Mede a aderência ao plano estratégico entre pares obrigatórios de sinergia (ex: dupla de zagueiros centrais). Se a distância média entre a dupla de zaga ultrapassar valores seguros de cobertura, há risco iminente de infiltração vertical rival.
*   **Assimetria de Corredores (Lados do Campo):**
    Corte no eixo $Y$ pela linha média de $34,0\text{ m}$ ($Y < 34$ = lado esquerdo; $Y > 34$ = lado direito). Revela sobrecargas intencionais e assimetrias de progressão.
### 2. A Arte da Interpretação de Contexto
O dado puro não responde perguntas; ele levanta hipóteses.
*   *Caso Prático:* Um time sub-14 passou 60% do tempo no campo de ataque (domínio territorial). Porém, o centroide de sua defesa passou um tempo absurdo preso no último terço defensivo. 
*   *Interpretação:* O time não estava sofrendo contra-ataques velozes em transição (o que espalharia o time), mas sim sendo bombardeado por **bolas paradas (faltas laterais e escanteios)**, que forçam todo o bloco a afundar para dentro da própria área.

### 3. O Estilo de Jogo através da Razão Profundidade/Largura
*   **Razão < 1 (< 100%):** Indica um time com maior largura e menor profundidade. É a assinatura de um **Estilo Apoiado** (construção paciente, passes curtos).
*   **Razão > 1 (> 100%):** Indica um time mais esticado em comprimento e estreito em largura, focado em transições rápidas e jogo direto.

---

## 🗣️ Diretrizes de Comunicação com a Comissão Técnica

1. **Fuja das Métricas Confusas:** Treinadores não compreendem frações decimais de tempo (ex: $19,22\text{ minutos}$ não são 19 minutos e 22 segundos). Sempre converta as proporções espaciais para **Percentuais (%)**. Dizer "seu ponta passou 84% do tempo na esquerda" é claro e direto.
2. **Visualização Simples:** Apele para mapas de calor e retângulos de ocupação (padrão FIFA) em vez de entregar planilhas com números frios.
3. **Comunicação Verbal:** Relatórios em PDF de 30 páginas raramente são lidos. Estabeleça uma rotina de reuniões rápidas e verbais com o treinador para debater os *insights* gerados pelos dados.
4. **A Máxima de Johan Cruyff:** *"Jogar futebol é muito simples, mas jogar futebol simples é a coisa mais difícil que há."* O mesmo vale para os dados: obter dados é fácil; transformá-los em informações simples e acionáveis é o verdadeiro desafio do Cientista de Dados.

---

## 🛠 Stack Tecnológico e Ferramentas

*   **Limpeza de Dados Brutos (Excel / LibreOffice):** 
    *   O ruído de GPS (jogadores no vestiário, aparelhos descarregando) deve ser excluído pelo tempo limite da partida. 
    *   Células marcadas como `NA` (dados perdidos de satélite) devem ser substituídas por espaços em branco (`Find/Replace`) para não quebrarem as fórmulas de cálculo.
    *   *Dica Técnica:* Em caso de erros de leitura de CSV, sempre verifique se o separador decimal do sistema é vírgula (padrão PT-BR) ou ponto (padrão US).
*   **Fórmulas Condicionais (`CONT.SES`):** Permite cruzar múltiplos critérios espaciais. Exemplo: Contar quantas vezes a coordenada $X$ foi menor que $52,5$ **E** a coordenada $Y$ foi maior que $54,4$ para descobrir o tempo exato gasto no *Meio-Espaço Direito Ofensivo*.

---

## 📚 O Guia de Carreira do Analista de Elite
Para não ser um "Zé Ninguém" na área de dados, o profissional moderno precisa evoluir no tripé:
1.  **Matemática além do básico:** Entender estatística e cálculos espaciais (como a Distância Euclidiana).
2.  **Futebol além do básico:** Entender os idiomas táticos que diferentes treinadores falam. O analista precisa saber de futebol para não apresentar dados que não fazem sentido prático.
3.  **Contexto além do básico:** Adaptar a análise à realidade do clube, da categoria (ex: Sub-15 x Profissional) e do momento do jogo.

**Bibliografia Recomendada:**
*   *Data Analytics in Football* (Daniel Memmert) - Referência global em tracking data.
*   *Dados FC* (Victor Príncipe) - Referência nacional sobre a cultura de dados no Brasil.
*   *Fundamentos de Aprendizagem Tático-Técnica Individual no Futebol* (SECA/UFMG).

---
**Tags:** #analiseposicional #trackingdata #metricasespaciais #dashboard #comunicacao #excel #seca-ufmg #aula04-posicional
