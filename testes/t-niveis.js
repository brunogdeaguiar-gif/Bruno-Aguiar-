window.addEventListener('load', ()=>setTimeout(()=>{
  const out=[]; const ok=(n,c,e)=>out.push((c?'OK   ':'FALHA')+' | '+n+(e!==undefined?' | '+e:''));
  const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  window.confirm=()=>true; window.alert=m=>out.push('ALERTA| '+String(m).split('\n')[0]);
  HTMLAnchorElement.prototype.click=function(){};
  try{
    // reproduz o caso do print: FEMININO / CALCA / MACACAO CURTO / JOVEM
    set('ped-fornecedor','T'); set('segmento','100'); set('secao','130');
    ok('130530 existe na lista', [...document.getElementById('especie').options].some(o=>o.value==='130530'),
       [...document.getElementById('especie').options].filter(o=>/MACACAO/.test(o.textContent)).map(o=>o.value).join(','));
    set('especie','130530'); set('departamento','001');
    set('ncm','62041200'); set('p-venda','129,90'); set('p-compra','58,00');
    set('descricao','macacao curto'); set('descricao-cod','016'); set('ref-forn','46016'); set('grade-tipo-select','g1');
    corAlvo=gradeForm.linhas[0]; corCallback=()=>{}; escolherCor('MR','MARROM');
    document.querySelectorAll('#grade-tabela tbody .tam-cell input').forEach((i,k)=>{ if(k<2){i.value=1;i.dispatchEvent(new Event('input'));} });
    document.getElementById('packs-todas').value='1'; aplicarPacksTodas();
    salvarProduto();

    let csv=''; const OB=window.Blob;
    window.Blob=function(p,o){ if((o||{}).type&&o.type.includes('csv')) csv=p.join(''); return new OB(p,o); };
    exportarCSV(); window.Blob=OB;
    const L=csv.trim().split('\r\n'); const cab=L[0].split(';'); const v=L[1].split(';');
    const g=n=>v[cab.indexOf(n)];

    ok('cabeçalho tem CD_GRUPO1..6', [1,2,3,4,5,6].every(n=>cab.includes('CD_GRUPO'+n)&&cab.includes('DS_GRUPO'+n)));
    ok('todas as linhas com o mesmo nº de colunas', new Set(L.map(l=>l.split(';').length)).size===1, cab.length);
    ok('nível 1 SEGMENTO = 100 FEMININO', g('CD_GRUPO1')==='100' && g('DS_GRUPO1')==='FEMININO', g('CD_GRUPO1')+' '+g('DS_GRUPO1'));
    ok('nível 2 SECAO = 130 CALCA', g('CD_GRUPO2')==='130' && g('DS_GRUPO2')==='CALCA', g('CD_GRUPO2')+' '+g('DS_GRUPO2'));
    ok('nível 3 ESPECIE = 530 (curto, não 130530)', g('CD_GRUPO3')==='530', g('CD_GRUPO3'));
    ok('nível 3 descrição = MACACAO CURTO', /MACACAO CURTO/.test(g('DS_GRUPO3')), g('DS_GRUPO3'));
    ok('nível 4 DEPARTAMENTO = 001 JOVEM', g('CD_GRUPO4')==='001' && g('DS_GRUPO4')==='JOVEM', g('CD_GRUPO4')+' '+g('DS_GRUPO4'));
    ok('nível 5 DESCRICAO usa o texto digitado', g('DS_GRUPO5')==='macacao curto', g('DS_GRUPO5'));
    ok('nível 5 usa o código digitado', g('CD_GRUPO5')==='016', g('CD_GRUPO5'));
    ok('nível 5 não usa o texto como código', g('CD_GRUPO5')!=='macacao cu');
    ok('nenhum nível vem vazio (senão o TOTVS pula e desloca)',
       [1,2,3,4,5,6].every(n=>g('CD_GRUPO'+n)!==''), [1,2,3,4,5,6].map(n=>g('CD_GRUPO'+n)).join('|'));
    ok('nível 6 REFERENCIA usa a ref. do fornecedor', g('CD_GRUPO6')==='46016' && g('DS_GRUPO6')==='46016', g('CD_GRUPO6'));
    ok('referência NÃO foi parar no nível 5', g('CD_GRUPO5')!=='46016');
    ok('DS_PRODUTO no padrão secao+especie+depto+descricao+cor+tam', g('DS_PRODUTO')==='CALCA MACACAO CURTO JOVEM macacao curto MARROM PP', g('DS_PRODUTO'));
    ok('não sobrou o código completo em nenhum nível', ![1,2,3,4,5,6].some(n=>g('CD_GRUPO'+n)==='130530'));
    ok('custo preservado', g('VL_PRODUTO2')==='58,00' && g('CD_VALOR3')==='7', g('VL_PRODUTO2'));
    ok('cor preservada', g('CD_COR')==='MR', g('CD_COR'));
    ok('CD_CST = 0 (Nacional)', g('CD_CST')==='0', g('CD_CST'));
  }catch(e){ out.push('EXCEÇÃO| '+e.message+' @ '+(e.stack||'').split('\n')[1]); }
  const pre=document.createElement('pre'); pre.id='resultado-teste'; pre.textContent=out.join('\n'); document.body.appendChild(pre);
},400));
