# Testes

São 9 suítes que exercitam o `index.html` de verdade — abrem a página num navegador
sem janela, preenchem o formulário, geram o CSV e conferem campo por campo. Juntas
são **256 verificações**. Não há framework, npm nem servidor: só Python 3 e Chromium.

## Rodar

```bash
./testes/run.sh testes/teste.js          # uma suíte
for f in testes/t-*.js testes/teste*.js; do echo "== $f"; ./testes/run.sh "$f"; done
```

Cada linha da saída começa com `OK` ou `FALHA`. `FALHA` ou `EXCEÇÃO` em qualquer
linha significa que alguma coisa quebrou — e `SEM RESULTADO` normalmente é erro de
sintaxe no `index.html`.

Se o Chromium não estiver no caminho esperado, aponte com `CHROMIUM=/caminho/do/chrome`.

## O que cada suíte cobre

| Arquivo | Cobre |
|---|---|
| `teste.js` | fluxo completo: pedido, cascata de classificação, grade, lojas, salvar, editar, duplicar, remover, CSV, backup, XSS, persistência |
| `teste-pdf.js` | geração do PDF com produtos pesados (12 cores, textos longos, com e sem foto), com um jsPDF simulado — pega quebra de página e texto fora da margem |
| `t-cor.js` | lista de cores do PRDFL025, seletor, código vs. nome, troca de lista, migração |
| `t-cnpj.js` | validação e formatação do CNPJ, `NR_CNPJFORNECEDOR` |
| `t-custo.js` | os conjuntos de valor (venda + os dois custos) e a hierarquia revisada |
| `t-depto.js` | departamento com código de 3 dígitos e migração das versões antigas |
| `t-niveis.js` | os 6 níveis da máscara — o teste que trava o bug do nível vazio deslocando os seguintes |
| `t-desc.js` | descrições padronizadas do nível 5, seletor e montagem do `DS_PRODUTO` |
| `t-classif.js` | as 9 classificações do PRDFM308, marca, estação e nome fantasia |

## Antes de mexer no index.html

Rode tudo, anote quantos `OK` deram, faça a alteração e rode de novo. Vários desses
testes existem porque um erro **já** chegou ao TOTVS uma vez — o `t-niveis.js`, por
exemplo, existe para o nível 5 nunca mais sair vazio e empurrar a referência para o
lugar da descrição.

Quando o número de colunas do CSV mudar de propósito (uma classificação nova, um
custo novo), as suítes que contam colunas precisam ser atualizadas junto. Hoje a
linha do CSV tem **64 campos**.
