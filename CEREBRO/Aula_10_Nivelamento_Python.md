# Aula 10: Curso de Nivelamento Python

**Data:** Outubro de 2026  
**Professor:** Leonardo Barbosa  
**Módulo:** Nivelamento em Python  

---

## 📌 Ideia Central e Resumo
A décima aula marca a conclusão do módulo básico de Python. O professor inicia corrigindo o desafio prático de *Data Cleaning* da Aula 9, demonstrando como limpar um nome desformatado ("Vini Júnior"). Em seguida, a aula consolida todo o aprendizado em um mini-projeto completo: **Análise de Artilharia**. Os alunos aprendem a ler dados reais via arquivo CSV, aplicar filtros usando a biblioteca **Pandas**, calcular estatísticas totais e, finalmente, gerar o seu **primeiro gráfico visual** utilizando a biblioteca **Matplotlib**. 

---

## 🧠 Conceitos Metodológicos Chave

### 1. Limpeza de Dados (Recapitulação)
A correção do exercício reforçou a importância do tratamento de *strings* antes da análise de dados:
*   Um dado bruto ("Vini Júnior" com erro de digitação/formatação) foi limpo utilizando uma combinação de `.replace()` para corrigir o erro ortográfico e `.title()` para ajustar as maiúsculas, garantindo que o dado estivesse pronto para um relatório oficial.

### 2. Ordenação e Filtros no Pandas (`sort_values`)
Para descobrir os artilheiros de um campeonato, não basta ter a lista; é preciso ordená-la.
*   **`.sort_values()`:** Método do Pandas que ordena a tabela.
    *   *Sintaxe:* `df.sort_values(by='Gols', ascending=False)`
    *   *Explicação:* O parâmetro `by` define a coluna base para a ordenação (Gols). O parâmetro `ascending=False` garante que a ordem seja do maior para o menor (decrescente). Se fosse `True`, seria do menor para o maior.
*   **`.head(n)`:** Retorna apenas as primeiras *n* linhas da tabela. Útil para mostrar o "Top 3".
*   **`.tail(n)`:** Retorna apenas as últimas *n* linhas da tabela. Útil para ver a "Zona de Rebaixamento", por exemplo.

### 3. Operações Matemáticas em Colunas
O Pandas permite somar ou calcular a média de uma coluna inteira de forma quase instantânea.
*   *Soma:* `df['Gols'].sum()` soma todos os valores da coluna 'Gols'.
*   *Média:* `df['Gols'].mean()` calcula a média dos valores daquela coluna.

### 4. Visualização de Dados (Matplotlib)
A criação de gráficos é essencial para comunicar *insights* a comissões técnicas.
*   **Importação:** `import matplotlib.pyplot as plt`.
*   **Construção do Gráfico (`plt.bar`):** Cria um gráfico de barras.
    *   *Eixo X:* A base (ex: Nomes dos jogadores).
    *   *Eixo Y:* A altura da barra (ex: Quantidade de Gols).
*   **Customização:** É possível adicionar título ao gráfico (`plt.title`) e rótulos aos eixos (`plt.xlabel` e `plt.ylabel`).
*   **Exibição:** O comando `plt.show()` é necessário para renderizar o gráfico na tela.

---

## 🛠️ Stack Tecnológico e Ferramentas

*   **Pandas (`pd`):** Leitura de CSV, `.sort_values()`, `.head()`, `.tail()`, cálculos de coluna (`.sum()`, `.mean()`).
*   **Matplotlib (`plt`):** Biblioteca fundamental de visualização em Python. Usada para gerar o gráfico de barras inicial (`plt.bar`).

---

## ⚽ Aplicação Prática (Mão na Massa)

### 1. Criando o Ranking de Artilheiros (Pandas)
Como extrair o Top 3 do campeonato a partir de uma tabela bruta.

**Exemplo Prático (Código):**
```python
import pandas as pd

# Lê a tabela (supondo que o DataFrame df já foi carregado via CSV)
# Ordena pela coluna 'Gols' do maior para o menor
df_ordenado = df.sort_values(by='Gols', ascending=False)

# Pega apenas os 3 primeiros
top_3_artilheiros = df_ordenado.head(3)

display(top_3_artilheiros)
```

### 2. Criando o Primeiro Gráfico de Barras (Matplotlib)
Como transformar os números em uma apresentação visual.

**Exemplo Prático (Código):**
```python
import matplotlib.pyplot as plt

# Cria o gráfico de barras: Eixo X = Nomes, Eixo Y = Gols
plt.bar(df['Nome'], df['Gols'])

# Adiciona títulos e rótulos para estética e compreensão
plt.title('Gols por Jogador')
plt.xlabel('Jogador')
plt.ylabel('Quantidade de Gols')

# Exibe o gráfico na tela
plt.show()
```

---
**Tags:** #python #nivelamento #pandas #matplotlib #visualizacao #sort_values #head #tail #graficos #artilharia #scout #aula10
