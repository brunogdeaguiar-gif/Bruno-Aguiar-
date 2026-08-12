window.addEventListener('load', ()=>setTimeout(()=>{
  const out=[]; const ok=(n,c,e)=>out.push((c?'OK   ':'FALHA')+' | '+n+(e!==undefined?' | '+e:''));
  const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  window.confirm=()=>true; window.alert=m=>out.push('ALERTA| '+String(m).split('\n')[0]);
  HTMLAnchorElement.prototype.click=function(){};
  try{
    ok('cores carregadas', CORES.length===2359, CORES.length);
    ok('origem padrão', coresOrigem==='padrão');
    ok('cores duvidosas marcadas', CORES.filter(c=>c.dub).length===350, CORES.filter(c=>c.dub).length);
    ok('busca por nome acha FUCSIA', !!CORES.find(c=>c.nome==='FUCSIA' && c.cod==='09'));
    ok('acharCor por código', acharCor('09')?.nome==='FUCSIA', acharCor('09')?.nome);
    ok('acharCor inexistente', acharCor('ZZZZZ')===null);

    // abre o seletor da 1a linha e escolhe
    const btn=document.querySelector('#grade-tabela tbody .btn-cor');
    ok('botão de cor renderizado', !!btn);
    btn.click();
    ok('modal abriu', document.getElementById('modal-cor').classList.contains('aberto'));
    filtrarCores('fucsia');
    const itens=document.querySelectorAll('#lista-cores .cor-item');
    ok('busca filtrou', itens.length>=1, itens.length);
    itens[0].click();
    ok('modal fechou', !document.getElementById('modal-cor').classList.contains('aberto'));
    ok('cor gravada com código', gradeForm.linhas[0].corCod==='09' && gradeForm.linhas[0].corNome==='FUCSIA', JSON.stringify(gradeForm.linhas[0]).slice(0,60));
    ok('botão mostra o nome', document.querySelector('#grade-tabela tbody .btn-cor').textContent.includes('FUCSIA'));

    // 2a cor, com código duvidoso
    gradeForm.addCor();
    const dub=CORES.find(c=>c.dub);
    corAlvo=gradeForm.linhas[1]; corCallback=()=>{}; escolherCor(dub.cod, dub.nome);
    ok('2a cor gravada', gradeForm.linhas[1].corCod===dub.cod, dub.cod);

    // preenche quantidades
    const tb=document.querySelector('#grade-tabela tbody');
    [[0,[2,0,0,0,0,0]],[1,[0,3,0,0,0,0]]].forEach(([i,q])=>{
      tb.rows[i].querySelectorAll('.tam-cell input').forEach((inp,k)=>{inp.value=q[k];inp.dispatchEvent(new Event('input'));});
    });
    ok('grade soma 5', gradeForm.total()===5, gradeForm.total());

    set('ped-fornecedor','Teste'); set('segmento','100'); set('secao','150'); set('especie','150450');
    set('ncm','61091000'); set('p-venda','49,90'); set('ref-forn','R1'); set('descricao','Teste');
    document.getElementById('packs-todas').value='1'; aplicarPacksTodas();
    salvarProduto();
    ok('produto salvo', state.produtos.length===1);
    ok('cor persistida no produto', state.produtos[0].grade[0].corCod==='09');

    // CSV
    let csv=''; const OB=window.Blob;
    window.Blob=function(p,o){ if((o||{}).type&&o.type.includes('csv')) csv=p.join(''); return new OB(p,o); };
    exportarCSV(); window.Blob=OB;
    const L=csv.trim().split('\r\n');
    ok('CSV com 64 colunas (sem TP_ITEMSPED)', L[0].split(';').length===64, L[0].split(';').length);
    ok('sem TP_ITEMSPED no cabeçalho', !L[0].includes('TP_ITEMSPED'));
    ok('CD_EMPVALOR1 na 18a coluna', L[0].split(';')[17]==='CD_EMPVALOR1', L[0].split(';')[17]);
    ok('linha com 64 colunas', L[1].split(';').length===64, L[1].split(';').length);
    ok('CD_COR = código 09', L[1].split(';')[10]==='09', L[1].split(';')[10]);
    ok('VL_PRODUTO1 na 21a coluna', L[1].split(';')[20]==='49,90', L[1].split(';')[20]);
    ok('VL_PRODUTO1 alinhado ao cabeçalho', L[0].split(';')[20]==='VL_PRODUTO1', L[0].split(';')[20]);
    ok('CD_GRADE na 10a', L[1].split(';')[9]==='8', L[1].split(';')[9]);
    ok('nenhum ; dentro de campo', L.every(l=>l.split(';').length===64));
    ok('CD_COR alinhado ao cabeçalho', L[0].split(';')[10]==='CD_COR', L[0].split(';')[10]);

    // troca separador decimal
    csvDecimal='.'; csv=''; window.Blob=function(p,o){ if((o||{}).type&&o.type.includes('csv')) csv=p.join(''); return new OB(p,o); };
    exportarCSV(); window.Blob=OB; csvDecimal=',';
    ok('separador ponto funciona', csv.trim().split('\r\n')[1].split(';')[20]==='49.90', csv.trim().split('\r\n')[1].split(';')[20]);

    // importar lista de cores do TOTVS
    const conv=converterExportTotvs('Codigo;Descricao\n"AA";"AZUL TESTE"\nBB;VERDE TESTE\n');
    ok('conversor de export lê 2 linhas', conv.split('\n').length===2, JSON.stringify(conv));
    carregarCores(conv,'importada do TOTVS');
    ok('lista substituída', CORES.length===2 && acharCor('AA').nome==='AZUL TESTE', CORES.length);
    ok('sem dúvida na lista importada', CORES.every(c=>!c.dub));
    carregarCores(CORES_PADRAO,'padrão');
    ok('lista padrão restaurada', CORES.length===2359);

    // aviso na lista quando falta código de cor
    state.produtos[0].grade[0].corCod=''; renderLista();
    ok('lista avisa código de cor faltando', document.getElementById('lista-produtos').textContent.includes('código de cor'));
    state.produtos[0].grade[0].corCod='09'; renderLista();

    // migração de dado antigo (formato com "cor" texto livre)
    const antigo=normalizarProduto({id:9,tipoGrade:'g1',grade:[{cor:'PRETO',tamanhos:{PP:2}}],packs:[1]});
    ok('migração: nome preservado, sem código', antigo.grade[0].corNome==='PRETO' && antigo.grade[0].corCod==='', JSON.stringify(antigo.grade[0]).slice(0,50));

    // PDF não deve quebrar
    let erro=''; try{ exportarPDF(); }catch(e){ erro=e.message; }
    ok('exportarPDF sem exceção', erro==='', erro);
  }catch(e){ out.push('EXCEÇÃO| '+e.message+' @ '+(e.stack||'').split('\n')[1]); }
  const pre=document.createElement('pre'); pre.id='resultado-teste'; pre.textContent=out.join('\n'); document.body.appendChild(pre);
},400));
