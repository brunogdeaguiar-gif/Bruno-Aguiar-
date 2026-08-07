# Cadastro de Produtos — Lojas Emmanuelle

Aplicação de página única (um único arquivo `index.html`) para cadastrar produtos,
montar a grade de tamanhos/cores, distribuir packs por loja e gerar:

- **CSV no layout GERFP096** para importação no TOTVS Moda;
- **PDF de pedido de compras** para enviar ao fornecedor;
- **Backup `.json`** para transferir o pedido entre pessoas/aparelhos.

Não há back-end. Tudo roda no navegador e os dados ficam **no aparelho de quem usa**.

---

## 1. O sistema já está no ar

**Link para compartilhar com o time:**

### https://brunogdeaguiar-gif.github.io/Bruno-Aguiar-/

**A publicação é automática.** O workflow `.github/workflows/pages.yml` republica o
site sozinho a cada alteração na branch `main` — em cerca de 1 minuto o link já
mostra a versão nova, e todos passam a usá-la ao recarregar a página. Não é preciso
mexer em **Settings → Pages**: o próprio workflow liga e configura o Pages
(`actions/configure-pages` com `enablement: true`).

Para publicar manualmente sem alterar nada, use a aba **Actions** → *Publicar site* →
**Run workflow**.

> O repositório é público — necessário para o GitHub Pages gratuito. Isso significa
> que o código, a lista de lojas e os códigos de classificação ficam visíveis na
> internet. Se um dia isso precisar mudar, as alternativas são um plano pago do
> GitHub ou hospedar em outro serviço (a Netlify hospeda de graça sem expor o
> código-fonte).

### Recomende ao time (importante)

- **Adicionar à tela de início**: no navegador do celular, menu → *Adicionar à tela
  de início*. O acesso vira um ícone, como um app.
- **Os dados são locais**: o que a Maria cadastra no celular dela **não aparece** no
  seu. Para passar um pedido adiante, use **Baixar backup (.json)** e a outra pessoa
  usa **Restaurar backup (.json)**.
- **Não use aba anônima** — os dados somem ao fechar.
- Ao terminar um pedido, gere o CSV/PDF **e** baixe o backup. O iOS pode apagar o
  armazenamento de sites não visitados por ~7 dias.
- A geração de **PDF exige internet** (a biblioteca vem de CDN). Cadastro, CSV e
  backup funcionam offline.

---

## 2. Como manter / alterar

Tudo que muda com frequência está no topo do `<script>`, em constantes:

| Constante | O que controla |
|---|---|
| `CFG` | chaves de armazenamento, tamanho/qualidade da foto, separador e decimal do CSV |
| `GRADES` | grades de tamanho e o respectivo `CD_GRADE` do TOTVS |
| `SEGMENTOS`, `SECOES`, `ESPECIES` | classificação em cascata |
| `DEPARTAMENTOS` | departamentos com o código do TOTVS (3 dígitos, `001` a `007`) |
| `MARCAS`, `ESTACOES` | opções dos selects — ainda **sem** o código do TOTVS |
| `LOJAS` | código e nome das lojas da distribuição |

Depois de alterar o `index.html` e enviar para a `main`, o site se atualiza sozinho.

Para incluir uma loja nova, basta acrescentar uma linha em `LOJAS` — a tela, os
totais, o PDF e o backup se ajustam sozinhos.

Se a importação do TOTVS reclamar do separador decimal, troque `CFG.csvDecimal`
de `','` para `'.'`.

---

## 3. O que foi revisado e corrigido nesta versão

### Bugs

1. **Grade sumia depois de salvar** — o formulário era limpo com a lista de cores
   zerada, obrigando a clicar em "Adicionar cor" antes de cada novo produto.
2. **Dupla rotação de fotos** — a correção manual de EXIF era aplicada por cima da
   rotação que os navegadores modernos já fazem, deixando fotos de celular deitadas.
   Agora usa `createImageBitmap({imageOrientation:'from-image'})`, com fallback.
3. **Foto HEIC (iPhone) falhava em silêncio** — nada acontecia ao selecionar.
   Agora há mensagem explicando o formato não suportado.
4. **Leitura de EXIF podia estourar** em arquivo malformado e derrubar o carregamento.
5. **CSV podia sair com colunas desalinhadas** — um `;` ou uma quebra de linha na
   descrição/observação/cor quebrava a linha inteira do arquivo. Campos agora são
   higienizados.
