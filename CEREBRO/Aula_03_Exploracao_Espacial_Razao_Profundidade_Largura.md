# Aula 03: Exploração Espacial, Razão Profundidade/Largura e Distância entre Setores

**Data:** Outubro de 2026  
**Professor:** Gibson Moreira Praça (SECA / UFMG)  
**Módulo:** Análise de Desempenho e Ciência de Dados no Futebol  

---

## 📌 Ideia Central e Resumo
A terceira aula foca em métricas avançadas de *Tracking Data* (Dados de Posição). O professor introduz indicadores que detalham não apenas *onde* o time está, mas *como* ele ocupa o espaço e se relaciona com as próprias linhas. A aula explora a diferença entre dominar o campo de ataque territorialmente e dominar o último terço (onde há perigo real de gol). O grande salto qualitativo desta aula é a transição da análise estática do jogo todo para a **análise fracionada por fases do jogo** (separando Organização Ofensiva da Organização Defensiva).

---

## 🧠 Conceitos Metodológicos Chave

### 1. Dicionário Matemático de Variáveis Coletivas Oficiais

*   **Profundidade Coletiva ($Team\ Length$):**
    $$Prof = |A_x - B_x|$$
    Onde $A_x$ é a coordenada $X$ do atleta mais adiantado (mais perto do gol rival) e $B_x$ a do atleta mais recuado. Aumenta em marcação em bloco alto e em jogo direto.
*   **Largura Coletiva ($Team\ Width$):**
    $$Larg = |A_y - B_y|$$
    Distância entre o atleta mais aberto à esquerda e o mais aberto à direita. Aumenta em ataques posicionais de amplitude máxima e defesas baixas.
*   **Altura da Última Linha ($ALT_{linha}$):**
    $$ALT_{linha} = |P_x - P_0|$$
    Distância do último defensor ao próprio gol ($P_0$). Para marcar alto, $ALT_{linha}$ precisa ser elevada; caso contrário, a equipe descompacta.
*   **Altura do Centroide ($ALT_{cent}$):**
    $$ALT_{cent} = |\mu_x - P_0|$$
    Distância da posição média de todos os jogadores até a linha do próprio gol. A métrica quantitativa primária de **Domínio Territorial**.
*   **Razão Profundidade/Largura ($LPW_{ratio}$):**
    $$LPW_{ratio} = \frac{Prof_{méd}}{Larg_{méd}}$$
    $> 1.0 \rightarrow$ Jogo Direto / Verticalidade; $< 1.0 \rightarrow$ Jogo Apoiado / Circulação Posicional.
*   **Índice de Alongamento ($Stretching\ Index$ - $IA$):**
    $$D_i = \sqrt{(J_{ix} - C_x)^2 + (J_{iy} - C_y)^2} \qquad IA = \frac{1}{N}\sum_{i=1}^{N} D_i$$
    A medida matemática pura de **COMPACTAÇÃO COLETIVA**. Quanto menor o $IA$, mais compacta a equipe.
*   **Distância Entre Setores ($DS$):**
    $$DS_{\text{Def-Mei}} = \sqrt{(\mu_{x\text{Def}} - \mu_{x\text{Mei}})^2 + (\mu_{y\text{Def}} - \mu_{y\text{Mei}})^2}$$
    Localiza o "buraco" exato entre as linhas da equipe.
*   **Relação Ataque / Último Terço ($ATA\text{-}UTO$) e Defesa / Último Terço ($DEF\text{-}UTD$):**
    $$ATA\text{-}UTO = \frac{T_{uto}}{T_{ata}} \qquad DEF\text{-}UTD = \frac{T_{utd}}{T_{def}}$$
    $ATA\text{-}UTO \approx 1 \rightarrow$ Domínio territorial no terço final. $DEF\text{-}UTD \approx 1 \rightarrow$ Perigo extremo; equipe empurrada para a própria área sofrendo bombardeio.
*   **Coordenação Interpessoal In-Phase e Anti-Phase (Vector Coding):**
    Mede a sincronia de deslocamentos angulares. Padrão *In-Phase* alto na linha defensiva é imperativo para linha de impedimento e basculação sincronizada.

### 2. Evidências Científicas: Modelagem com Machine Learning (SHAP & Redes Neurais)
Dr. Gibson Moreira Praça testou modelos preditivos com SHAP values para desvendar os fatores reais de vitória:
*   **O que mais prediz Vitória:** Passes certos, passes longos certos, finalizações, pressão imediata pós-perda, altura alta da equipe na construção ($ALT_{cent}$) e avanço progressivo no campo.
*   **O que prediz Derrota:** Transição defensiva desorganizada e **largura excessiva no último terço** (equipes vencedoras afunilam no momento de definir).
*   **Clubes vs. Seleções:** Clubes vencem por gestão de posse e quebra de linhas entrelinhas; seleções vencem por intensidade de pressão física e velocidade de transição.
*   **Fadiga no 2º Tempo:** A exploração espacial ($IEE$) sofre declínio estatístico, tornando as ações mais previsíveis mesmo mantendo o desenho tático coletivo.

---

## 🛠 Stack Tecnológico e Ferramentas

*   **Separação por Fases de Jogo (Excel):** O professor demonstra que a média estatística do jogo completo é uma "mentira". (A média de um time que ataca num 4-2-4 e defende num 4-5-1 vira um 4-3-3 inexistente no papel).
    *   *Como fazer:* O *scout* (usando SportsCode, por exemplo) gera um XML com a linha do tempo das fases. O cientista de dados une esse XML ao CSV do GPS e filtra os dados.
    *   *Função de Limpeza:* O Excel não ignora dados "filtrados/ocultos" nas fórmulas normais. A única forma segura de calcular a média da fase defensiva é **DELETAR** as outras fases em uma aba secundária ou utilizar funções rigorosas como `MÉDIASES` cruzando com a coluna da fase ("Organização Ofensiva", etc.).

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Calculando a Distância entre Setores (No Excel)
1. **Identificação:** Na aba da escalação, determine quem é da linha de Defesa, Meio e Ataque.
2. **Posição Média Setorial:** Calcule a Média das coordenadas em `X` dos zagueiros/laterais (ex: `=MÉDIA(Zagueiro1_X; Zagueiro2_X; Lateral_X)`). Repita para Meio e Ataque.
3. **Cálculo da Distância:** Subtraia o setor inferior do superior (Ex: `=MÉDIA_DEFESA_X - MÉDIA_MEIO_X`). Aplique o quadrado e a raiz quadrada (`RAIZ((VALOR)^2)`) para garantir que o resultado seja sempre um número positivo (módulo).

### 2. Desafio Prático para a Próxima Aula
Utilizando o Banco de Dados 02 (que já contém a aba limpa separando Organização Ofensiva e Defensiva):
*   **Desafio 1:** O treinador quer saber como foi o **Domínio Territorial**. O aluno deve extrair métricas de Tempo no Campo de Ataque, Último Terço e Lados, identificando se a posse foi estática ou dinâmica.
*   **Desafio 2:** O treinador quer saber a **Compactação** da equipe. O aluno deve calcular o Índice de Alongamento (Stretching Index) cruzado com a Distância Entre Setores, comparando como o time se comportou na Organização Ofensiva vs. Defensiva.

---
**Tags:** #analiseposicional #trackingdata #exploracaoespacial #distancia-entre-setores #compactacao #coordenacao-em-fase #aula03-posicional
