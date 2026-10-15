# Aula 03: Infraestrutura, Versionamento e Introdução ao RAG no Futebol

**Data:** Outubro de 2026  
**Professor:** Leonardo Barbosa e Marcelo Xavier (Participação Especial)  
**Módulo:** MBA em Análise de Desempenho e Ciência de Dados no Futebol  

---

## 📌 Ideia Central e Resumo
A terceira aula foca em superar as barreiras de infraestrutura de desenvolvimento (como clonar repositórios e lidar com limites de tokens) e no refinamento prático do fluxo com a IA. O professor demonstrou os perigos da "preguiça" da Inteligência Artificial (que tenta forjar dados para poupar esforço) e introduziu conceitos avançados para o futuro do scout: a técnica de **RAG (Retrieval-Augmented Generation)** e a criação de agentes especialistas para cruzar dados táticos com dados médicos/físicos privados dos clubes.

---

## 🧠 Conceitos Metodológicos Chave

### 1. O Comportamento da IA e a "Preguiça" Cognitiva
*   **Alucinação por Atalho:** A IA imita o cérebro humano e busca atalhos. Ao criar um dashboard, ela pode repetir o mesmo gráfico ou estatística para todos os jogadores só para "entregar" a tarefa rápido.
*   **O Analista como QA (Quality Assurance):** O trabalho do analista não é só pedir, mas auditar. Se a IA colocar dados falsos (ex: bandeiras erradas ou números repetidos), o analista deve intervir com prompts corretivos e fornecer fontes exatas (ex: "Pegue as imagens reais das bandeiras nesta URL da Wikipedia").

### 2. Versionamento de Código (Git Flow Básico)
*   A ausência do "Ctrl+Z" na programação assistida exige o uso do Git.
*   **Commit e Push:** Sempre que a IA acertar um bloco de código (ex: o painel funcionou perfeitamente), deve-se pedir a ela para fazer um `commit`. Isso cria um "ponto de salvamento" seguro. Se o próximo comando quebrar o site, basta reverter para o commit anterior.

### 3. RAG (Retrieval-Augmented Generation) em Dados Esportivos
*   **O Gargalo da Saúde/Performance:** Dados de lesões e GPS são caixas-pretas blindadas pelos clubes. As IAs públicas não têm esse conhecimento.
*   **A Solução (RAG):** É a técnica de conectar um motor de IA (LLM) a uma base de dados local e privada do clube (arquivos médicos, planilhas de carga física). 
*   A IA para de buscar respostas genéricas na internet e passa a cruzar os dados internos, respondendo perguntas como: *"Baseado no nosso histórico do Cuiabá, qual jogador tem risco de estourar a musculatura no próximo jogo dado o volume de sprints (GPS) da última partida?"*

### 4. Criação de Agentes Especialistas (Skill Creator)
*   Uso de meta-agentes (como a skill `Skill Creator` no Antigravity) para desenhar agentes focados em áreas específicas. Pode-se criar um "Agente Fisiologista" ou um "Agente Analista de Mercado" que possua prompts de sistema refinados para avaliar as métricas sob uma ótica especializada.

---

## 🛠️️ Stack Tecnológico e Ferramentas

### Infraestrutura de IDE e Git
*   **Antigravity IDE:** É crucial baixar a versão `IDE` e não apenas o aplicativo base.
*   **Clonagem de Projetos:** Para iniciar um projeto do GitHub, há 3 caminhos:
    1. Fazer o *Fork* e rodar `git clone [URL]` no terminal.
    2. Usar o botão nativo "Clone Repository" da IDE.
    3. Baixar o arquivo `.zip` no GitHub, descompactar na máquina e usar `File > Open Folder` na IDE.

### Contornando Limites de Tokens
*   Quando o LLM principal (Gemini/Claude) atinge o limite da franquia na IDE, o desenvolvimento trava no status *Working*.
*   **Solução (Open Code):** Instalar a extensão `Open Code` (antigo Toolkit). Ela permite usar a chave da API do `OpenRouter`, acessando LLMs gratuitos (como o *DeepSeek* ou *Qwen*) para continuar programando sem custos enquanto os tokens principais recarregam.

### Deep Research (Pesquisa Profunda)
*   Recurso do Gemini/LLMs avançados para minerar a web em busca de plataformas de dados desconhecidas (ex: caçar sites obscuros que centralizam históricos médicos no esporte ou bases do IBGE para correlações de nascimento/estatura).

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Setup de Sessão e Workflow de Tela
*   Sempre iniciar uma nova sessão invocando o guia mestre: *"Siga as diretrizes do Orquestra [Caminho do arquivo] e leia o README [Caminho do arquivo]"*.
*   **Visualização em Tempo Real:** Trabalhar com a IDE de um lado e o navegador (`localhost`) do outro. Após atualizar um comando de Front-end (CSS/HTML), usar `Ctrl+R` no navegador para dar refresh e validar o design instantaneamente.

### 2. Dashboards de Alto Nível (StatsBomb)
*   Construção de painéis dinâmicos da Copa do Mundo (2022) usando dados JSON.
*   Criação de *Sidebars* (menus laterais) com chaveamento de fases de grupos.
*   Visualizações criadas via `MPL Soccer`: Mapas de chutes de jogadores específicos (ex: Mbappé vs Messi), gráficos de teia (radar) e redes de passe, todos gerados e filtrados via `Pandas` nos bastidores.

---
**Tags:** #ciencia-de-dados #git #github #RAG #antigravity-ide #prompt-engineering #aula03 #OpenCode #DeepSeek