6. **Preço com vírgula era descartado** — `<input type="number">` devolve vazio para
   `19,90` em alguns navegadores. Os campos de dinheiro agora aceitam `19,90`,
   `1.299,50` ou `1299.50` e são reformatados ao sair do campo.
7. **`especieNome` levava o código junto** (`"150450 - SOUTIEN CLASSICO"`), poluindo
   `DS_GRUPO1` e `DS_PRODUTO` no CSV. Código e nome agora são separados.
8. **Dados do pedido saíam do produto errado** — PDF e nome do arquivo liam sempre
   `produtos[0]`, mesmo que o fornecedor tivesse sido alterado depois. Os dados do
   pedido passaram a ser um objeto único do pedido, não uma cópia por produto.
9. **PDF: quebra de página estimada errado** — produtos com muitas cores ou
   observações longas invadiam o rodapé ou a página seguinte. A altura do bloco
   agora é calculada a partir do conteúdo real (`splitTextToSize` + nº de linhas).
10. **PDF: barra de destaque com a cor errada** — `setDrawColor` seguido de
    `rect(...,'F')` pinta com a cor de preenchimento anterior; trocado por `setFillColor`.
11. **PDF: texto longo era desenhado por cima do bloco seguinte** (sem quebra real).
12. **PDF sem tratamento de falha do CDN** — se a biblioteca não carregasse, o clique
    lançava exceção sem explicação. Agora avisa e o resto do sistema continua.
13. **Totais recalculados a partir de campos salvos** — `pecasPorPack`/`totPecas` eram
    gravados no produto e podiam ficar dessincronizados. Agora são sempre derivados.

### Segurança

14. **Injeção de HTML (XSS)** na lista de produtos e na tabela de grade: nomes de
    fornecedor, referência e cor eram concatenados direto em `innerHTML`. Uma aspa
    no nome da cor quebrava o atributo e podia executar script. Agora tudo é
    escapado (`esc()`) e a grade é construída por DOM, sem `innerHTML`.
15. **CSV injection** — campo iniciado por `=`, `+` ou `@` vira fórmula ao abrir no
    Excel. O caractere inicial é removido na exportação.

### Perda de dados

16. **Nada era persistido** — recarregar a página, receber uma ligação ou o navegador
    reciclar a aba apagava o pedido inteiro. Agora há salvamento automático em
    `localStorage`, inclusive do produto em digitação, com restauração ao abrir.
17. **Sem tratamento de cota** — fotos em base64 estouram o limite de ~5 MB. Agora o
    erro é capturado e o usuário é orientado a exportar/baixar o backup.
18. **Sem backup/transferência** — incluídos exportar e restaurar `.json`, com
    normalização defensiva (arquivo corrompido ou de versão antiga não quebra a tela).
19. **Fotos pesadas demais** — reduzidas para 1000 px / qualidade 0,78, o que cabe
    bem mais produto no armazenamento sem perda visível no PDF (a foto sai a 42 mm).

### Validação

20. NCM aceitava qualquer coisa: agora só dígitos, máximo 8, com aviso visual.
21. Datas de faturamento podiam ficar invertidas: agora há aviso.
22. Produto podia ser salvo com grade zerada, sem loja, com cor sem nome ou com
    referência repetida: agora há um resumo de avisos antes de confirmar.
23. Nome da cor podia passar de 10 caracteres e era truncado silenciosamente no CSV.
24. O CSV agora avisa também sobre cor sem nome e produto com grade zerada, e não
    gera arquivo vazio sem explicar o motivo.

### Usabilidade

25. **Edição limitada** — o modal antigo não deixava alterar grade nem distribuição
    ("remova e recadastre"). O modal foi removido e a edição passou a usar o próprio
    formulário, com todos os campos editáveis e um aviso de "Editando: ...".
    Isso também eliminou a duplicação dos selects de marca/estação em dois lugares.
26. Adicionados: **duplicar produto**, **remover cor**, **aplicar packs a todas as
    lojas** e **resumo do pedido** (produtos/packs/peças) na aba Pedido.
27. A lista marca com etiqueta vermelha o produto a que falta NCM, preço de venda
    ou código de grade — dá para ver o que trava a importação antes de exportar.
