# Aula 02: Análise Posicional e Rastreamento de Dados (Tracking)

**Data:** Outubro de 2026  
**Professor:** Gibson Moreira Praça (SECA / UFMG)  
**Módulo:** Análise de Desempenho e Ciência de Dados no Futebol  

---

## 📌 Ideia Central e Resumo
A segunda aula introduz a evolução da análise de desempenho, saindo da era de observações subjetivas baseadas em vídeos (Fases 1 e 2) para a era dos **Dados de Posição (*Tracking Data*)** de alta frequência (Fase 4). O professor demonstra que o futebol moderno exige entender como as equipes ocupam os espaços no campo ao longo do tempo. O grande foco técnico da aula é ensinar como converter dados brutos de GPS (Latitude e Longitude em graus) para Coordenadas Cartesianas (X e Y em metros), usando a linguagem R, para gerar análises espaciais acionáveis para o treinador.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Evolução da Análise de Desempenho (As 4 Fases Históricas)
*   **Fase 1 e 2:** Ação humana em todas as etapas. Foco em contagem manual de frequências (Fase 1) e interpretações subjetivas e enviesadas (Fase 2).  
    *O Erro de Charles Reep:* Acreditava-se que "ataques com menos de 4 passes resultam em mais gols", o que institucionalizou o *Kick and Rush* (jogo de chutão direto) na Inglaterra. A falha: sequências curtas são infinitamente mais frequentes no jogo e a recuperação próxima à área adversária é a real causa do gol. **Conclusão: Analisar é muito mais do que obter dados; exige discernir causalidade de correlação.**
*   **Fase 3:** Integração de sistemas computacionais rudimentares (digitalização frame a frame). Elevada participação humana, alto tempo e custo, amostras pequenas.
*   **Fase 4 (Moderna):** Obtenção autônoma de dados posicionais de alta frequência ($10\text{ a }25\text{ Hz}$). Foco na **contextualização dinâmica**.  
    *O Axioma de Gibson Praça:* *"Existe um jogo na fase ofensiva e outro na fase defensiva. Em nenhum deles a dinâmica se parece com a dinâmica média."* Ambiente propício para aplicação de **Inteligência Artificial e Machine Learning**.

### 2. Comparativo Tecnológico: Optical Tracking vs. GPS/GNSS

| Critério | Optical Tracking Systems / LPS | GPS / GNSS Tracking Systems |
| :--- | :--- | :--- |
| **Tecnologia** | Câmeras fixas de alta resolução / Posicionamento Local | Dispositivos vestíveis acoplados ao colete (Satélites) |
| **Custo** | Elevado (infraestrutura física dedicada) | Baixo a moderado |
| **Flexibilidade** | Instalação fixa, calibração lenta de estádio | Alta flexibilidade de setup em treinos e partidas fora |
| **Processamento** | Automático ou semi-automático | Tempo dispendido no descarregamento de dados |
| **Confiabilidade** | **Padrão Ouro (25 Hz)**, sem interferência de local | 10 a 25 Hz (sujeito a interferência de satélite/estádio coberto) |

### 3. Confiabilidade Científica dos Dados de Posição
Estudos científicos rigorosos conduzidos pelo CECA/UFMG (Praça et al., 2022; Hennessy & Jeffreys, 2018; Pons et al., 2019) comprovaram que a **análise posicional por tracking foi o único método que superou todos os instrumentos observacionais manuais**, apresentando **excelente confiabilidade intra-sessão e entre sessões** (estabilidade temporal e reprodutibilidade estatística).

### 4. Entendendo Coordenadas Espaciais no Futebol (X, Y)
Para simplificar a leitura geométrica do campo, a matemática assume o gramado como um plano cartesiano 2D plano (ignorando a curvatura da Terra e o eixo Z/Altitude).
*   **Eixo X:** Mede a **Profundidade** do campo (Ex: de 0 a 105 metros). É a métrica usada para calcular a distância entre os setores (compactação vertical) ou quão avançado um time defende.
*   **Eixo Y:** Mede a **Largura/Amplitude** do campo (Ex: de 0 a 68 metros). É a métrica usada para medir a distância entre o lateral esquerdo e o direito (compactação horizontal).

---

## 🛠 Stack Tecnológico e Ferramentas

*   **R e RStudio:** A linguagem de programação *open-source* padrão para estatística inferencial (mais usada que o Python na academia por pacotes já prontos). Nesta aula, usado estritamente para conversão e limpeza massiva de dados.
*   **Google Maps (Solução Prática):** Como os dados de GPS baseados em satélites retornam posições globais usando o Meridiano de Greenwich e a Linha do Equador como zeros, eles não fazem sentido em metros num campo. O professor ensina a extrair as coordenadas reais de Latitude/Longitude (clicando com o botão direito nas quinas do campo no Google Maps) para informar ao software qual é o limite exato ("referencial local") do campo onde a partida ocorreu.

---

## ⚽ Aplicação Prática (Mão na Massa)

### Como Converter Dados Brutos de GPS em Coordenadas X/Y em Metros
A rotina programada em R substitui horas de trabalho braçal em 30 segundos. O analista só precisa alterar 3 blocos de código na rotina `Conversão_Dados_Posicionais.R`:

1.  **Ajustar os Diretórios de Leitura e Gravação:** (Linhas 12-13) Modificar os caminhos no código para apontar para a pasta onde os CSVs dos jogadores estão salvos e para onde o arquivo final consolidado deve ir. Lembrete: Inverter as barras de diretório (`\` para `/`) ao copiar do Windows Explorer.
2.  **Calibrar o Referencial do Campo (Quinas):** (Linhas 46-51) Inserir a Latitude/Longitude exatas de 3 escanteios do campo (obtidas via Google Maps), sempre no sentido horário para garantir o eixo geométrico (o 4º escanteio o script calcula sozinho por se tratar de um retângulo).
3.  **Ajustar as Dimensões do Gramado:** (Linhas 64-65) Inserir a dimensão real do campo medido. (Ex: em vez do padrão FIFA 105x68, o campo analisado possuía 105x70).

*Ao rodar o Script, o software une os arquivos de todos os 22 jogadores e os transforma em um único arquivo limpo contendo as posições exatas em metros dentro do campo.*

---

## 📝 Próximos Passos (Dever de Casa)

1. **Instalar R e RStudio.**
2. **Rodar a Rotina de Conversão:** Acessar a pasta com os dados brutos de GPS (`Dados brutos CSV jogo 1`). Abrir o arquivo R de conversão, ajustar os três blocos (diretório, coordenadas via Google Maps e tamanho do campo) e executar o código.
3. **Resultado Esperado:** Gerar, na pasta destino, os arquivos limpos `coordenadas primeiro tempo` e `coordenadas segundo tempo`, em que todas as posições estarão em eixos de metros positivos ($X, Y$), prontos para o cálculo das variáveis táticas (Compactação, Distância entre Setores) na próxima aula.

---
**Tags:** #analiseposicional #tracking #gps #Rstudio #coordenadas #heatmap #fasesdojogo #aula02-posicional
