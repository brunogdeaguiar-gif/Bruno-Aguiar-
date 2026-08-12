/* Classificações (PRDFM308), marca, estação e nome fantasia */
window.addEventListener('load', () => setTimeout(() => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? 'OK   ' : 'FALHA') + ' | ' + n + (e !== undefined ? ' | ' + e : ''));
  const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); };
  window.confirm = () => true;
  window.alert = (m) => out.push('ALERTA| ' + String(m).split('\n')[0]);
  HTMLAnchorElement.prototype.click = function(){};

  const gerar = () => {
    let csv = '';
    const OB = window.Blob;
    window.Blob = function(p, o){ if ((o||{}).type && o.type.includes('csv')) csv = p.join(''); return new OB(p, o); };
    exportarCSV();
    window.Blob = OB;
    const L = csv.trim().split('\r\n');
    const cab = L[0].split(';'), v = L[1].split(';');
    return {L, cab, g: (n) => v[cab.indexOf(n)]};
  };

  try {
    // ---- listas de referência
    ok('8 marcas com código de 3 dígitos', MARCAS.length === 8 && MARCAS.every(m => /^\d{3}$/.test(m.cod)),
       MARCAS.map(m => m.cod).join(','));
    ok('001 = ALTERNATIVA', nomeMarca('001') === 'ALTERNATIVA', nomeMarca('001'));
    ok('26 estações do TOTVS', ESTACOES.length === 26, ESTACOES.length);
    ok('019 = 20 VERAO 2025/2026', nomeEstacao('019') === '20 VERAO 2025/2026', nomeEstacao('019'));
    ok('estação mais nova primeiro', ESTACOES[0].cod === '026', ESTACOES[0].cod);
    ok('607 nomes fantasia', NOMES_FANTASIA.length === 607, NOMES_FANTASIA.length);
    ok('nome fantasia 56680 = PLANNER', acharNomeFantasia('56680')?.nome === 'PLANNER', acharNomeFantasia('56680')?.nome);
    ok('contador na tela', document.getElementById('qtd-nomesfant').textContent === '607');

    // ---- seletor de nome fantasia
    abrirSeletorNomeFant();
    ok('modal abriu', document.getElementById('modal-nomefant').classList.contains('aberto'));
    listaNomeFantasia.filtrar('planner');
    const item = document.querySelector('#lista-nomesfant .cor-item');
    ok('busca acha PLANNER', item.querySelector('.cor-item-nome').textContent === 'PLANNER');
    item.click();
    ok('modal fechou', !document.getElementById('modal-nomefant').classList.contains('aberto'));
    ok('gravou nome e código',
       document.getElementById('nome-fantasia').value === 'PLANNER' &&
       document.getElementById('nome-fantasia-cod').value === '56680',
       document.getElementById('nome-fantasia').value + '/' + document.getElementById('nome-fantasia-cod').value);
    ok('botão mostra o nome', document.getElementById('btn-nomefant-txt').textContent === 'PLANNER');

    // ---- produto completo, igual ao print do PRDFM308
    set('ped-fornecedor','T');
    set('segmento','200'); set('secao','300'); set('especie','300410');
    set('departamento','001'); set('ref-forn','P1422'); set('ncm','61091000');
    set('marca','001'); set('estacao','019');
    set('p-compra','17,50'); set('p-venda','39,90');
    document.getElementById('p-venda').dispatchEvent(new Event('blur'));
    definirDescricao('0030','BASICA');
    gradeForm.linhas[0].corCod = 'CAF'; gradeForm.linhas[0].corNome = 'CAFE';
    gradeForm.render();
    document.querySelectorAll('#grade-tabela tbody .tam-cell input').forEach((i,k) => {
      if (k === 1) { i.value = 2; i.dispatchEvent(new Event('input')); }
    });
    document.getElementById('packs-todas').value = '1'; aplicarPacksTodas();
    salvarProduto();
    ok('produto salvo', state.produtos.length === 1, state.produtos.length);

    const p = state.produtos[0];
    ok('marca guardada como código', p.marca === '001' && p.marcaNome === 'ALTERNATIVA', p.marca + '/' + p.marcaNome);
    ok('estação guardada como código', p.estacao === '019' && p.estacaoNome === '20 VERAO 2025/2026', p.estacao);
    ok('nome fantasia guardado', p.nomeFantasiaCod === '56680' && p.nomeFantasia === 'PLANNER', p.nomeFantasiaCod);

    // ---- padrão: as 9 (o TOTVS daqui aceitou)
    ok('padrão são as 9 classificações', csvMaxClassif === 9, csvMaxClassif);
    csvMaxClassif = 3;
    let r = gerar();
    ok('IN_CADASTRARCLAS = T', r.g('IN_CADASTRARCLAS') === 'T', r.g('IN_CADASTRARCLAS'));
    ok('1ª classificação = 105 MARCA', r.g('CD_TIPOCLAS1') === '105' && r.g('CD_CLASSIFICACAO1') === '001',
       r.g('CD_TIPOCLAS1') + '/' + r.g('CD_CLASSIFICACAO1'));
    ok('2ª = 106 ESTACAO', r.g('CD_TIPOCLAS2') === '106' && r.g('CD_CLASSIFICACAO2') === '019',
       r.g('CD_TIPOCLAS2') + '/' + r.g('CD_CLASSIFICACAO2'));
    ok('3ª = 107 NOME FANTASIA', r.g('CD_TIPOCLAS3') === '107' && r.g('CD_CLASSIFICACAO3') === '56680',
       r.g('CD_TIPOCLAS3') + '/' + r.g('CD_CLASSIFICACAO3'));
    ok('não gera CD_TIPOCLAS4 com o limite em 3', r.cab.indexOf('CD_TIPOCLAS4') === -1);
    ok('todas as linhas com o mesmo nº de colunas', new Set(r.L.map(l => l.split(';').length)).size === 1, r.cab.length);

    // ---- com as 9
    csvMaxClassif = 9;
    r = gerar();
    ok('IN_CADASTRARCLAS continua T', r.g('IN_CADASTRARCLAS') === 'T');
    ok('9 conjuntos no cabeçalho', r.cab.indexOf('CD_TIPOCLAS9') !== -1 && r.cab.indexOf('CD_TIPOCLAS10') === -1);
    ok('4ª = 100 SEGMENTO 200', r.g('CD_TIPOCLAS4') === '100' && r.g('CD_CLASSIFICACAO4') === '200',
       r.g('CD_TIPOCLAS4') + '/' + r.g('CD_CLASSIFICACAO4'));
    ok('5ª = 101 SECAO 300', r.g('CD_TIPOCLAS5') === '101' && r.g('CD_CLASSIFICACAO5') === '300');
    ok('6ª = 102 ESPECIE com código completo 300410',
       r.g('CD_TIPOCLAS6') === '102' && r.g('CD_CLASSIFICACAO6') === '300410', r.g('CD_CLASSIFICACAO6'));
    ok('7ª = 103 DEPARTAMENTO 001', r.g('CD_TIPOCLAS7') === '103' && r.g('CD_CLASSIFICACAO7') === '001');
    ok('8ª = 200 INTEGRACAO DW fixo 001', r.g('CD_TIPOCLAS8') === '200' && r.g('CD_CLASSIFICACAO8') === '001');
    ok('9ª = 1007 CLASS EMPRESA fixo 02', r.g('CD_TIPOCLAS9') === '1007' && r.g('CD_CLASSIFICACAO9') === '02');
    ok('linhas continuam alinhadas', new Set(r.L.map(l => l.split(';').length)).size === 1, r.cab.length);
    ok('nenhum ; dentro de campo', r.L.every(l => l.split(';').length === r.cab.length));

    // ---- produto sem marca/estação/nome fantasia: as classificações somem, sem buraco
    const semNada = classificacoesDoProduto({...p, marca:'', estacao:'', nomeFantasiaCod:''});
    ok('sem marca/estação/nome sobram 6', semNada.length === 6, semNada.map(c => c.tipo).join(','));
    ok('a 1ª passa a ser o segmento', semNada[0].tipo === '100', semNada[0].tipo);
    const vazio = classificacoesDoProduto({});
    ok('produto vazio manda só as fixas', vazio.length === 2 && vazio[0].tipo === '200', vazio.map(c => c.tipo).join(','));

    // ---- migração de versões antigas
    const antigo = normalizarProduto({id:1, marca:'ATRIUM', estacao:'VERÃO 26'});
    ok('marca por nome vira código', antigo.marca === '003' && antigo.marcaNome === 'ATRIUM', antigo.marca);
    ok('estação antiga é descartada', antigo.estacao === '', JSON.stringify(antigo.estacao));
    const jaCodigo = normalizarProduto({id:2, marca:'005', estacao:'019'});
    ok('código já válido é preservado', jaCodigo.marca === '005' && jaCodigo.estacao === '019');
    ok('nome da estação recalculado', jaCodigo.estacaoNome === '20 VERAO 2025/2026', jaCodigo.estacaoNome);

    // ---- edição recarrega tudo
    const id = state.produtos[0].id;
    limparFormProduto();
    ok('form limpo zera o nome fantasia', document.getElementById('btn-nomefant').classList.contains('vazio'));
    editarProduto(id);
    ok('edição recarrega marca', document.getElementById('marca').value === '001');
    ok('edição recarrega estação', document.getElementById('estacao').value === '019');
    ok('edição recarrega nome fantasia', document.getElementById('btn-nomefant-txt').textContent === 'PLANNER');

  } catch (e) {
    out.push('EXCEÇÃO| ' + e.message + ' @ ' + (e.stack||'').split('\n')[1]);
  }

  const pre = document.createElement('pre');
  pre.id = 'resultado-teste';
  pre.textContent = out.join('\n');
  document.body.appendChild(pre);
}, 300));
