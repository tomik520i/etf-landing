#!/usr/bin/env bash
# Vyrenderuje content/pdf/etf-srovnani.html do public/pdf/etf-srovnani.pdf přes headless Chrome.
# Použití: CHROME="/cesta/k/chrome" bash scripts/render-pdf.sh
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
SRC="$(pwd -W 2>/dev/null || pwd)/content/pdf/etf-srovnani.html"
OUT="$(pwd -W 2>/dev/null || pwd)/public/pdf/etf-srovnani.pdf"
mkdir -p public/pdf
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$OUT" "file:///$SRC"
