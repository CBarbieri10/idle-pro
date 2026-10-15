# Aula 04: Automação, Nuvem, Visão Computacional e Refinamento de Agentes

**Data:** Outubro de 2026  
**Professores:** Leonardo Barbosa e Marcelo Xavier  
**Módulo:** MBA em Análise de Desempenho e Ciência de Dados no Futebol  

---

## 📌 Ideia Central e Resumo
A aula final consolida o fluxo de trabalho de um cientista de dados no futebol, saindo do ambiente de testes (local) para o ambiente de produção (Nuvem/Automação). Abordou-se a resolução de problemas de infraestrutura de TI (instalação de dependências como Node.js), a segurança de credenciais com arquivos `.env` e o refinamento do comportamento da IA (System Prompts). Além disso, houve um aprofundamento tático sobre as limitações atuais do mercado: a necessidade de cruzar dados táticos com dados médicos/fisiológicos e os desafios da visão computacional para campeonatos sem cobertura de dados.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Automação e Infraestrutura (Deploy)
*   **Risco Local:** Rodar rotinas no próprio computador é arriscado (queda de energia, falta de internet). O ideal é migrar o projeto para uma nuvem (VPS).
*   **Schedulers (Agendadores):** Uso de rotinas (como o `Cron` no Linux ou bibliotecas Python) para rodar extrações automaticamente. Exemplo prático: Extrair dados de saúde (anéis de monitoramento ou GPS) às 10h da manhã todos os dias e enviar um relatório consolidado via Telegram para a diretoria.

### 2. Engenharia de Prompt para Relatórios (System Prompts)
*   Como dar personalidade ao bot: Criar um *System Prompt* robusto. Exemplo: *"Você é um assistente técnico e analista de elite. Responda baseado EXCLUSIVAMENTE nas estatísticas fornecidas. Use métricas como XG, XT, PPDA e acerto de passes."*
*   **Prompts Negativos e Formatação:** Instruir a IA sobre o que ela *não* deve fazer (evitar "preguiça" ou alucinações) e forçar a saída formatada em Markdown para criar relatórios automatizados de adversários pré/pós-jogo.

### 3. A Fronteira do Scout: Dados Médicos e Inteligência de Mercado
*   O grande gargalo atual não é a análise tática, mas a integração com a "caixa preta" da saúde (fisiologia e histórico médico).
*   **Noise Feed:** Plataforma emergente (nascida do Wyscout) focada em mineração de texto na web para rastrear histórico de lesões de atletas pelo mundo.
*   O bom analista deve cruzar fontes de dados externos (ex: IBGE para estatura média, dados demográficos) com os dados esportivos para validar teses (ex: estaturas de goleiros).

### 4. Visão Computacional vs. "Tagueamento" Manual
*   **Visão Computacional Automatizada:** Ferramentas e modelos abertos (como *Roboflow* da *Ultralytics*) podem ser treinados para extrair coordenadas (X, Y) de vídeos brutos. O desafio é a necessidade de câmeras calibradas e múltiplos ângulos para lidar com oclusão (jogadores passando na frente uns dos outros).
*   **Ferramentas Manuais:** Soluções como o **Python FC** permitem abrir vídeos do YouTube em uma interface e "taguear" (marcar) posições no campo manualmente, gerando um CSV próprio para análises em ligas menores (Série C, D, base).

---

## 🛠 Stack Tecnológico e Ferramentas

### Segurança e Ambiente
*   **Dotenv (`.env`):** NUNCA deixe chaves de API (ex: OpenRouter, OpenAI, SofaScore) fixadas no código fonte. Crie um arquivo oculto chamado `.env` na raiz do projeto (ex: `OPENROUTER_API_KEY="sua_chave_aqui"`) para proteger credenciais contra vazamentos em repositórios públicos.

### Resolução de Problemas no Antigravity/VS Code (NPM)
*   Se o `Open Code` acusar erro de "comando não reconhecido" no terminal:
    1. O computador não possui o **Node.js** instalado.
    2. Solução: Baixar e instalar o *Node.js* (versão LTS).
    3. Reiniciar o terminal e executar o comando de instalação global: `npm install -g open-code`.

### Nuvem e Servidores
*   **Contabo:** Provedora de VPS (Virtual Private Server) recomendada por ser de baixo custo (aprox. $7/mês) para manter os agentes de IA e scripts Python rodando 24 horas por dia, 7 dias por semana.
*   Alternativas de mercado: AWS, Google Cloud, Oracle.

---

## ⚽ A Realidade do Analista de Desempenho
Muitos clubes da Série A ainda dependem de analistas que apenas "leem" relatórios gerados automaticamente por plataformas pagas, sem realizar tratamento de dados cru. O profissional que dominar essas técnicas (IA + Python + ETL) será capaz de institucionalizar os processos, criar "cabines de comando" (dashboards interativos sob medida) para a comissão técnica e elevar radicalmente o patamar de inteligência do clube.

---
**Tags:** #ciencia-de-dados #automacao #VPS #NodeJS #SystemPrompt #VisaoComputacional #Roboflow #NoiseFeed #aula04
