window.addEventListener('load', ()=>setTimeout(()=>{
  const out=[]; const ok=(n,c,e)=>out.push((c?'OK   ':'FALHA')+' | '+n+(e!==undefined?' | '+e:''));
  const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  window.confirm=()=>true; window.alert=m=>out.push('ALERTA| '+String(m).split('\n')[0]);
  HTMLAnchorElement.prototype.click=function(){};
  try{
    ok('7 departamentos', DEPARTAMENTOS.length===7, DEPARTAMENTOS.length);
    ok('códigos com 3 dígitos', DEPARTAMENTOS.every(d=>/^\d{3}$/.test(d.cod)), DEPARTAMENTOS.map(d=>d.cod).join(','));
    ok('001 = JOVEM', nomeDepartamento('001')==='JOVEM');
    ok('007 = BEBE', nomeDepartamento('007')==='BEBE');
    ok('999 IMPORTACAO fora da lista', !DEPARTAMENTOS.some(d=>d.cod==='999'));
    ok('select mostra código e nome', [...document.getElementById('departamento').options].some(o=>o.value==='004' && /PRIMEIROS PASSOS/.test(o.textContent)));

    // migração do formato antigo (guardava o nome)
    const casos = [['JOVEM','001'],['PLUS SIZE','002'],['CONTEMPORÂNEO','003'],['1º PASSOS - 1/2/3','004'],['INFANTIL','005'],['JUVENIL','006'],['004','004'],['','']];
    casos.forEach(([antigo,esperado])=>{
      const p = normalizarProduto({id:1, departamento:antigo, tipoGrade:'g1', grade:[], packs:[]});
      ok(`migração "${antigo}" -> ${esperado||'(vazio)'}`, p.departamento===esperado, p.departamento);
    });

    // DS_GRUPO1 leva o nome, não o código
    set('ped-fornecedor','T'); set('segmento','200'); set('secao','390'); set('especie','390460');
    set('departamento','002'); set('ncm','61034300'); set('p-venda','29,90'); set('descricao','bermuda');
    set('grade-tipo-select','g5');
    corAlvo=gradeForm.linhas[0]; corCallback=()=>{}; escolherCor('ST','SORTIDAS');
    document.querySelector('#grade-tabela tbody .tam-cell input').value=1;
    document.querySelector('#grade-tabela tbody .tam-cell input').dispatchEvent(new Event('input'));
    document.getElementById('packs-todas').value='1'; aplicarPacksTodas();
    salvarProduto();
    ok('produto guarda o código', state.produtos[0].departamento==='002', state.produtos[0].departamento);
    ok('produto guarda o nome junto', state.produtos[0].departamentoNome==='PLUS SIZE', state.produtos[0].departamentoNome);

    let csv=''; const OB=window.Blob;
    window.Blob=function(p,o){ if((o||{}).type&&o.type.includes('csv')) csv=p.join(''); return new OB(p,o); };
    exportarCSV(); window.Blob=OB;
    const L=csv.trim().split('\r\n'); const cab=L[0].split(';');
    const g=n=>L[1].split(';')[cab.indexOf(n)];
    ok('DS_GRUPO1 agora é o segmento', g('DS_GRUPO1')==='MASCULINO', g('DS_GRUPO1'));
    ok('nível 4 leva o código do departamento', g('CD_GRUPO4')==='002' && g('DS_GRUPO4')==='PLUS SIZE', g('CD_GRUPO4')+' '+g('DS_GRUPO4'));
    ok('PDF/tela seguem com o nome do departamento', nomeDepartamento(state.produtos[0].departamento)==='PLUS SIZE');

    // edição recarrega certo
    editarProduto(state.produtos[0].id);
    ok('edição recarrega o departamento', document.getElementById('departamento').value==='002', document.getElementById('departamento').value);
  }catch(e){ out.push('EXCEÇÃO| '+e.message+' @ '+(e.stack||'').split('\n')[1]); }
  const pre=document.createElement('pre'); pre.id='resultado-teste'; pre.textContent=out.join('\n'); document.body.appendChild(pre);
},400));
