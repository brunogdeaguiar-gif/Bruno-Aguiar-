# Diário de bordo — o que o TOTVS ensinou

Este arquivo guarda o **porquê** das coisas. O `README.md` explica como o sistema
funciona hoje; aqui está o caminho até aqui: o que foi testado, o que falhou, e a
razão de cada decisão. É o tipo de coisa que se perde quando a pessoa que fez sai
de férias.

Cada item foi apurado em importação real no GERFP096 ou conferido no próprio TOTVS —
nada aqui é suposição, e onde ainda há suposição está dito com todas as letras.

---

## 1. O importador monta SQL com o nome das colunas do cabeçalho

**Como descobrimos:** a primeira importação com o campo `TP_ITEMSPED` (que está no
manual) falhou em *todas* as linhas com
`ORA-00904: "TP_ITEMSPED": identificador inválido`.

**O que significa:** a versão do TOTVS instalada aqui é anterior ao manual que temos.
Uma coluna que ele não conhece **invalida o arquivo inteiro** — não é a linha que
falha, é tudo.

**Decisão:** o campo ficou atrás de `CFG.usarTpItemSped`, hoje `false`. Quando o
TOTVS for atualizado e o campo aparecer no botão *Exportar layout* do GERFP096, é
trocar para `true`.

**Lição que vale para sempre:** o manual não é a verdade — a instalação é. Antes de
confiar num campo novo, exporte o layout do próprio GERFP096 e compare.

---

## 2. Nível vazio não fica vazio: o TOTVS pula e desloca os seguintes

**Como descobrimos:** o nível 5 (DESCRICAO) foi enviado sem código. No PRDFM236 a
**referência do fornecedor** apareceu gravada no lugar da descrição.

**O que significa:** o TOTVS não guarda posição em branco. Se o nível 5 vem vazio, o
nível 6 sobe e ocupa o lugar dele — e a máscara inteira sai torta, sem nenhuma
mensagem de erro.

**Decisão:** nenhum nível pode sair vazio. A exportação avisa quando algum está em
branco, e o botão *Digitar descrição fora da lista* **exige** o código justamente
por isso.

---

## 3. Cada nível vai num `CD_GRUPO` próprio, com o código curto

**Como descobrimos:** mandávamos o código composto da espécie (`130530`) em
`CD_GRUPO1`. O PRDFM236 registrou tudo amontoado num nível só.

**Decisão:** `CD_GRUPO1` a `CD_GRUPO6`, um por nível, com o código **curto**: a
espécie 130530 entra como `530`. A observação do layout confirma que `CD_GRUPO1` e
`DS_GRUPO1` aceitam até 10 repetições (os demais campos numerados aceitam 3).

**Cuidado:** na **classificação** é o contrário — a espécie vai com o código
completo (`300410`). Nível usa o curto, classificação usa o inteiro.

---

## 4. Os 6 níveis da máscara

| Nível | Origem | Exemplo |
|---|---|---|
| 1 SEGMENTO | campo Segmento | `100` FEMININO |
| 2 SECAO | campo Seção | `130` CALCA |
| 3 ESPECIE | 3 últimos dígitos da espécie | `530` MACACAO CURTO |
| 4 DEPARTAMENTO | mesmo código da classificação | `001` JOVEM |
| 5 DESCRICAO | lista padronizada, 4 dígitos | `0207` BOLSO E CAPUZ BICOLOR |
| 6 REFERENCIA | ref. do fornecedor (nível aberto: o texto vira o código) | `46016` |

O nível 5 é uma padronização **nova**, que não existia no TOTVS: é a própria
importação que cria esses grupos. Não conflita com o que já estava lá porque o
padrão de 4 dígitos é diferente do usado antes.

---

## 5. Departamento tem 3 dígitos, não 1

**Como descobrimos:** a planilha de hierarquia mostrava `1 JOVEM`, `2 PLUS SIZE`.
Ao abrir o XML do `.xlsx` deu para ver que as células são **numéricas** — o Excel
tinha comido os zeros à esquerda. No TOTVS é `001`.

**Lição:** planilha com código em célula numérica não serve como fonte de código.
`001` e `1` ficam idênticos. Sempre conferir contra uma tela ou um relatório do
TOTVS.

O mesmo valeu para as marcas: `001` a `008`, confirmado depois no PRDR020.

---

## 6. CST é `0` (Nacional)

Estava indo `2` (Estrangeira). Erro nosso, corrigido. Fica em `CFG.cdCst`.

---

## 7. Cor é código, não nome

