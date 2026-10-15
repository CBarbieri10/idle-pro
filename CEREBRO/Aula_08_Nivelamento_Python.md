# Aula 8: Curso de Nivelamento Python

**Data:** Outubro de 2026  
**Professor:** Leonardo Barbosa  
**Módulo:** Nivelamento em Python  

---

## 📌 Ideia Central e Resumo
A oitava aula introduz dois dos conceitos mais poderosos para quem deseja trabalhar com Ciência de Dados no futebol: a importação de **Bibliotecas/Módulos** (códigos prontos para realizar tarefas complexas) e a manipulação de arquivos **CSV** (planilhas). O professor demonstra como sair do ambiente puramente isolado do código e começar a ler e gravar bancos de dados reais, preparando o terreno para análises em larga escala. A estrela da aula é a introdução à biblioteca **Pandas**, a ferramenta definitiva para manipulação de dados em Python.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Módulos e Bibliotecas (`import`)
*   **O que são:** Arquivos contendo funções já programadas por outros desenvolvedores (ou pelo próprio Python). Eles evitam que você precise "reinventar a roda" escrevendo códigos complexos do zero.
*   **Sintaxe de Importação:** Usa-se o comando `import nome_da_biblioteca`.
*   **Apelidos (`as`):** Para evitar digitar nomes longos repetidamente, usamos a palavra `as` para dar um "apelido" à biblioteca.
    *   *Exemplo Clássico:* `import pandas as pd`. A partir disso, usamos apenas `pd` no código.
*   **A Importância da Documentação:** O professor enfatiza que nenhum programador decora tudo. O segredo é saber ler a documentação oficial da biblioteca na internet para entender como usar suas funções.

### 2. Bibliotecas Nativas Apresentadas
*   **`math`**: Para operações matemáticas avançadas.
    *   *Exemplo:* `math.sqrt(81)` calcula a raiz quadrada de 81.
*   **`random`**: Para gerar números ou escolhas pseudo-aleatórias (muito útil para simular placares ou sortear times em um chaveamento).
    *   *Exemplo:* `random.randint(0, 4)` gera um placar aleatório entre 0 e 4.
    *   *Exemplo:* `random.choice(lista_times)` escolhe um time aleatório de uma lista.

### 3. Arquivos CSV (*Comma Separated Values*)
*   O formato padrão da indústria de dados esportivos (como Opta e Wyscout) para exportar informações brutas. É basicamente uma planilha de Excel onde os dados são separados por vírgulas.
*   **Abertura e Leitura Tradicional (Biblioteca `csv`):**
    *   Usa a estrutura `with open('arquivo.csv', mode='r') as arquivo:`.
    *   O modo `'r'` significa *read* (leitura) e `'w'` significa *write* (escrita).
    *   *Problema:* A leitura nativa traz os dados como listas simples de texto, o que é visualmente confuso e difícil de manipular estatisticamente.

### 4. A Revolução do `Pandas`
*   A biblioteca padrão ouro para ciência de dados em Python.
*   **DataFrame (`df`):** O Pandas transforma o arquivo CSV confuso em uma tabela linda e estruturada (como no Excel), chamada de *DataFrame*.
*   *Leitura Profissional:* `df = pd.read_csv('arquivo.csv')`
*   *Exibição:* O comando `display(df)` renderiza a tabela formatada diretamente no Jupyter Notebook/VS Code, facilitando muito a análise visual dos dados (ex: achar os gols do Haaland em uma tabela de 581 linhas).

---

## 🛠️ Stack Tecnológico e Ferramentas

*   **Bibliotecas Nativas:** `math`, `random`, `csv`.
*   **Bibliotecas de Terceiros:** `pandas` (requer instalação prévia via `pip`, embora geralmente já venha no Google Colab/Anaconda).
*   **MPL Soccer:** O professor dá um "spoiler" visual de uma biblioteca avançada (`mplsoccer` baseada em `matplotlib`) usada especificamente para plotar campos de futebol, mapas de calor e redes de passes (embora não a ensine a codificar nesta aula de nivelamento).

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Sorteio de Confrontos (Usando `random`)
Como simular resultados de jogos.

**Exemplo Prático (Código):**
```python
import random as rd

times = ['Flamengo', 'Palmeiras', 'Atlético-MG', 'Botafogo']
time_sorteado = rd.choice(times)

gols_simulados = rd.randint(0, 3)

print(f'O {time_sorteado} marcou {gols_simulados} gols nesta simulação.')
```

### 2. Lendo Dados Reais Profissionalmente (Usando pandas)
Como transformar um arquivo CSV de scout em uma tabela de análise.

**Exemplo Prático (Código):**
```python
import pandas as pd

# Lê o arquivo CSV (o arquivo precisa estar na mesma pasta do código)
# Nota: Para rodar este código, você deve ter um arquivo 'dados_jogadores.csv' salvo.
df = pd.read_csv('dados_jogadores.csv')

# Exibe as primeiras linhas da tabela de forma estruturada
display(df)
```

---
**Tags:** #python #nivelamento #pandas #DataFrame #CSV #import #math #random #scout #aula08
