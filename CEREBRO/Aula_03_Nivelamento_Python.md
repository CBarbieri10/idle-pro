# Aula 3: Curso de Nivelamento Python

**Data:** Outubro de 2026  
**Professor:** Leonardo Barbosa  
**Módulo:** Nivelamento em Python  

---

## 📌 Ideia Central e Resumo
A terceira aula introduz o controle de fluxo na programação através das **estruturas condicionais**. O professor demonstra como usar `if`, `elif` e `else` para permitir que o código "tome decisões" lógicas com base nos dados. A aula avança da verificação simples (quem fez mais gols) para a classificação de pontuações (zonas de classificação de um campeonato) e avaliação de performance (notas de jogadores), preparando o aluno para criar pequenos algoritmos de análise automatizada.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Estruturas Condicionais (O que são?)
Permitem que o programa execute diferentes blocos de código dependendo de uma ou mais condições. Se uma condição for verdadeira, uma ação é tomada; se for falsa, o programa pula para a próxima condição.

*   **`if` (Se):** O ponto de partida. Verifica a primeira condição. Se for `True` (Verdadeira), executa o bloco de código logo abaixo dele.
*   **`elif` (Senão, se):** Usado quando você tem múltiplas condições alternativas. Se o `if` inicial for falso, o Python verifica o `elif`. Pode haver vários `elif` em sequência.
*   **`else` (Senão):** O caminho final. Executado apenas se **nenhuma** das condições anteriores (`if` ou `elif`) for verdadeira.

### 2. A Importância da Indentação (Tabulação)
Diferente de outras linguagens que usam chaves `{}`, o Python utiliza a **indentação** (o espaço ou "Tab" antes da linha de código) para definir quais ações pertencem a uma condição.
*   Tudo que estiver "recuado" abaixo de um `if` só será executado se a condição do `if` for verdadeira.

### 3. Conectores Lógicos nas Condições (`and`, `or`)
Relembrando a aula passada, o professor aplica operadores lógicos dentro das estruturas condicionais para criar filtros mais complexos.
*   Exemplo de filtro composto: O time vai para a Sul-Americana **SE** os pontos forem `<= 70` **AND** (E) os pontos forem `>= 45`. Ambas as condições devem ser satisfeitas.

---

## 🛠️ Stack Tecnológico e Ferramentas

*   **Python:** Foco na sintaxe de controle de fluxo.
*   **VS Code / Jupyter:** O interpretador já aplica a indentação automaticamente ao apertar "Enter" após os dois pontos (`:`) de um `if`.

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Descobrindo o Vencedor da Partida
Como usar uma estrutura básica `if` / `elif` / `else`.

**Exemplo Prático (Código):**
```python
gols_time_a = 2
gols_time_b = 3

if gols_time_a > gols_time_b:
    print('Time A venceu a partida.')
elif gols_time_b > gols_time_a:
    print('Time B venceu a partida.')
else:
    print('A partida terminou empatada.')
```

### 2. Classificação Automatizada do Campeonato
Criando um pequeno algoritmo que classifica um time de acordo com os pontos inseridos, usando múltiplos `elif`.

**Exemplo Prático (Código):**
```python
pontos_time = 71

if pontos_time > 70:
    print('Classificado para a Libertadores.')
elif (pontos_time <= 70) and (pontos_time >= 45):
    print('Classificado para a Copa Sul-Americana.')
elif (pontos_time < 45) and (pontos_time >= 40):
    print('Ficou no meio da tabela. Não disputa nada.')
else:
    print('Time Rebaixado.')
```
*(Nota: O valor da variável `pontos_time` pode ser alterado, e o código dará o resultado correto instantaneamente sem precisar ser reescrito).*

### 3. Avaliação de Notas de Scouts (Ex: SofaScore)
Classificando a performance qualitativa de um jogador baseado em uma nota numérica.

**Exemplo Prático (Código):**
```python
nota_sofascore = 7.5

if nota_sofascore >= 8:
    print('Excelente partida.')
elif nota_sofascore >= 6:
    print('Boa partida.')
else:
    print('Partida regular/Precisa melhorar.')
```

---
**Tags:** #python #nivelamento #condicionais #if #elif #else #logica #scout #aula03
