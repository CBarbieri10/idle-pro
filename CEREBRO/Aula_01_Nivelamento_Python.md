# Aula 1: Curso de Nivelamento Python

**Data:** Outubro de 2026  
**Professor:** Leonardo Barbosa  
**Módulo:** Nivelamento em Python  

---

## 📌 Ideia Central e Resumo
A aula inaugural de Python foca em introduzir a linguagem, apresentando seu potencial na análise de dados no futebol e os tipos de dados fundamentais. O professor demonstra como variáveis são criadas e utilizadas para armazenar informações e como a função `print()` é usada para exibir esses dados no console, criando uma base sólida para as próximas aulas.

---

## 🧠 Conceitos Metodológicos Chave

### 1. O que é Python?
*   **Linguagem de Alto Nível:** Python é uma linguagem cuja sintaxe se assemelha à linguagem humana (inglês), tornando-a fácil de aprender e ler.
*   **Aplicações no Futebol:** É amplamente utilizada em clubes para análise de desempenho, *scouting*, apostas e visualização de estatísticas (como mapas de passes e calor).

### 2. Tipos de Dados Fundamentais
*   **Inteiro (Integer/int):** Números inteiros, positivos ou negativos, sem casas decimais (Ex: `12`, `-5`). Usado para contar gols, idade, etc.
*   **Decimal (Float):** Números com casas decimais (Ex: `1.7`). **Atenção:** Em Python, utiliza-se o ponto (`.`) para separar as casas decimais, não a vírgula (`,`). Usado para médias de gols, estaturas, etc.
*   **Texto (String/str):** Sequências de caracteres (texto) que devem ser colocadas entre aspas simples (`' '`) ou duplas (`" "`). (Ex: `'Hulk'`, `"Gabriel"`).
*   **Booleano (Boolean/bool):** Representa valores lógicos: Verdadeiro (`True`) ou Falso (`False`). Usado para indicar se um jogador é titular, por exemplo.

### 3. Criação de Variáveis
*   **O que são variáveis:** Espaços na memória do computador para armazenar dados (como se fossem caixas com rótulos).
*   **Sinal de Atribuição (`=`):** O sinal de igual não significa igualdade matemática, mas sim *atribuição*. Ele pega o valor à direita e o armazena na variável à esquerda.
    *   Exemplo: `nome = 'Gabriel'` (A variável `nome` recebe o texto 'Gabriel').

### 4. A Função `print()`
*   Usada para exibir informações na tela (console).
*   Pode combinar texto e variáveis separando-os por vírgulas.
    *   Exemplo: `print('Nome do jogador:', nome)` exibirá "Nome do jogador: Gabriel".

### 5. Boas Práticas (PEP 8)
*   **Aspas em Strings:** A PEP 8 (guia de estilo do Python) recomenda o uso preferencial de aspas simples (`' '`) para strings que não contêm outras aspas, pois exige digitar apenas uma tecla.
*   **Comentários:** O símbolo `#` (cerquilha/hashtag) é usado para inserir comentários no código, que são ignorados pelo interpretador Python.

---

## 🛠️ Stack Tecnológico e Ferramentas

*   **Python:** A linguagem de programação em si.
*   **VS Code (Visual Studio Code):** O editor de código (IDE) utilizado na aula.
*   **Jupyter Notebook (.ipynb):** Formato de arquivo que permite misturar blocos de código executáveis com texto e imagens, ideal para análise de dados. Pode ser usado localmente (como no VS Code) ou na nuvem.
*   **Google Colab:** Ambiente na nuvem (baseado no Jupyter Notebook) fornecido pelo Google, que permite rodar código Python diretamente no navegador, sem precisar instalar nada, armazenando os arquivos no Google Drive.

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Criando e Exibindo Fichas de Jogadores
A aula demonstra como armazenar dados de um jogador em variáveis e formatá-los para exibição.

**Exemplo Prático (Código):**
```python
# Criando as variáveis
nome = 'Gabriel'
idade = 23
gols_marcados = 18
media_de_gols_por_partida = 0.75
titular = True

# Exibindo os dados
print('Nome do jogador:', nome)
print('A idade do jogador é:', idade)
print('Quantidade de gols marcados:', gols_marcados)
print('Média de gols:', media_de_gols_por_partida)
print('Neste jogo ele foi titular:', titular)
```

---
**Tags:** #python #nivelamento #variaveis #print #dados #aula01