**Como descobrimos:** a primeira importação não reconheceu nenhuma cor.

`CD_COR` exige o código do PRDFL025. A lista embutida saiu do relatório PRDR075 em
PDF, com 2.359 cores — e **350 delas estão marcadas com ⚠** porque o relatório corta
a coluna do código em 8 caracteres.

**Pendência:** exportar o PRDFL025 em CSV direto do TOTVS e carregar em
*Pedido → Atualizar lista de cores*. Isso elimina os 350 de uma vez.

---

## 8. `DS_PRODUTO` segue um padrão da casa

**Como descobrimos:** comparando um produto importado com um cadastrado à mão.

```
SECAO + ESPECIE + DEPARTAMENTO + DESCRICAO + COR + TAMANHO
CAMISETA MGA CURTA JOVEM BASICA CAFE P
```

O segmento fica de fora — ele aparece só na *discriminação* do grupo, que o TOTVS
monta sozinho.

**Limitação conhecida:** o texto é montado com os nomes da **nossa** lista
(`MANGA CURTA`) e o TOTVS usa os dele (`MGA CURTA`). Para ficar idêntico, ou se
acerta a lista de níveis do sistema, ou se roda o **PRDFP018** depois de importar —
é o componente que recalcula a descrição de grupos e produtos usando as descrições
dos níveis do próprio TOTVS.

---

## 9. As 9 classificações passam, apesar do manual

**Como descobrimos:** o manual diz que os campos numerados se repetem *até 3 vezes*.
Testamos com as 9 e o TOTVS aceitou.

**Decisão:** 9 viraram o padrão. O seletor em *Pedido → Importação no TOTVS* mantém
a opção de 3 caso uma atualização reintroduza o limite — e por isso a ordem do
`CFG.classifTipos` continua sendo ordem de **prioridade**: marca, estação e nome
fantasia primeiro, porque são as únicas que não existem em nenhum nível da máscara.

**Ainda por confirmar:** `200 INTEGRACAO DW = 001 BI` e `1007 CLASS EMPRESA = 02
EMMANUELLE` foram deduzidos de **um** produto. Vão fixos para todo produto.

---

## 10. Estação: a lista do sistema não existia no TOTVS

O sistema oferecia `VERÃO 26`, `INVERNO 26`… que não existem em lugar nenhum do
TOTVS. Lá são 26 estações com nome próprio (`019 - 20 VERAO 2025/2026`).

**Decisão:** trocamos pela lista real. Os produtos já salvos com a estação antiga
ficaram **sem estação** — de propósito. Não havia como saber se `VERÃO 26` era o
`019` ou o `020`, e chutar gravaria a coleção errada no TOTVS.

---

## Decisões que foram tomadas e depois revertidas

- **Níveis 5 e 6 aceitando letras** (PR #15) — pedido e revertido no mesmo dia
  (PR #16), a pedido. O nível 5 usa sequencial numérico.
- **`CD_COMPOSICAO` inválido** — passei um bom tempo analisando as colunas do SQL e
  concluí, com confiança, que era a tabela de Produto. Estava errado: a importação
  tinha sido feita na aba *Pessoa*. Vale de lembrete: erro do importador aponta a
  aba antes de apontar a coluna.

---

## Em aberto

| Assunto | Situação |
|---|---|
| Produto Padrão do grupo | não existe coluna no layout. Se a importação não estiver preenchendo sozinha, é pelo PRDFM009 (campo *Produto Padrão*, código reduzido, Tab, F3). Grupo ligado a promoção bloqueia a troca. |
| Tamanho `XGG` × `XG` na grade 8 | a grade 8 do TOTVS (TOP) termina em `XG`; o sistema usa `XGG`. Mantido assim por decisão — a peça no maior tamanho não é criada na importação. |
| 350 cores com ⚠ | resolve exportando o PRDFL025 em CSV. |
| Nomes dos níveis | os do sistema vieram de planilha e podem divergir dos do TOTVS (`MANGA CURTA` × `MGA CURTA`). |
| Limpeza no TOTVS | produtos de teste 662068-662071, 662498-662505, 662633-662640 e os grupos `390460` e `130530` criados por engano. |

---

## Onde está o resto da história

- **O código e o motivo de cada mudança**: `git log`. Cada commit explica o problema
  que resolveu, não só o que mudou.
- **A discussão de cada alteração**: os pull requests #1 a #20 no GitHub.
- **Como o sistema funciona hoje**: `README.md`.
- **A garantia de que nada quebrou**: `testes/` — 256 verificações, várias delas
  criadas depois de um erro chegar ao TOTVS.
