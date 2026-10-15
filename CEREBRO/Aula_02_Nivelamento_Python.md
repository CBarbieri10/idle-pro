# Aula 2: Curso de Nivelamento Python

**Data:** Outubro de 2026  
**Professor:** Leonardo Barbosa  
**Módulo:** Nivelamento em Python  

---

## 📌 Ideia Central e Resumo
A segunda aula do curso de nivelamento avança na manipulação de variáveis, focando em operações matemáticas, relacionais e lógicas. O objetivo é demonstrar como o Python pode ser utilizado para processar dados de jogadores e partidas, realizando cálculos simples (somas, médias) e testes de condições (verificar se um jogador atinge determinados critérios de performance). A aula também reforça boas práticas de escrita de código (PEP 8) e introduz a formatação de *strings*.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Boas Práticas e Nomenclatura de Variáveis (PEP 8)
*   **O que é PEP 8:** É o guia de estilo para código Python, visando mantê-lo limpo (*clean code*), legível e escalável.
*   **Nomeação de Variáveis:**
    *   **Erro Comum:** Usar espaços em nomes de variáveis (Ex: `gols na temporada = 11` gerará um *Syntax Error*, pois o Python entende como múltiplas palavras soltas).
    *   **Padrão *Snake Case*:** A forma correta e recomendada em Python é usar *underline* (`_`) para separar palavras. Exemplo: `gols_na_temporada = 11`.
    *   **Padrão *Camel Case*:** Também aceito, mas menos comum em variáveis Python: `mediaDeGols = 0.75`.

### 2. Formatação de Strings (`f-strings`)
*   Permite inserir o valor de variáveis diretamente dentro de um texto, facilitando a construção de frases e relatórios.
*   **Como usar:** Coloca-se a letra `f` antes das aspas da string e envolve-se as variáveis com chaves `{}`.
    *   Exemplo: `print(f'O jogador {nome} fez {gols} gols.')`
*   **Caractere de Escape (`\n`):** Usado dentro da string para pular para a próxima linha (como um "Enter").

### 3. Operadores Aritméticos
*   **Adição (`+`):** Soma valores. Ex: `total_gols = gols_time_a + gols_time_b`
*   **Subtração (`-`):** Subtrai valores. Ex: `saldo_gols = gols_feitos - gols_sofridos`
*   **Divisão (`/`):** Divide valores, gerando sempre um número decimal (*float*). Ex: `media = gols / partidas`

### 4. Operadores Relacionais (Comparações)
Comparam dois valores e sempre retornam um Booleano (`True` ou `False`).
*   `>` (Maior que)
*   `<` (Menor que)
*   `>=` (Maior ou igual a)
*   `<=` (Menor ou igual a)
*   `==` (Igualdade): **Importante:** Um único sinal de igual (`=`) atribui valor a uma variável. Dois sinais (`==`) comparam se os valores são idênticos.

### 5. Operadores Lógicos
Usados para combinar múltiplas condições em relatórios de *scout*, por exemplo.
*   `and` (E): Retorna `True` **apenas se TODAS** as condições forem verdadeiras.
    *   *Aplicação:* Filtrar um jogador de elite que precisa ter gols altos E assistências altas.
*   `or` (Ou): Retorna `True` se **PELO MENOS UMA** das condições for verdadeira.
    *   *Aplicação:* Identificar potencial em um jogador que compensa a falta de gols com um alto número de desarmes.
*   `not` (Não): Inverte o resultado booleano.

---

## 🛠️ Stack Tecnológico e Ferramentas

*   **Python:** Linguagem de programação.
*   **Leitura de Erros (Traceback):** Habilidade fundamental destacada pelo professor. Entender mensagens como `SyntaxError: invalid syntax` apontando para a linha do problema é essencial para a resolução de *bugs* de forma autônoma.

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Criando um Relatório de Scout (Condições Lógicas)
Como criar critérios automatizados para classificar um atacante.

**Exemplo Prático (Código):**
```python
gols = 10
assistencias = 5
recuperacoes = 2

# Usando o operador 'and' (Critério rígido)
bom_atacante = (gols >= 10) and (assistencias >= 5)
print(f'É um bom atacante? {bom_atacante}') # Resultado: True

# Usando o operador 'or' (Critério flexível para potencial)
tem_potencial = (gols >= 10) or (recuperacoes >= 5)
print(f'Tem potencial tático? {tem_potencial}') # Resultado: True (mesmo com recuperações baixas, os gols compensam)
```

### 2. Automação de Fichas Técnicas (f-strings)
Usando variáveis para gerar textos padronizados que mudam dinamicamente.

**Exemplo Prático (Código):**
```python
time_casa = "Flamengo"
time_fora = "Fluminense"
gols_casa = 3
gols_fora = 2

# O cálculo (gols_casa - gols_fora) não pode ser feito diretamente na mesma linha se houver erro de sintaxe.
# Forma correta de exibir o placar:
print(f'O jogo entre {time_casa} e {time_fora} terminou em {gols_casa} a {gols_fora} para o mandante.')
```

---
**Tags:** #python #nivelamento #operadores #f-strings #PEP8 #logica #scout #aula02
