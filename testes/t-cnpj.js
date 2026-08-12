window.addEventListener('load', ()=>setTimeout(()=>{
  const out=[]; const ok=(n,c,e)=>out.push((c?'OK   ':'FALHA')+' | '+n+(e!==undefined?' | '+e:''));
  const set=(id,v)=>{const e=document.getElementById(id);e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));};
  window.confirm=()=>true; window.alert=m=>out.push('ALERTA| '+String(m).split('\n')[0]);
  HTMLAnchorElement.prototype.click=function(){};
  try{
    ok('cnpjValido aceita válido', cnpjValido('11.222.333/0001-81'));
    ok('cnpjValido recusa dígito errado', !cnpjValido('11.222.333/0001-82'));
    ok('cnpjValido recusa repetido', !cnpjValido('11111111111111'));
    ok('cnpjValido recusa curto', !cnpjValido('1122233300018'));
    ok('cnpjDigitos limpa pontuação', cnpjDigitos('11.222.333/0001-81')==='11222333000181', cnpjDigitos('11.222.333/0001-81'));
    ok('fmtCnpj formata', fmtCnpj('11222333000181')==='11.222.333/0001-81', fmtCnpj('11222333000181'));

    set('ped-cnpj','11.222.333/0001-82');
    ok('erro visível para CNPJ inválido', document.getElementById('erro-cnpj').classList.contains('on'));
    set('ped-cnpj','11222333000181');
    ok('erro some para CNPJ válido', !document.getElementById('erro-cnpj').classList.contains('on'));
    document.getElementById('ped-cnpj').dispatchEvent(new Event('blur'));
    ok('formata ao sair do campo', document.getElementById('ped-cnpj').value==='11.222.333/0001-81', document.getElementById('ped-cnpj').value);
    ok('gravado no estado', state.pedido.cnpj==='11.222.333/0001-81', state.pedido.cnpj);

    // produto completo
    set('ped-fornecedor','Amanda Pedrosa'); set('segmento','200'); set('secao','390'); set('especie','390460');
    set('ncm','61034300'); set('p-venda','29,90'); set('p-compra','15,00'); set('descricao','bermuda dry estampada');
    set('grade-tipo-select','g5');
    corAlvo=gradeForm.linhas[0]; corCallback=()=>{}; escolherCor('ST','SORTIDAS');
    document.querySelectorAll('#grade-tabela tbody .tam-cell input').forEach((i,k)=>{ if(k<4){i.value=1;i.dispatchEvent(new Event('input'));} });
    document.getElementById('packs-todas').value='1'; aplicarPacksTodas();
    salvarProduto();
    ok('produto salvo', state.produtos.length===1);

    let csv=''; const OB=window.Blob;
    window.Blob=function(p,o){ if((o||{}).type&&o.type.includes('csv')) csv=p.join(''); return new OB(p,o); };
    exportarCSV(); window.Blob=OB;
    const L=csv.trim().split('\r\n'); const cab=L[0].split(';');
    ok('64 colunas (30 + custo)', cab.length===64, cab.length);
    const iCnpj=cab.indexOf('NR_CNPJFORNECEDOR');
    ok('NR_CNPJFORNECEDOR presente', iCnpj>=0, iCnpj);
    ok('CNPJ só com dígitos no CSV', L[1].split(';')[iCnpj]==='11222333000181', L[1].split(';')[iCnpj]);
    ok('4 linhas de SKU', L.length===5, L.length);
    ok('CD_COR = ST', L[1].split(';')[cab.indexOf('CD_COR')]==='ST');
    ok('CD_GRADE = 12', L[1].split(';')[cab.indexOf('CD_GRADE')]==='12', L[1].split(';')[cab.indexOf('CD_GRADE')]);
    ok('VL_PRODUTO1 = 29,90', L[1].split(';')[cab.indexOf('VL_PRODUTO1')]==='29,90');

    // CNPJ vazio continua exportando
    state.pedido.cnpj=''; csv='';
    window.Blob=function(p,o){ if((o||{}).type&&o.type.includes('csv')) csv=p.join(''); return new OB(p,o); };
    exportarCSV(); window.Blob=OB;
    ok('sem CNPJ ainda exporta', csv.trim().split('\r\n').length===5);
    ok('coluna do CNPJ fica vazia', csv.trim().split('\r\n')[1].split(';')[iCnpj]==='');
  }catch(e){ out.push('EXCEÇÃO| '+e.message+' @ '+(e.stack||'').split('\n')[1]); }
  const pre=document.createElement('pre'); pre.id='resultado-teste'; pre.textContent=out.join('\n'); document.body.appendChild(pre);
},400));
