# Aula 5: Curso de Nivelamento Python

**Data:** Outubro de 2026  
**Professor:** Leonardo Barbosa  
**Módulo:** Nivelamento em Python  

---

## 📌 Ideia Central e Resumo
A quinta aula introduz o conceito fundamental de **Funções (`def`)** em Python. Após a correção dos exercícios de loops, o professor explica como as funções permitem agrupar lógicas, evitar repetições e tornar o código muito mais limpo e profissional (*Clean Code*). Usando a analogia de uma "máquina de suco" (onde se entra a fruta e sai o suco), a aula demonstra como criar funções para calcular o aproveitamento de times, médias de gols e automatizar a geração de fichas de jogadores.

---

## 🧠 Conceitos Metodológicos Chave

### 1. O que são Funções?
*   São blocos de código nomeados que podem ser executados repetidas vezes ao serem "chamados" (invocados).
*   **Vantagens:** Organização, reusabilidade (não precisar digitar as mesmas 20 linhas de código toda vez), facilidade de manutenção (se houver um bug, corrige-se apenas dentro da função) e escalabilidade.
*   **Analogia da Máquina de Suco:**
    *   **Função:** A máquina.
    *   **Parâmetros (Input):** As laranjas que entram na máquina.
    *   **Processamento:** O ato de espremer.
    *   **Retorno (`return` / Output):** O suco que sai pronto.

### 2. Sintaxe Básica de uma Função
*   `def`: Palavra reservada do Python para "definir" uma função.
*   `nome_da_funcao`: O nome que você escolhe (deve ser claro sobre o que a função faz).
*   `(parametros)`: As variáveis que a função precisa receber para trabalhar.
*   `return`: O comando que devolve o resultado do cálculo para fora da função.

### 3. A Função `round()`
*   Usada para arredondar números decimais longos.
*   *Sintaxe:* `round(numero_para_arredondar, quantidade_de_casas_decimais)`
*   *Exemplo na aula:* `round(valor, 2)` arredonda o aproveitamento para duas casas decimais (ex: de 66.6666... para 66.67).

---

## 🛠️ Stack Tecnológico e Ferramentas

*   **Python:** Definição de funções (`def`, `return`), manipulação de strings formatadas e uso de funções nativas (`round()`).

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Função para Calcular Aproveitamento de um Time
Como automatizar uma conta matemática com parâmetros variáveis.

**Exemplo Prático (Código):**
```python
def calcular_aproveitamento(pontos, jogos):
    # Calcula os pontos disputados totais (jogos * 3) e tira a porcentagem
    aproveitamento = (pontos / (jogos * 3)) * 100
    # Retorna o valor arredondado em 2 casas decimais
    return round(aproveitamento, 2)

# Invocando a função no print
print(f'O aproveitamento foi de: {calcular_aproveitamento(79, 38)}%')
```

### 2. Função para Calcular Média de Gols
Uma função rápida para calcular média e arredondar.

**Exemplo Prático (Código):**
```python
def media_gols(gols, jogos):
    return round((gols / jogos), 2)

print(f'A média de gols é de {media_gols(10, 20)} por jogo.')
```

### 3. Função de Ficha de Jogador (Sem return)
Funções também podem apenas executar ações (como imprimir na tela) sem precisar usar o comando return.

**Exemplo Prático (Código):**
```python
def ficha_jogador(nome, idade, clube):
    print(f'Jogador: {nome} | Idade: {idade} | Clube: {clube}')

# Chamando a função repetidas vezes com dados diferentes
ficha_jogador('Carlos', 27, 'Corinthians')
ficha_jogador('Garrincha', 21, 'Botafogo')
```

---
**Tags:** #python #nivelamento #funcoes #def #return #round #CleanCode #scout #aula05
