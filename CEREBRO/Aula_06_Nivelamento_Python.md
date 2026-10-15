# Aula 6: Curso de Nivelamento Python

**Data:** Outubro de 2026  
**Professor:** Leonardo Barbosa  
**Módulo:** Nivelamento em Python  

---

## 📌 Ideia Central e Resumo
A sexta aula do curso de nivelamento foca em duas das principais estruturas de dados do Python: **Listas (`list`)** e **Tuplas (`tuple`)**. Após corrigir os exercícios da aula anterior, o professor demonstra como essas coleções permitem armazenar múltiplos valores dentro de uma única variável. A aula ensina a diferença crucial entre a mutabilidade das listas e a imutabilidade das tuplas, além de como acessar e extrair dados específicos usando o sistema de índices do Python.

---

## 🧠 Conceitos Metodológicos Chave

### 1. Listas (`list`)
*   **O que são:** Coleções ordenadas de itens que podem ser alteradas. Permitem elementos repetidos e mistos (strings, inteiros, booleanos).
*   **Sintaxe:** Criadas usando colchetes `[]`.
    *   *Exemplo:* `jogadores = ['Carlos', 'Pedro', 'Lucas']`
*   **Mutabilidade:** É possível adicionar, remover ou alterar elementos de uma lista após sua criação. O professor simulou a alteração manual recriando a lista, mas nas próximas aulas métodos como `.append()` e `.remove()` serão introduzidos.

### 2. Tuplas (`tuple`)
*   **O que são:** Coleções ordenadas de itens, muito semelhantes às listas, porém **imutáveis**.
*   **Sintaxe:** Criadas usando parênteses `()`.
    *   *Exemplo:* `times = ('Atlético', 'Cruzeiro', 'Flamengo', 'Palmeiras')`
*   **Imutabilidade:** Uma vez criada, não é possível adicionar, remover ou alterar os itens de uma tupla. São ideais para armazenar dados que não devem sofrer modificações (ex: dimensões do campo, regras fixas, coordenadas imutáveis).

### 3. Acessando Elementos por Índice
*   O Python utiliza **indexação baseada em zero**. Ou seja, o primeiro item de uma lista ou tupla está na posição `0`, o segundo na posição `1`, e assim por diante.
*   **Sintaxe de Acesso:** Usa-se o nome da variável seguido por colchetes contendo o número do índice.
    *   *Exemplo:* `times[0]` retornará `'Atlético'`.
    *   *Exemplo:* `times[3]` retornará `'Palmeiras'`.
*   **Erro Comum (`IndexError`):** Tentar acessar um índice que não existe na coleção (ex: `times[4]` na tupla acima) resultará no erro "tuple index out of range" (índice fora do limite).

---

## 🛠️ Stack Tecnológico e Ferramentas

*   **Python:** Listas (`[]`), Tuplas (`()`) e Indexação (`[0]`).
*   **VS Code:** O professor destaca como a IDE identifica automaticamente o tipo da variável ao passar o mouse por cima (ex: mostrando `tuple` para a variável `times`), facilitando o entendimento do código.

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Iterando sobre uma Lista
Como percorrer nomes de um elenco usando um loop `for`.

**Exemplo Prático (Código):**
```python
jogadores = ['Carlos', 'Pedro', 'Lucas', 'João']

for nome in jogadores:
    print(f'Analisando o jogador: {nome}')
```

### 2. Acessando Dados em uma Tupla
Como extrair o nome de um time específico armazenado de forma imutável.

**Exemplo Prático (Código):**
```python
# Criando a tupla (parênteses)
campeoes = ('Palmeiras', 'Flamengo', 'Atlético Mineiro')

# Acessando o segundo time (índice 1, pois começa em 0)
segundo_time = campeoes[1]
print(f'O segundo time da lista de campeões é o {segundo_time}.')
# Resultado: O segundo time da lista de campeões é o Flamengo.
```

---
**Tags:** #python #nivelamento #listas #tuplas #indices #mutabilidade #imutabilidade #IndexError #scout #aula06
