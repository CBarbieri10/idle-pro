# Aula 02: Estruturação de Projetos, GitHub e Visão Computacional no Scout

**Data:** Outubro de 2026  
**Professores:** Leonardo Barbosa e Ricardo Pombo  
**Módulo:** MBA em Análise de Desempenho e Ciência de Dados no Futebol  

---

## 📌 Ideia Central e Resumo
A Aula 02 foca em desmistificar o medo de "quebrar" códigos ao introduzir boas práticas de estruturação (Versionamento e Ambientes Virtuais). O analista de desempenho assume o papel de Tech Lead / Code Reviewer, supervisionando a IA enquanto ela escreve o código. Além disso, a aula quebra o paradigma da escassez de dados em divisões inferiores: se comprar dados ou usar câmeras 8K é inviável, o analista pode usar modelos de Visão Computacional de IA para converter anotações em papel ou relatórios em PDF diretamente em bancos de dados estruturados e painéis táticos em minutos.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Versionamento de Código (O "Ctrl+Z" Seguro)
*   **GitHub / GitLab:** Sistemas de gerenciamento e versionamento.
*   **Commit:** Funciona como um "ponto de salvamento" (save state) do seu projeto. Quando você ou a IA cometem um erro que destrói o código, basta reverter para o último commit funcional. Isso tira o medo de testar e inovar.

### 2. Isolamento de Projetos (VENV)
*   **Ambiente Virtual (VENV):** No Python, cria-se uma "bolha" isolada para cada projeto. Isso garante que instalar uma biblioteca nova para o projeto do StatsBomb não quebre as versões das ferramentas que você usou no projeto do SofaScore.

### 3. Debugging (Correção de Erros) com IA
*   A IA erra e é "preguiçosa". Quando o servidor (Localhost) não carrega ou o terminal mostra um erro, a solução é copiar o erro do terminal (ou tirar um print da tela) e colar no chat da IDE.
*   **Exemplo da aula:** O Pandas gerou valores NaN (Not a Number) que quebraram a formatação JSON. A IA leu o log de erro e automaticamente injetou um filtro para limpar os dados antes de enviar ao Dashboard.

---

## 🛠️ Stack Tecnológico e Ferramentas

### Infraestrutura e IA
*   **Modelos de Visão Computacional:** Gemini e Claude (destaque para o Claude na precisão de respostas lógicas/código e visão). Usados para "ler" prints de tela ou fotos do mundo real.
*   **Open Code (IDEs):** Alternar entre modo Plan (para invocar o "Orquestra" e planejar a arquitetura) e Build (para autorizar a IA a escrever o código).

### Linguagens e Bibliotecas (Python)
*   Continuação do uso de **Pandas** e **FastAPI**.
*   **StatsBombPy:** Foco da aula prática. Conexão direta com o repositório Open Data da StatsBomb (que contém mais de 1200 jogos gratuitos, incluindo Copa do Mundo).
*   **MPL Soccer:** Usado para gerar os grids táticos avançados (Scatter plots de finalização, mapas de passes, etc.).

---

## ⚽ Aplicação Prática (Mão na Massa)

### Caso 1: Criação de Dashboard Dinâmico (StatsBomb)
*   **Leitura do README:** Em vez de programar do zero, pede-se para a IA ler o arquivo README.md do repositório da StatsBomb para aprender a sintaxe deles.
*   **Filtragem Básica:** Extração dos eventos apenas da Copa do Mundo de 2022 (Ex: Canadá x Marrocos).
*   **Forçando o Contexto (Dicionário de Dados):** A IA entregou um gráfico muito raso inicialmente. A solução foi forçar a IA a ler a documentação técnica (Dicionário de Dados) do StatsBomb para entender que ela tinha acesso a métricas como:
    *   xG (Expected Goals), Gols de Cabeça, Passes que geraram chutes, Altura da linha defensiva, etc.
*   **Refinamento de UI (Front-end):** Usar linguagem natural para ajustar alinhamentos, sombras, menus laterais e cabeçalhos com logos de times (trabalho que levaria semanas para um programador).

### Caso 2: O Scout de "Baixo Custo" (Democratização dos Dados)
Como analisar times menores (Série C, D, Base, Feminino) onde a Opta não fornece dados e não há R$ 10.000 para câmeras analíticas?
*   **PDFs Massivos:** Pegar PDFs abertos (como os da FIFA) e jogar na IA (Claude/DeepSeek) para que ela transforme tudo em uma planilha de Excel/CSV em segundos.
*   **O Método do "Guardanapo":** Desenhar um campinho em uma folha de papel e fazer a tagueação manual durante o jogo (X = erro, O = acerto, P = passe).
*   **Mágica da Visão Computacional:** Tirar uma foto do papel desenhado e enviar para o Claude/Gemini pedindo: *"Extraia esses eventos para um CSV e plote um mapa de calor com Python"*. A IA consegue ler os símbolos espaciais com até 90% de precisão e cruzar com os dados.

---
**Tags:** #ciencia-de-dados #python #github #statsbomb #visao-computacional #scout #aula02 #debug #VENV
