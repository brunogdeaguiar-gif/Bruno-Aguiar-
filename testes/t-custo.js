window.addEventListener('load', ()=>setTimeout(()=>{
  const out=[]; const ok=(n,c,e)=>out.push((c?'OK   ':'FALHA')+' | '+n+(e!==undefined?' | '+e:''));
  const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  window.confirm=()=>true; window.alert=m=>out.push('ALERTA| '+String(m).split('\n')[0]);
  HTMLAnchorElement.prototype.click=function(){};
  const gerar=()=>{ let csv=''; const OB=window.Blob;
    window.Blob=function(p,o){ if((o||{}).type&&o.type.includes('csv')) csv=p.join(''); return new OB(p,o); };
    exportarCSV(); window.Blob=OB; return csv.trim().split('\r\n'); };
  try{
    set('ped-fornecedor','Teste'); set('ped-cnpj','11222333000181');
    set('segmento','200'); set('secao','390'); set('especie','390460');
    set('ncm','61034300'); set('p-venda','29,90'); set('p-compra','15,00');
    set('descricao','bermuda dry estampada'); set('grade-tipo-select','g5');
    corAlvo=gradeForm.linhas[0]; corCallback=()=>{}; escolherCor('ST','SORTIDAS');
    document.querySelectorAll('#grade-tabela tbody .tam-cell input').forEach((i,k)=>{ if(k<2){i.value=1;i.dispatchEvent(new Event('input'));} });
    document.getElementById('packs-todas').value='1'; aplicarPacksTodas();
    salvarProduto();

    const L=gerar(); const cab=L[0].split(';'); const v=L[1].split(';');
    const idx=n=>cab.indexOf(n);
    ok('64 colunas (30 + custo + níveis)', cab.length===64, cab.length);
    ok('cabeçalho tem CD_EMPVALOR2', idx('CD_EMPVALOR2')>=0);
    ok('cabeçalho tem VL_PRODUTO3', idx('VL_PRODUTO3')>=0);
    ok('todas as linhas com 64 colunas', L.every(l=>l.split(';').length===64));
    ok('venda: TP_VALOR1=P e CD_VALOR1=1', v[idx('TP_VALOR1')]==='P' && v[idx('CD_VALOR1')]==='1');
    ok('venda: VL_PRODUTO1=29,90', v[idx('VL_PRODUTO1')]==='29,90', v[idx('VL_PRODUTO1')]);
    ok('custo 2: empresa/tipo/código', v[idx('CD_EMPVALOR2')]==='999' && v[idx('TP_VALOR2')]==='C' && v[idx('CD_VALOR2')]==='2',
       [v[idx('CD_EMPVALOR2')],v[idx('TP_VALOR2')],v[idx('CD_VALOR2')]].join('/'));
    ok('custo 2: VL_PRODUTO2=15,00', v[idx('VL_PRODUTO2')]==='15,00', v[idx('VL_PRODUTO2')]);
    ok('custo 7: código 7', v[idx('CD_VALOR3')]==='7', v[idx('CD_VALOR3')]);
    ok('custo 7: mesmo valor', v[idx('VL_PRODUTO3')]==='15,00', v[idx('VL_PRODUTO3')]);

    // sem P. Compra o bloco inteiro sai vazio
    state.produtos[0].pCompra=null;
    const L2=gerar(); const v2=L2[1].split(';');
    ok('sem custo: os 8 campos ficam vazios',
       ['CD_EMPVALOR2','TP_VALOR2','CD_VALOR2','VL_PRODUTO2','CD_EMPVALOR3','TP_VALOR3','CD_VALOR3','VL_PRODUTO3']
         .every(n=>v2[idx(n)]===''));
    ok('sem custo: venda continua preenchida', v2[idx('VL_PRODUTO1')]==='29,90');
    ok('sem custo: ainda 64 colunas', L2.every(l=>l.split(';').length===64));

    // hierarquia oficial
    set('segmento','300');
    ok('infantil com 10 seções', document.getElementById('secao').options.length===11, document.getElementById('secao').options.length);
    ok('seção 689 não existe', ![...document.getElementById('secao').options].some(o=>o.value==='689'));
    set('secao','690'); 
    ok('690 tem JEANS MENINA', [...document.getElementById('especie').options].some(o=>/JEANS MENINA/.test(o.textContent)));
    set('segmento','100'); set('secao','230');
    ok('230 tem CALCA', [...document.getElementById('especie').options].some(o=>o.value==='230410'));
    ok('MACAQUINHO inativo removido', ![...document.getElementById('especie').options].some(o=>/MACAQUINHO/.test(o.textContent)));
  }catch(e){ out.push('EXCEÇÃO| '+e.message+' @ '+(e.stack||'').split('\n')[1]); }
  const pre=document.createElement('pre'); pre.id='resultado-teste'; pre.textContent=out.join('\n'); document.body.appendChild(pre);
},400));
