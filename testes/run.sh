#!/bin/bash
# Roda uma suíte de teste contra o index.html.
#
#   ./testes/run.sh testes/teste.js
#   for f in testes/t-*.js testes/teste*.js; do ./testes/run.sh "$f"; done
#
# Como funciona: injeta o arquivo de teste no fim do index.html, abre a cópia
# num navegador sem janela e lê o <pre id="resultado-teste"> que o teste cria.
# Não precisa de servidor, npm, nem instalar nada além do Chromium.
set -u
AQUI="$(cd "$(dirname "$0")" && pwd)"
RAIZ="$(dirname "$AQUI")"
TMP="$AQUI/_run.html"

python3 - "$1" "$RAIZ/index.html" "$TMP" <<'PY'
import sys
teste = open(sys.argv[1], encoding='utf-8').read()
src = open(sys.argv[2], encoding='utf-8').read()
src = src.replace('</body>', '<script>\n' + teste + '\n</script>\n</body>', 1)
open(sys.argv[3], 'w', encoding='utf-8').write(src)
PY

BIN="${CHROMIUM:-}"
if [ -z "$BIN" ]; then
  BIN=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell 2>/dev/null | head -1)
fi
if [ -z "$BIN" ]; then
  BIN=$(command -v chromium || command -v chromium-browser || command -v google-chrome || true)
fi
if [ -z "$BIN" ]; then
  echo "Chromium não encontrado. Instale o Chromium ou aponte a variável CHROMIUM." >&2
  exit 2
fi

"$BIN" --no-sandbox --disable-gpu --virtual-time-budget=12000 --dump-dom "file://$TMP" 2>/dev/null \
 | python3 -c "
import sys, re, html
d = sys.stdin.read()
m = re.search(r'<pre id=\"resultado-teste\">(.*?)</pre>', d, re.S)
print(html.unescape(m.group(1)) if m else 'SEM RESULTADO (erro de sintaxe no index.html?)')
"
