/* Mock do jsPDF + autoTable para exercitar toda a lógica de layout do PDF
   (o CDN real está bloqueado neste ambiente de build). */
(function(){
  const chamadas = [];
  function Doc(){
    this._page = 1; this._pages = 1;
    this.lastAutoTable = {finalY: 0};
    this.internal = {pageSize:{getWidth:()=>297,getHeight:()=>210}};
  }
  const reg = (nome) => function(){ chamadas.push(nome + '(' + [].slice.call(arguments,0,4).map(a=>typeof a === 'string' && a.length>25 ? a.slice(0,25)+'…' : a).join(',') + ')'); };
  ['setFillColor','setDrawColor','setTextColor','setFontSize','setFont','rect','line','save'].forEach(m => Doc.prototype[m] = reg(m));
  Doc.prototype.text = function(txt, x, y, opt){
    if (txt == null) throw new Error('text() recebeu ' + txt);
    if (!Number.isFinite(x) || !Number.isFinite(y)) throw new Error('text() com coordenada inválida: x=' + x + ' y=' + y);
    if (y > 210 || y < 0) throw new Error('text() fora da página: y=' + y);
    chamadas.push('text@p' + this._page + ':y' + y.toFixed(1));
  };
  Doc.prototype.addImage = function(d, f, x, y, w, h){
    if (!Number.isFinite(y) || y + h > 210) throw new Error('addImage fora da página: y=' + y);
    chamadas.push('img@p' + this._page);
  };
  Doc.prototype.splitTextToSize = function(t, w){
    if (!Number.isFinite(w) || w <= 0) throw new Error('splitTextToSize com largura inválida: ' + w);
    const porLinha = Math.max(8, Math.floor(w / 1.6));
    const linhas = []; let s = String(t);
    while (s.length > porLinha) { linhas.push(s.slice(0, porLinha)); s = s.slice(porLinha); }
    linhas.push(s);
    return linhas;
  };
  Doc.prototype.autoTable = function(o){
    if (!Number.isFinite(o.startY)) throw new Error('autoTable startY inválido: ' + o.startY);
    if (!Number.isFinite(o.tableWidth) || o.tableWidth <= 0) throw new Error('autoTable tableWidth inválido: ' + o.tableWidth);
    if (!Number.isFinite(o.margin.left) || o.margin.left < 0) throw new Error('autoTable margin.left inválido');
    if (o.margin.left + o.tableWidth > 297.5) throw new Error('tabela ultrapassa a largura A4: ' + (o.margin.left + o.tableWidth));
    // simula didParseCell
    if (o.didParseCell) o.body.forEach((_,i) => o.didParseCell({section:'body', row:{index:i}, cell:{styles:{}}}));
    const alturaSimulada = 7 + o.body.length * 5.8;
    this.lastAutoTable = {finalY: o.startY + alturaSimulada};
    if (this.lastAutoTable.finalY > 200) throw new Error('tabela ultrapassa o rodapé: finalY=' + this.lastAutoTable.finalY.toFixed(1));
    chamadas.push('tabela@p' + this._page + ' y' + o.startY.toFixed(1) + '→' + this.lastAutoTable.finalY.toFixed(1));
  };
  Doc.prototype.addPage = function(){ this._pages++; this._page = this._pages; chamadas.push('addPage→' + this._page); };
  Doc.prototype.getNumberOfPages = function(){ return this._pages; };
  Doc.prototype.setPage = function(n){ this._page = n; };
  window.jspdf = {jsPDF: Doc};
  window.__pdfChamadas = chamadas;
})();

window.addEventListener('load', () => setTimeout(() => {
  const out = [];
  const ok = (n, c, e) => out.push((c ? 'OK   ' : 'FALHA') + ' | ' + n + (e ? ' | ' + e : ''));
  window.confirm = () => true;
  window.alert = (m) => out.push('ALERTA| ' + String(m).split('\n')[0]);
  HTMLAnchorElement.prototype.click = function(){};

  try {
    // foto fake 1x1 jpeg
    const foto = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
    state.pedido = {dtIni:'2026-03-01', dtFim:'2026-04-30', prazo:'30', comissao:'5', fornecedor:'Malharia Teste', frete:'CIF', materiaPrima:'MALHA'};

    const mkProduto = (i, nCores, comFoto, obsLonga) => ({
      id: i, refForn: 'REF-' + i, ncm: '61091000',
      segmento:'100', segmentoNome:'FEMININO', secao:'150', secaoNome:'ROUPA ÍNTIMA',
      especie:'150450', especieNome:'SOUTIEN CLASSICO', departamento:'JOVEM',
      descricao: obsLonga ? 'Descrição bem longa '.repeat(12) : 'Modelo básico',
      observacao: obsLonga ? 'Observação muito longa que precisa quebrar em várias linhas. '.repeat(8) : '',
      marca:'ATRIUM', estacao:'VERÃO 26', pCompra: 19.9, pVenda: 49.9,
      foto: comFoto ? foto : null,
      tipoGrade:'g2', tamanhos: GRADES.g2.tamanhos.slice(),
      grade: Array.from({length:nCores}, (_,c) => ({
        corCod: 'C'+c, corNome: 'COR ' + c,
        tam: Object.fromEntries(GRADES.g2.tamanhos.map((t,k) => [t, (c + k) % 4])),
      })),
      packs: LOJAS.map((_,k) => (k % 3 === 0 ? 2 : 0)),
    });

    // cenários difíceis: muitas cores, textos longos, com e sem foto
    state.produtos = [
      mkProduto(1, 2, true, false),
      mkProduto(2, 12, false, true),
      mkProduto(3, 6, true, true),
      mkProduto(4, 1, false, false),
      mkProduto(5, 9, true, true),
    ];
    let erro = '';
    try { exportarPDF(); } catch (e) { erro = e.message; }
    ok('PDF com 5 produtos pesados sem erro', erro === '', erro);
    const ch = window.__pdfChamadas;
    ok('houve quebra de página', ch.some(c => c.startsWith('addPage')), ch.filter(c=>c.startsWith('addPage')).length + ' páginas extras');
    ok('tabelas desenhadas', ch.filter(c => c.startsWith('tabela')).length === 10, ch.filter(c => c.startsWith('tabela')).length);
    ok('imagens desenhadas', ch.filter(c => c.startsWith('img')).length === 3, ch.filter(c => c.startsWith('img')).length);

    // produto sem loja e sem cor
    window.__pdfChamadas.length = 0;
    state.produtos = [{...mkProduto(9, 1, false, false), packs: LOJAS.map(()=>0), grade:[{cor:'', tam:Object.fromEntries(GRADES.g2.tamanhos.map(t=>[t,0]))}]}];
    erro = '';
    try { exportarPDF(); } catch (e) { erro = e.message; }
    ok('PDF com produto vazio sem erro', erro === '', erro);
  } catch (e) {
    out.push('EXCEÇÃO| ' + e.message + ' @ ' + (e.stack||'').split('\n')[1]);
  }

  const pre = document.createElement('pre');
  pre.id = 'resultado-teste';
  pre.textContent = out.join('\n');
  document.body.appendChild(pre);
}, 300));
