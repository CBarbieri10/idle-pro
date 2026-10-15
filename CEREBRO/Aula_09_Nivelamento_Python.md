# Aula 9: Curso de Nivelamento Python

**Data:** Outubro de 2026  
**Professor:** Leonardo Barbosa  
**Módulo:** Nivelamento em Python  

---

## 📌 Ideia Central e Resumo
A nona aula é focada no tratamento e manipulação de textos (*Strings*). O professor corrige os exercícios avançados da aula anterior envolvendo a leitura e criação de arquivos CSV com o Pandas e, em seguida, ensina como limpar e formatar dados textuais usando os métodos nativos de string do Python. O domínio dessas ferramentas é essencial para a etapa de "Limpeza de Dados" (Data Cleaning), pois em cenários reais, nomes de jogadores e clubes frequentemente vêm com erros de digitação ou formatações irregulares.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Métodos Nativos de String
Métodos são funções embutidas em objetos específicos do Python. Para strings, eles são acionados colocando um ponto (`.`) após a variável.
*   **`.upper()`:** Converte todo o texto para letras MAIÚSCULAS. (Ex: `NEYMAR`).
*   **`.lower()`:** Converte todo o texto para letras minúsculas. (Ex: `neymar`).
*   **`.capitalize()`:** Transforma apenas a primeira letra da string em maiúscula. (Ex: `Vinicius junior`).
*   **`.title()`:** Transforma a primeira letra de **cada palavra** em maiúscula. (Ex: `Vinicius Junior`).
*   **`.replace('antigo', 'novo')`:** Procura um pedaço de texto e o substitui por outro. (Ex: Substituir "Jesus" por "Martinelli").

### 2. Validação de Strings
Métodos que retornam valores Booleanos (`True` ou `False`), excelentes para aplicar filtros (`if`).
*   **`.startswith('texto')`:** Verifica se a string *começa* com o termo informado.
*   **`.endswith('texto')`:** Verifica se a string *termina* com o termo informado.

### 3. Fatiamento de Strings (*Slicing*)
Assim como as listas e tuplas, as strings no Python funcionam como uma sequência de caracteres indexada (começando pelo índice `0`).
*   **Sintaxe de Fatiamento (`[início:fim]`)**: Extrai um pedaço do texto. A regra do "exclusivo" se aplica ao índice final.
    *   *Exemplo:* `nome[0:7]` pega da posição 0 até a 6.
*   **Índices Negativos:** Usados para contar de trás para frente.
    *   *Exemplo:* `nome[-6:]` pega os últimos 6 caracteres da string.
*   *Nota:* O espaço em branco (` `) também conta como um caractere e ocupa uma posição de índice no fatiamento.

---

## 🛠️ Stack Tecnológico e Ferramentas

*   **Pandas (`pd`):** Durante a correção, o professor usou a função `.apply()` do Pandas para rodar uma função lógica linha por linha em um DataFrame e criar uma nova coluna de "Pontos" baseada em Gols Pró e Gols Contra.
*   **Python (Strings):** `.upper()`, `.title()`, `.replace()`, Indexação e Slicing (`[]`).

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Aplicando Regras de Pontuação no Pandas (Correção da Aula 8)
Como criar uma coluna nova em uma planilha baseada em condições lógicas de outras colunas.

**Exemplo Prático (Código):**
```python
import pandas as pd

# Supondo que df é a nossa tabela lida de um CSV
def calcular_pontos(linha):
    if linha['Gols_Pro'] > linha['Gols_Contra']:
        return 3 # Vitória
    elif linha['Gols_Pro'] == linha['Gols_Contra']:
        return 1 # Empate
    else:
        return 0 # Derrota

# O .apply() executa a função 'calcular_pontos' para cada linha do DataFrame
# axis=1 indica que queremos avaliar as colunas daquela linha
df['Pontos'] = df.apply(calcular_pontos, axis=1)

print(df)
```

### 2. Tratamento de Nomes Sujos (Data Cleaning)
Limpando um nome digitado de forma irregular.

**Exemplo Prático (Código):**
```python
# O dado chegou do scout todo desformatado
nome_sujo = "   vInI jÚnIoR   "

# Passo 1: .strip() remove espaços vazios no começo e no fim (método bônus comum em tratamento)
# Passo 2: .title() ajusta as maiúsculas e minúsculas de cada palavra
nome_limpo = nome_sujo.strip().title()

# Passo 3: Substituir um apelido pelo nome real
nome_oficial = nome_limpo.replace("Vini", "Vinícius")

print(nome_oficial)
# Resultado esperado: "Vinícius Júnior"
```

---
**Tags:** #python #nivelamento #strings #DataCleaning #pandas #apply #slicing #upper #lower #title #replace #aula09