28. Descrição e observação passaram a sair no PDF; o cabeçalho do PDF ganhou prazo,
    frete e comissão; o rodapé ganhou valor de compra estimado e numeração de páginas.
29. Campos numéricos não mudam mais de valor com o scroll do mouse.
30. Confirmações de exclusão passaram a dizer *o que* será apagado.

### Acessibilidade e front-end

31. `maximum-scale=1.0` bloqueava o zoom no celular — removido.
32. `<label>` sem `for`, botões de ícone sem nome acessível, abas sem `role`/
    `aria-selected` — corrigidos.
33. Fonte de ícones inteira (Tabler, via CDN) trocada por um sprite SVG embutido:
    menos uma dependência externa, e os ícones aparecem mesmo sem internet.
34. Campos de texto passaram para 15 px — abaixo de 16 px o iOS dá zoom automático
    ao focar; 15 px com o layout atual evita o efeito na maioria dos aparelhos.
35. `top: 62px` fixo nas abas quebrava se o cabeçalho mudasse de altura — agora é
    medido em tempo de execução.
36. Salvamento automático separado em duas chaves: o rascunho (pequeno) é reescrito
    a cada tecla; a lista de produtos com fotos (grande) só quando muda de verdade.

---

## 4. Importação no TOTVS (GERFP096)

O CSV segue o documento *Layout para Importação de Produto*, separado por `;`, com uma
primeira linha de cabeçalho e sem `;` dentro de nenhum campo.

> **Atenção — o manual está à frente da versão instalada.** O documento descreve 31 campos,
> incluindo `TP_ITEMSPED` na 18ª posição. A versão do TOTVS em uso **não tem esse campo**:
> enviá-lo derruba o arquivo inteiro com
> `ORA-00904: "TP_ITEMSPED": identificador inválido` — o importador monta o SQL a partir dos
> nomes do cabeçalho, então um nome desconhecido invalida todas as linhas.
> Por isso o arquivo sai com **30 colunas**, sem `TP_ITEMSPED`.
> Quando o TOTVS for atualizado e o campo aparecer no botão **Exportar layout** do GERFP096,
> basta trocar `CFG.usarTpItemSped` para `true`.

### Cores — a causa da primeira falha de importação

`CD_COR` exige o **código** cadastrado no PRDFL025, não o nome da cor. O sistema por isso
não deixa mais digitar a cor livremente: escolhe-se numa lista de cores reais e o CSV leva
o código, enquanto a tela e o PDF do fornecedor mostram o nome.

A lista embutida foi extraída do relatório PRDR075 em PDF e tem **2.359 cores**. Desse
total, **350 estão marcadas com ⚠**: o relatório corta a coluna *Codigo* em 8 caracteres,
então códigos longos aparecem incompletos (`VERDMUS(` em vez do código real de VERDE MUSGO).

**Recomendação:** exporte o PRDFL025 em CSV/Excel direto do TOTVS e carregue em
*Pedido → Atualizar lista de cores* (1ª coluna código, 2ª descrição). Isso elimina o
truncamento, e a lista passa a se manter atualizada sem depender de alteração no sistema.

### Valores fixos que precisam existir no seu TOTVS

Ficam na constante `CFG`, no topo do `<script>`:

| Campo | Valor | Componente onde precisa existir |
|---|---|---|
| `CD_MASCARA` | `1` | PRDFM018 |
| `CD_ESPECIE` | `PC` | PRDFL005 |
| `CD_CST` | `2` | — |
| `CD_EMPVALOR1` | `999` | empresa |
| `TP_VALOR1` / `CD_VALOR1` | `P` / `1` | PRDFL003 |
| `CD_GRADE` | por grade (8, 9, 22, 1, 12, 33, 36, 118, 97) | PRDFM008 |
| `CD_NCM` | digitado por produto | FISFL008 |
| `TP_ITEMSPED` | vazio (opcional) | — `00` = mercadoria para revenda |
| `CD_CAMPOADIC1` | vazio | PRDFL107 — se preenchido, leva a ref. do fornecedor em `DS_CAMPOADIC1` |

### Separador decimal

O layout não diz se `VL_PRODUTO1` usa vírgula ou ponto. Há um seletor em
*Pedido → Importação no TOTVS*; se o TOTVS recusar o valor, troque e gere de novo.

