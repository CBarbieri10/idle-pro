# Aula 01: Fundamentos de Ciência de Dados e Programação Aplicados ao Futebol

**Data:** Outubro de 2026  
**Professor:** Leonardo Barbosa  
**Módulo:** MBA em Análise de Desempenho e Ciência de Dados no Futebol  

---

## 📌 Ideia Central e Resumo
A aula introdutória marca a transição da análise de desempenho tradicional para a **Cultura AI First**. O foco é utilizar a **"Programação Assistida"** com Inteligência Artificial, guiada por metodologias rigorosas de documentação (como o documento "Orquestra" / SDD). Isso permite que a IA atue como uma orquestradora para automatizar a extração (Web Scraping), tratamento (ETL) e visualização de dados táticos e estatísticos de plataformas como SofaScore e StatsBomb, capacitando analistas de futebol a construírem painéis complexos e bancos de dados robustos com alta precisão, baixo custo e sem vazamento de segurança.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Cultura AI First vs. "Vibe Coding"
*   **Vibe Coding:** Jogar prompts soltos para a IA sem contexto estruturado. Gera vulnerabilidades de segurança (chaves de API expostas no código), consumo excessivo de tokens e "alucinações" nas respostas.
*   **Programação Assistida (AI First):** A IA age de forma orquestrada, guiada por parâmetros restritos e contratos técnicos definidos pelo programador, agindo como um "parceiro" de revisão de código (Code Review).

### 2. Metodologia SDD (Spec Driven Development) e o "Orquestra"
O **Orquestra** atua como um "harness" (arreio/guia) que disciplina a IA com regras inegociáveis:
*   **Nenhuma linha de código sem especificação:** A IA deve planejar a arquitetura antes de executar.
*   **Assertividade Socrática:** A IA é obrigada a fazer perguntas estratégicas para validar o objetivo e a arquitetura *antes* de gastar tokens.
*   **TDD (Test Driven Development):** A IA cria testes para validar seu próprio código antes da entrega final.
*   **Orquestração de Agentes:** Múltiplos agentes de IA trabalham em paralelo (ex: um no front-end, um no back-end, um na segurança) e depois unem (merge) o código.

### 3. Teoria de Grafos (Graphify) e Contexto
A IA utiliza a estrutura de grafos (similar ao funcionamento do Obsidian) para dar "pesos" às informações que se cruzam. Isso cria um "segundo cérebro" para a própria IA, permitindo que ela traga respostas altamente relevantes com base no histórico do projeto, reduzindo o consumo de tokens.

### 4. O Fluxo de Análise de Dados (ETL)
1.  **Extração:** Coletar dados brutos (Scraping ou via APIs).
2.  **Transformação (Tratamento):** Limpar dados com `Pandas` (padronizar texto/número, normalizar nomes de jogadores, tratar valores nulos).
3.  **Carga e Visualização:** Plotar as ações no campo para gerar insights táticos.

---

## 🛠️ Stack Tecnológico e Ferramentas

### Infraestrutura e IA
*   **IDEs de IA:** *Antigravity IDE*, *VS Code* e *Open Code*.
*   **OpenRouter:** Plataforma para acessar motores de LLMs gratuitos/baratos (Qwen, DeepSeek) via API, útil quando os tokens da IDE principal acabam.
*   **Hospedagem e Banco de Dados:** Sugestões para ambientes em nuvem incluem **Supabase** (banco de dados gratuito/BaaS) ou **Contabo** (VPS barata de $7/mês rodando 24/7).

### Linguagens e Bibliotecas Python
*   **FastAPI:** Para criação do Back-end.
*   **Playwright:** Ferramenta que simula a abertura do navegador para raspar dados (Web Scraping).
*   **Pandas & NumPy:** Manipulação, limpeza e operações matemáticas em DataFrames.
*   **Matplotlib & MPL Soccer:** Plotagem de relatórios, gráficos de radar, mapas de calor, redes de passes, chutes e conduções diretamente sobre a representação de um campo de futebol virtual.
*   **StatsBombPy:** API para extrair dados abertos oficiais da StatsBomb.

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Extração Manual via F12 (SofaScore)
O SofaScore protege seus dados, mas expõe arquivos via chamadas de rede no navegador.
*   **Passo a passo:** F12 (DevTools) -> Aba *Network* -> Atualizar a página -> Filtrar/Procurar respostas JSON (ex: `lineups`, `rating_breakdown`, `shotmap`, `heat_map`).
*   O endpoint `rating_breakdown` costuma conter os detalhes vitais por jogador (passes, desarmes, dribles). As coordenadas espaciais (X e Y) são fundamentais para os gráficos.

### 2. Filtragem de Zonas no StatsBomb (Avanços no Terço Final)
Para saber quem conduz ou passa mais a bola no ataque, filtra-se o banco de dados pelas coordenadas do campo (X, Y).
*   Exemplo de filtro de passe progressivo: `coordenada X > 80`.
*   Combina-se a filtragem de "Passes" com "Carry" (condução), agrupando pelo ID/Nome do jogador para saber quem rompe mais as linhas adversárias.

---
**Tags:** #ciencia-de-dados #scout #python #inteligencia-artificial #MPLSoccer #aula
