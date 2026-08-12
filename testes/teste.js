/* Harness de teste: injetado após o app carregar. Resultados vão para #resultado-teste */
window.addEventListener('load', () => setTimeout(() => {
  const out = [];
  const ok = (nome, cond, extra) => out.push((cond ? 'OK   ' : 'FALHA') + ' | ' + nome + (extra ? ' | ' + extra : ''));

  // captura downloads
  const baixados = [];
  const origCreate = URL.createObjectURL;
  URL.createObjectURL = (b) => { baixados.push(b); return origCreate.call(URL, b); };
  HTMLAnchorElement.prototype.click = function(){ /* não navega */ };

  const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); };

  try {
    // ---- pedido
    set('ped-fornecedor','Malharia São José & Cia; Ltda');
    set('ped-dt-ini','2026-03-01'); set('ped-dt-fim','2026-02-01');
    ok('data invertida detectada', document.getElementById('erro-datas').classList.contains('on'));
    set('ped-dt-fim','2026-04-01');
    ok('data válida limpa o erro', !document.getElementById('erro-datas').classList.contains('on'));
    set('ped-prazo','30'); set('ped-frete','CIF'); set('ped-materia','MALHA');

    // ---- classificação em cascata
    set('segmento','100');
    ok('seções carregadas (16 + placeholder)', document.getElementById('secao').options.length === 17, document.getElementById('secao').options.length);
    set('secao','150');
    ok('espécies carregadas', document.getElementById('especie').options.length >= 11, document.getElementById('especie').options.length);
    set('especie','150450');
    set('departamento','JOVEM');
    set('descricao','Soutien com renda; e bojo\ncom detalhe');

    // ---- produto
    set('ref-forn','A-100');
    set('ncm','61.09.10-abc00');
    ok('NCM higienizado p/ 8 dígitos', document.getElementById('ncm').value === '61091000', document.getElementById('ncm').value);
    set('marca','ATRIUM'); set('estacao','VERÃO 26');
    set('p-compra','19,90'); set('p-venda','R$ 1.299,50');
    document.getElementById('p-compra').dispatchEvent(new Event('blur'));
    document.getElementById('p-venda').dispatchEvent(new Event('blur'));
    ok('markup calculado com vírgula', document.getElementById('markup').value === '65.30x', document.getElementById('markup').value);
    ok('moeda reformatada', document.getElementById('p-venda').value === '1.299,50', document.getElementById('p-venda').value);
    set('observacao','Entrega parcelada');

    // ---- grade
    const tbody = document.querySelector('#grade-tabela tbody');
    const preencher = (linha, cor, qtds) => {
      const tr = tbody.rows[linha];
      const alvo = gradeForm.linhas[linha];
      alvo.corCod = cor.substring(0,10); alvo.corNome = cor;
      tr.querySelectorAll('.tam-cell input').forEach((i,k) => { i.value = qtds[k] ?? 0; i.dispatchEvent(new Event('input')); });
    };
    preencher(0,'PRETO',[1,2,3,2,1,0]);
    gradeForm.addCor();
    preencher(1,'VERMELHOMUITOLONGO',[0,1,1,1,0,0]);
    ok('código de cor limitado a 10', gradeForm.linhas[1].corCod.length <= 10, gradeForm.linhas[1].corCod);
    ok('peças por pack = 12', document.getElementById('pecas-pack-display').textContent === '12 peças', document.getElementById('pecas-pack-display').textContent);
    ok('total da linha 0 = 9', tbody.rows[0].querySelector('.total-col').textContent === '9');

    // troca de grade mantendo quantidades compatíveis
    const antes = gradeForm.total();
    set('grade-tipo-select','g2');
    ok('troca de grade não quebra', gradeForm.tamanhos.length === 8 && gradeForm.linhas.length === 2, gradeForm.total());
    set('grade-tipo-select','g1');
    ok('volta p/ g1 mantém estrutura', gradeForm.tamanhos.length === 6);
    // repõe quantidades (zeradas na troca)
    preencher(0,'PRETO',[1,2,3,2,1,0]);
    preencher(1,'VERMELHO',[0,1,1,1,0,0]);
    ok('grade repreenchida = 12', gradeForm.total() === 12, gradeForm.total());

    // ---- lojas
    document.getElementById('packs-todas').value = '2';
    aplicarPacksTodas();
    ok('total packs = 18', document.getElementById('tot-packs').textContent === '18', document.getElementById('tot-packs').textContent);
    ok('total peças = 216', document.getElementById('tot-pecas').textContent === '216', document.getElementById('tot-pecas').textContent);

    // ---- salvar
    window.confirm = () => true;
    window.alert = (m) => out.push('ALERTA| ' + String(m).split('\n')[0]);
    salvarProduto();
    ok('1 produto salvo', state.produtos.length === 1);
    ok('nome da espécie sem código', /SOUTIEN/.test(state.produtos[0].especieNome), state.produtos[0].especieNome);
    ok('form limpo após salvar', document.getElementById('ref-forn').value === '' && gradeForm.total() === 0);
    ok('grade volta com 1 linha vazia', gradeForm.linhas.length === 1);
    ok('fornecedor preservado', document.getElementById('ped-fornecedor').value.startsWith('Malharia'));

    // ---- lista + XSS
    renderLista();
    const lista = document.getElementById('lista-produtos');
    state.produtos[0].refForn = 'X"><b>hack</b>'; renderLista();
    ok('sem injeção de HTML na lista', lista.querySelector('b') === null);
    state.produtos[0].refForn = 'A-100';
    ok('resumo mostra 216 peças', document.getElementById('res-pecas').textContent === '216', document.getElementById('res-pecas').textContent);

    // ---- editar
    const id = state.produtos[0].id;
    editarProduto(id);
    ok('modo edição ligado', document.getElementById('banner-edicao').style.display === 'block');
    ok('grade recarregada na edição', gradeForm.total() === 12, gradeForm.total());
    ok('packs recarregados', document.getElementById('tot-packs').textContent === '18');
    ok('preço recarregado', document.getElementById('p-venda').value === '1.299,50', document.getElementById('p-venda').value);
    set('ref-forn','A-100-EDIT');
    salvarProduto();
    ok('edição não duplicou produto', state.produtos.length === 1 && state.produtos[0].refForn === 'A-100-EDIT', state.produtos.length);

    // ---- duplicar / remover
    duplicarProduto(state.produtos[0].id);
    ok('produto duplicado', state.produtos.length === 2 && state.produtos[1].id !== state.produtos[0].id);
    removerProduto(state.produtos[1].id);
    ok('produto removido', state.produtos.length === 1);

    // ---- CSV
    const linhasEsperadas = 8; // 5 tamanhos usados na cor 1 + 3 na cor 2
    let csvTexto = '';
    const origBlob = window.Blob;
    window.Blob = function(partes, opts){ if ((opts||{}).type && opts.type.includes('csv')) csvTexto = partes.join(''); return new origBlob(partes, opts); };
    exportarCSV();
    window.Blob = origBlob;
    const linhasCsv = csvTexto.trim().split('\r\n');
    ok('CSV tem cabeçalho + 8 linhas', linhasCsv.length === linhasEsperadas + 1, linhasCsv.length);
    ok('CSV com 64 colunas (30 + custo)', linhasCsv[0].split(';').length === 64, linhasCsv[0].split(';').length);
    ok('linha com 64 colunas', linhasCsv[1].split(';').length === 64, linhasCsv[1].split(';').length);
    ok('CSV sem separador dentro do campo', linhasCsv[1].split(';').length === linhasCsv[2].split(';').length);
    ok('CSV com decimal vírgula', /;1299,50;/.test(linhasCsv[1]), linhasCsv[1].slice(0,80));
    ok('CSV sem quebra de linha na descrição', !/\n/.test(linhasCsv[1]));
    ok('CD_GRADE na 10a coluna', linhasCsv[1].split(';')[9] === '8', linhasCsv[1].split(';')[9]);
    ok('CD_COR = código escolhido', linhasCsv[1].split(';')[10] === 'PRETO', linhasCsv[1].split(';')[10]);
    ok('DS_CAMPOADIC1 vazio sem CD_CAMPOADIC1', linhasCsv[1].split(';')[29] === '', JSON.stringify(linhasCsv[1].split(';')[29]));

    // ---- persistência
    persistirAgora();
    const salvo = JSON.parse(localStorage.getItem('emmanuelle_cadastro_v2'));
    const rasc = JSON.parse(localStorage.getItem('emmanuelle_rascunho_v2'));
    ok('localStorage gravado', salvo && salvo.produtos.length === 1);
    ok('rascunho gravado em chave própria', !!rasc);

    // ---- backup json
    let jsonTexto = '';
    window.Blob = function(partes, opts){ if ((opts||{}).type && opts.type.includes('json')) jsonTexto = partes.join(''); return new origBlob(partes, opts); };
    exportarBackup();
    window.Blob = origBlob;
    const bk = JSON.parse(jsonTexto);
    ok('backup com 1 produto', bk.produtos.length === 1);

    // ---- restauração de dados corrompidos
    const p = normalizarProduto({id:'x', tipoGrade:'inexistente', grade:[{cor:null, tamanhos:{PP:'3'}}], lojas:[{packs:'4'}]});
    ok('normalização de produto corrompido', p.tipoGrade === 'g1' && p.grade[0].tam.PP === 3 && p.packs[0] === 4, JSON.stringify(p.packs));

    // ---- PDF (só verifica que não lança)
    let erroPdf = '';
    try { exportarPDF(); } catch (e) { erroPdf = e.message; }
    ok('exportarPDF sem exceção', erroPdf === '', erroPdf);

  } catch (e) {
    out.push('EXCEÇÃO| ' + e.message + ' @ ' + (e.stack||'').split('\n')[1]);
  }

  const div = document.createElement('pre');
  div.id = 'resultado-teste';
  div.textContent = out.join('\n');
  document.body.appendChild(div);
}, 300));
