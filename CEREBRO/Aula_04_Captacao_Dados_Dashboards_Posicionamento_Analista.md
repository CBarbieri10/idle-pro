# Aula 04: Captação de Dados, Dashboards de Baixo Custo e o Posicionamento do Analista

**Data:** Outubro de 2026  
**Professor:** Ricardo Pombo  
**Módulo:** Fundamentos da Análise de Desempenho no Futebol  

---

## 📌 Ideia Central e Resumo
A aula final do módulo de Fundamentos conecta a teoria à prática operacional do analista de desempenho. O professor destrincha a evolução do fluxo de trabalho: desde a captação bruta de vídeo até a automação via Inteligência Artificial (Visão Computacional). Além disso, ensina como criar *dashboards* táticos em tempo real com custo zero usando ferramentas do Google. Por fim, a aula aborda o maior desafio do mercado: o choque cultural entre a análise científica e o empirismo (ex-atletas), concluindo que o analista de elite não vende processos ou tecnologias, mas sim **soluções de problemas e resultados práticos**.

---

## 🧠 Conceitos Metodológicos Chave

### 1. O Fluxo Lógico da Análise
Qualquer processo de análise no futebol exige começo, meio e fim:
1. **Definição da Pergunta:** O que precisamos saber? (Ex: Por onde o adversário mais entra no nosso terço final?).
2. **Coleta e Registro:** Tagueamento manual ou automatizado da fonte (o vídeo do jogo/treino).
3. **Exame e Interpretação:** Cruzar o dado quantitativo com a análise qualitativa (contexto).
4. **Feedback (Devolutiva):** Entregar o insight processado ao decisor (treinador/diretor) para melhorar a tomada de decisão.

### 2. Empirismo vs. Ciência (A Sinergia)
*   **A Visão do Ex-Atleta:** Quem vivenciou o campo possui um *feeling* e uma percepção espacial/técnica (como a mecânica de um chute ou a fadiga de um sprint) que o acadêmico não tem.
*   **A Visão do Analista:** Possui método, estruturação lógica, visão do "todo" e capacidade de processar dados em larga escala.
*   **O Segredo:** Em vez de competir, o analista deve aliar-se à experiência empírica. Transformar a percepção de "vestiário" em indicadores de performance. (Ex: Ouvir a reclamação de uma jogadora sobre "perder muitas bolas em certa região" e mapear isso em vídeo para descobrir uma armadilha de pressão alta do adversário).

### 3. O Posicionamento de Mercado do Analista
*   Os clubes não contratam o analista pela câmera 4K que ele usa ou pelo software de ponta que ele domina. O futebol compra **resultado**.
*   Para se valorizar, o analista deve identificar uma "dor" da comissão técnica ou diretoria (ex: "estamos tomando muitos gols no fim do jogo") e entregar a solução empacotada através da inteligência dos dados.

---

## 🛠 Stack Tecnológico e Níveis de Captação

### Nível 1 ao Nível 3 de Captura de Vídeo
*   **Nível 1 (Básico):** Gravar na câmera -> Tirar o Cartão SD -> Passar pro PC. *Gargalo:* Muito lento, impede análises no intervalo ou envio de imagens ao banco de reservas em tempo real.
*   **Nível 2 (Intermediário):** Uso de **Placa de Captura** (converte a saída HDMI da câmera para entrada USB no notebook). O vídeo entra em tempo real no computador.
*   **Nível 3 (Avançado):** Placa de Captura + Software de Tagueamento (ex: *Live Tag Pro*). O analista "clica" em botões de atalho durante o jogo, criando uma linha do tempo automática com cortes exatos (ex: todas as finalizações já separadas em clipes de 10 segundos).

### Visão Computacional (A Fronteira Atual)
*   Softwares como o **ProSix** (com apoio Microsoft) eliminam o clique humano. A IA reconhece as linhas do campo, escaneia os jogadores, o árbitro e a bola, transformando o jogo em um mapa 2D e gerando as estatísticas (recuperação, pós-perda, escanteios) automaticamente através do rastreio de frames.

---

## ⚽ Aplicação Prática (Mão na Massa)

### Criação de Dashboard de Baixo Custo em Tempo Real
Como criar uma "Central de Comando" sem comprar softwares caros de mercado:

1. **Base de Dados (Input):** Criar um **Google Planilhas (Sheets)**. Dividir as colunas pelas métricas do modelo de jogo (ex: Entradas no Terço Final pelos 5 corredores: *Lateral Esq, Intermediário Esq, Central, Intermediário Dir, Lateral Dir*).
2. **O Tagueador:** Durante o jogo, um auxiliar alimenta esta planilha no celular/tablet somando as ações.
3. **Visualização (Output):** Usar o **Looker Studio (antigo Google Data Studio)**. 
   * Criar um Relatório em Branco e conectar ao Google Planilhas.
   * Inserir uma imagem de fundo (Campo de Futebol em PNG).
   * Adicionar "Visões de Dados" sobre os corredores e Filtros de Equipe.
4. **Integração Ao Vivo:** O Looker Studio permite incorporar URLs. É possível "embedar" o link da transmissão do YouTube (ou da sua câmera) na mesma tela dos dados quantitativos. O banco de reservas atualiza a página no iPad e recebe as estatísticas ao vivo vinculadas ao vídeo do jogo.

---
**Tags:** #fundamentos #captacao #LookerStudio #DataStudio #PlacaDeCaptura #Tagueamento #VisaoComputacional #LiveTagPro #ProSix #aula04