### Fornecedor

`NR_CNPJFORNECEDOR` vincula o produto ao fornecedor (visível no PRDFM310). O CNPJ é
digitado em *Dados do pedido*, validado pelos dígitos verificadores e enviado só com
os números. O fornecedor precisa já existir como pessoa no TOTVS com esse mesmo CNPJ.

### Níveis do grupo (máscara do PRDFM018)

A máscara tem 6 níveis, e cada um vai num `CD_GRUPO`/`DS_GRUPO` próprio.
O nível usa o **código curto**, não o composto: a espécie 130530 entra como `530`.

| Nível | Campo | Origem | Exemplo |
|---|---|---|---|
| 1 SEGMENTO | `CD_GRUPO1` | Segmento | `100` FEMININO |
| 2 SECAO | `CD_GRUPO2` | Seção | `130` CALCA |
| 3 ESPECIE | `CD_GRUPO3` | Espécie (3 últimos dígitos) | `530` MACACAO CURTO |
| 4 DEPARTAMENTO | `CD_GRUPO4` | — ainda vazio | |
| 5 DESCRICAO | `CD_GRUPO5` | — ainda vazio | |
| 6 REFERENCIA | `CD_GRUPO6` | — ainda vazio | |

Antes desta correção o sistema mandava o código composto (`130530`) no `CD_GRUPO1`,
e o TOTVS registrava tudo amontoado num nível só.

### Valores (PRDFL003)

O layout aceita até 12 conjuntos `CD_EMPVALOR`/`TP_VALOR`/`CD_VALOR`/`VL_PRODUTO`.
São enviados três, todos na empresa 999:

| Conjunto | Tipo | Código | Origem |
|---|---|---|---|
| 1 | `P` Preço | 1 — VENDA | P. Venda |
| 2 | `C` Custo | 2 — ULTIMA COMPRA | P. Compra |
| 3 | `C` Custo | 7 — CUSTO NEGOCIADO | P. Compra |

Sem P. Compra preenchido, os conjuntos 2 e 3 saem inteiramente vazios — mandar só
parte deles faria o TOTVS reclamar de valor obrigatório em branco. A exportação avisa.

O `TP_VALOR` de custo (`C`) foi deduzido da coluna "Tipo" do PRDFM236; se o TOTVS
recusar, é o primeiro lugar a conferir (`CFG.tpValorCusto`).

### Ainda não implementado

Apurado conferindo um produto importado no TOTVS — o cadastro entra, mas incompleto:

| Falta | Campos do layout | O que falta descobrir |
|---|---|---|
| Níveis 4 (DEPARTAMENTO), 5 (DESCRICAO) e 6 (REFERENCIA) da máscara | `CD_GRUPO4..6` / `DS_GRUPO4..6` | saem vazios; o código do **nível** pode diferir do da **classificação**, e isso ainda não foi confirmado no TOTVS. Basta preencher `origem` em `CFG.niveisGrupo` |
| Classificações (PRDFM308: tipos 100 SEGMENTO, 101 SECAO, 102 ESPECIE, 103 DEPARTAMENTO, 105 MARCA, 106 ESTACAO) | `IN_CADASTRARCLAS`, `CD_TIPOCLAS1..`, `CD_CLASSIFICACAO1..` | os códigos de classificação do PRDFL012 para cada marca, estação, departamento etc. |

### O que o CSV não cobre

O GERFP096 é layout de **cadastro de produto**. As quantidades por loja não entram nele —
ficam no PDF do fornecedor e no backup `.json`.

## 5. Limitações conhecidas (não são bugs)

- **Um pedido por navegador.** Não há histórico de pedidos nem acesso simultâneo de
  duas pessoas ao mesmo pedido. Se isso virar necessidade, o próximo passo é um
  back-end (Supabase/Firebase resolvem bem esse porte).
- **Sem login.** Quem tiver o link usa.
- O CSV cobre o cadastro de produto (GERFP096). **Quantidades por loja não vão no
  CSV** — elas existem no PDF e no backup. O GERFP096 é layout de cadastro, não de
  pedido de compra.
- Um único produto com mais de ~20 cores pode fazer a tabela de grade quebrar entre
  páginas no PDF, ficando desalinhada da tabela de lojas ao lado.
