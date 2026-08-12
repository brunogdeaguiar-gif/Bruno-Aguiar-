/* Seletor da descrição padronizada (nível 5 da máscara) */
window.addEventListener('load', () => setTimeout(() => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? 'OK   ' : 'FALHA') + ' | ' + n + (e !== undefined ? ' | ' + e : ''));
  const set = (id, v) => { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('input',{bubbles:true})); e.dispatchEvent(new Event('change',{bubbles:true})); };
  window.confirm = () => true;
  window.alert = (m) => out.push('ALERTA| ' + String(m).split('\n')[0]);
  HTMLAnchorElement.prototype.click = function(){};

  try {
    // ---- lista carregada
    ok('lista padrão carregada', DESCRICOES.length === 1154, DESCRICOES.length);
    ok('origem padrão', descricoesOrigem === 'padrão', descricoesOrigem);
    ok('todos os códigos com 4 dígitos', DESCRICOES.every(d => /^\d{4}$/.test(d.cod)));
    ok('sem código repetido', new Set(DESCRICOES.map(d => d.cod)).size === DESCRICOES.length);
    ok('ordenada por texto', DESCRICOES[0].nome.localeCompare(DESCRICOES[1].nome, 'pt-BR') <= 0,
       DESCRICOES[0].nome + ' / ' + DESCRICOES[1].nome);
    ok('acharDescricao por código', acharDescricao('0001')?.nome === '1 BOTAO', acharDescricao('0001')?.nome);
    ok('acharDescricao inexistente', acharDescricao('9999') === null);
    ok('contador na tela', document.getElementById('qtd-descricoes').textContent === '1154',
       document.getElementById('qtd-descricoes').textContent);

    // ---- botão começa vazio
    ok('botão começa vazio', document.getElementById('btn-descricao').classList.contains('vazio'));
    ok('código escondido', document.getElementById('btn-descricao-cod').hidden);

    // ---- modal + busca
    abrirSeletorDesc();
    ok('modal abriu', document.getElementById('modal-desc').classList.contains('aberto'));
    filtrarDescricoes('ziper na barra');
    const itens = document.querySelectorAll('#lista-descricoes .cor-item');
    ok('busca por texto acha 1', itens.length === 1, itens.length);
    ok('item mostra o código', itens[0].querySelector('.cor-item-cod').textContent === '1153',
       itens[0].querySelector('.cor-item-cod').textContent);
    filtrarDescricoes('0002');
    ok('busca por código funciona', document.querySelector('#lista-descricoes .cor-item .cor-item-nome').textContent === '1/2 CINTO',
       document.querySelector('#lista-descricoes .cor-item .cor-item-nome').textContent);
    filtrarDescricoes('xxxxnaoexiste');
    ok('busca vazia avisa', document.querySelector('#lista-descricoes .cor-vazio') !== null);
    filtrarDescricoes('');
    ok('limite de 80 itens', document.querySelectorAll('#lista-descricoes .cor-item').length === 80,
       document.querySelectorAll('#lista-descricoes .cor-item').length);

    // ---- escolher preenche código e texto
    filtrarDescricoes('ziper na gola');
    document.querySelector('#lista-descricoes .cor-item').click();
    ok('modal fechou ao escolher', !document.getElementById('modal-desc').classList.contains('aberto'));
    ok('texto gravado', document.getElementById('descricao').value === 'ZIPER NA GOLA', document.getElementById('descricao').value);
    ok('código gravado', document.getElementById('descricao-cod').value === '1154', document.getElementById('descricao-cod').value);
    ok('botão mostra o texto', document.getElementById('btn-descricao-txt').textContent === 'ZIPER NA GOLA');
    ok('botão mostra o código', document.getElementById('btn-descricao-cod').textContent === '1154');
    ok('botão não está mais vazio', !document.getElementById('btn-descricao').classList.contains('vazio'));

    // ---- deixar em branco
    abrirSeletorDesc(); limparDescricao();
    ok('limpar zera texto e código',
       document.getElementById('descricao').value === '' && document.getElementById('descricao-cod').value === '');
    ok('botão volta a vazio', document.getElementById('btn-descricao').classList.contains('vazio'));

    // ---- digitação manual: exige código numérico
    let prompts = [];
    window.prompt = (msg, def) => { prompts.push(msg.split('\n')[0]); return prompts.length === 1 ? 'COISA NOVA' : 'abc0207xyz'; };
    descManual();
    ok('manual perguntou texto e código', prompts.length === 2, prompts.length);
    ok('manual guarda o texto', document.getElementById('descricao').value === 'COISA NOVA', document.getElementById('descricao').value);
    ok('manual limpa letras do código', document.getElementById('descricao-cod').value === '0207', document.getElementById('descricao-cod').value);

    // texto que já existe na lista reaproveita o código, sem perguntar de novo
    prompts = [];
    window.prompt = () => { prompts.push(1); return 'ziper na gola'; };
    descManual();
    ok('texto já padronizado reaproveita o código', document.getElementById('descricao-cod').value === '1154',
       document.getElementById('descricao-cod').value);
    ok('não perguntou o código', prompts.length === 1, prompts.length);

    // código vazio não altera nada
    const antes = document.getElementById('descricao-cod').value;
    prompts = [];
    window.prompt = () => (prompts.push(1), prompts.length === 1 ? 'OUTRA COISA' : '');
    descManual();
    ok('sem código não grava', document.getElementById('descricao-cod').value === antes, document.getElementById('descricao-cod').value);

    // ---- CSV: nível 5 sai com o código de 4 dígitos
    abrirSeletorDesc(); filtrarDescricoes('bolso e capuz bicolor');
    const alvo = document.querySelector('#lista-descricoes .cor-item');
    const textoAlvo = alvo.querySelector('.cor-item-nome').textContent;
    const codAlvo = alvo.querySelector('.cor-item-cod').textContent;
    alvo.click();

    set('ped-fornecedor','T');
    set('segmento','100'); set('secao','130'); set('especie','130530');
    set('departamento','001'); set('ref-forn','46016'); set('ncm','61091000');
    set('p-compra','58,00'); set('p-venda','199,90');
    document.getElementById('p-venda').dispatchEvent(new Event('blur'));
    gradeForm.linhas[0].corCod = 'MR'; gradeForm.linhas[0].corNome = 'MARROM';
    gradeForm.render();
    const tr = document.querySelector('#grade-tabela tbody').rows[0];
    tr.querySelectorAll('.tam-cell input').forEach((i,k) => { i.value = k === 0 ? 3 : 0; i.dispatchEvent(new Event('input')); });
    document.getElementById('packs-todas').value = '1'; aplicarPacksTodas();
    salvarProduto();
    ok('produto salvo', state.produtos.length === 1, state.produtos.length);

    let csv = '';
    const OrigBlob = window.Blob;
    window.Blob = function(p, o){ if ((o||{}).type && o.type.includes('csv')) csv = p.join(''); return new OrigBlob(p, o); };
    exportarCSV();
    window.Blob = OrigBlob;
    const linhas = csv.trim().split('\r\n');
    const cab = linhas[0].split(';'), col = linhas[1].split(';');
    const g = (n) => col[cab.indexOf(n)];
    ok('CD_GRUPO5 = código de 4 dígitos', g('CD_GRUPO5') === codAlvo, g('CD_GRUPO5'));
    ok('DS_GRUPO5 = texto padronizado', g('DS_GRUPO5') === textoAlvo.substring(0,40), g('DS_GRUPO5'));
    ok('nível 6 continua a referência', g('CD_GRUPO6') === '46016', g('CD_GRUPO6'));
    ok('DS_PRODUTO no padrão do PRDFM236', g('DS_PRODUTO') === 'CALCA MACACAO CURTO JOVEM ' + textoAlvo + ' MARROM PP', g('DS_PRODUTO'));
    ok('todas as linhas com 64 colunas', linhas.every(l => l.split(';').length === 64));

    // ---- DS_PRODUTO: limite de 60 e o que é preservado no corte
    const prod = state.produtos[0];
    const curto = montarDsProduto(prod, 'MARROM', 'PP');
    ok('não corta quando cabe', curto.cortou === false && curto.texto.length <= 60, curto.texto.length);
    ok('segmento fora do padrão', !curto.texto.startsWith('FEMININO'), curto.texto);

    const longo = {...prod, descricao: 'BOLSO E CAPUZ BICOLOR COM RECORTE E ZIPER NA GOLA'};
    const cortado = montarDsProduto(longo, 'AZUL MARINHO ESCURO', 'XGG');
    ok('corta e avisa', cortado.cortou === true);
    ok('respeita os 60 caracteres', cortado.texto.length <= 60, cortado.texto.length + ': ' + cortado.texto);
    ok('cor e tamanho preservados no corte', cortado.texto.endsWith('AZUL MARINHO ESCURO XGG'), cortado.texto);
    ok('começa pela seção', cortado.texto.startsWith('CALCA MACACAO CURTO JOVEM'), cortado.texto);

    // sem descrição escolhida, o padrão segue sem buraco
    const semDesc = montarDsProduto({...prod, descricao: ''}, 'PRETO', 'M');
    ok('sem descrição não deixa espaço duplo', !/ {2}/.test(semDesc.texto), semDesc.texto);
    ok('sem descrição = secao+especie+depto+cor+tam',
       semDesc.texto === 'CALCA MACACAO CURTO JOVEM PRETO M', semDesc.texto);

    // ---- edição recarrega o botão
    const id = state.produtos[0].id;
    limparFormProduto();
    ok('form limpo zera o botão', document.getElementById('btn-descricao').classList.contains('vazio'));
    editarProduto(id);
    ok('edição recarrega o texto', document.getElementById('btn-descricao-txt').textContent === textoAlvo,
       document.getElementById('btn-descricao-txt').textContent);
    ok('edição recarrega o código', document.getElementById('descricao-cod').value === codAlvo,
       document.getElementById('descricao-cod').value);

    // ---- rascunho
    persistirAgora();
    const r = JSON.parse(localStorage.getItem('emmanuelle_rascunho_v2'));
    ok('rascunho guarda texto e código', r['descricao'] === textoAlvo && r['descricao-cod'] === codAlvo,
       r['descricao'] + '/' + r['descricao-cod']);

    // ---- troca de lista
    const convertido = converterExportTotvs('CODIGO;DESCRICAO\n0500;TESTE A\n0501;TESTE B', /c[óo]digo|codigo|cd_grupo/i);
    ok('conversor pula o cabeçalho', convertido === '0500\tTESTE A\n0501\tTESTE B', JSON.stringify(convertido));
    carregarDescricoes(convertido, 'importada');
    atualizarStatusDescricoes();
    ok('lista substituída', DESCRICOES.length === 2, DESCRICOES.length);
    ok('contador atualizado', document.getElementById('qtd-descricoes').textContent === '2');
    restaurarDescricoesPadrao();
    ok('lista padrão restaurada', DESCRICOES.length === 1154, DESCRICOES.length);

  } catch (e) {
    out.push('EXCEÇÃO| ' + e.message + ' @ ' + (e.stack||'').split('\n')[1]);
  }

  const pre = document.createElement('pre');
  pre.id = 'resultado-teste';
  pre.textContent = out.join('\n');
  document.body.appendChild(pre);
}, 300));
