#!/usr/bin/env bash
# End-to-end test měření: event.php → MariaDB → analytika (/admin/).
# Posílá jen TESTOVACÍ eventy (props.test) a na konci je z DB smaže (jako root přes unix socket),
# takže v číslech analytiky nezůstanou.
# Spuštění: sudo bash /var/www/aijunior/deploy/server/smoke-analytics.sh
set -uo pipefail

APP=/var/www/aijunior
B=http://127.0.0.1:8081
HOST=aijunior.opicebot.cz
PHPV=8.3
fail=0
ok()  { echo "OK    $*"; }
bad() { echo "CHYBA $*"; fail=1; }

# Spustí analytiku přes PHP CLI jako www-data (čte .env jako Apache), $1 = query string
admin() {
  sudo -u www-data "php$PHPV" -d display_errors=stderr -d error_reporting=E_ALL -r \
    'parse_str($argv[1], $_GET); $_SERVER["REQUEST_METHOD"]="GET"; include $argv[2];' \
    "$1" "$APP/public/admin/index.php" 2>"/tmp/smoke-admin.err"
}
# Číslo z řádku tabulky/dlaždice: první čistě číselné pole ZA polem s popiskem
# (HTML značky → '|', nezlomitelné mezery z num() pryč; popisek „Scroll 50 %“ tak nevrátí 50)
val() {
  sed -e 's/<[^>]*>/|/g' -e 's/\xc2\xa0//g' | awk -F'|' -v L="$1" '
    index($0, L) { for (i = 1; i <= NF; i++) if (index($i, L)) {
      for (j = i + 1; j <= NF; j++) { g = $j; gsub(/[ \t]/, "", g); if (g ~ /^[0-9]+$/) { print g; exit } } } }'
}

echo "=== 1/3 Stránka se vykreslí pro všechny kombinace filtrů ==="
for qs in "" "test=0" "test=1" "test=2" "variant=a" "variant=b" "variant=none" \
          "from=2026-01-01&to=2026-12-31" "variant=x&from=blbost&test=9"; do
  out=$(admin "$qs")
  sections=$(grep -c '<!-- [0-9]\. ' <<<"$out")
  if grep -q 'Data se nepodařilo' <<<"$out" || [[ -s /tmp/smoke-admin.err ]] || [[ $sections -ne 9 ]]; then
    bad "?$qs  (sekcí: $sections)"; sed 's/^/      /' /tmp/smoke-admin.err | head -5
  else ok "?$qs  (9 sekcí, bez chyb a warningů)"; fi
done
grep -qiE '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' <<<"$(admin "test=2")" && bad "ve stránce je e-mailová adresa" || ok "žádné e-maily ve stránce"

echo; echo "=== 2/3 Testovací návštěva projde celým funnelem ==="
before=$(admin "test=1" | val 'Testovací session v období')
SID=$(cat /proc/sys/kernel/random/uuid)
cleanup() {
  mariadb etf_lp -e "DELETE FROM events WHERE session_id IN ('$SID', '00000000-0000-4000-8000-000000000000')"     && echo "Úklid: testovací eventy smazány."
}
trap cleanup EXIT
send() { curl -s -o /dev/null -w '%{http_code}' -H "Host: $HOST" -X POST -H 'Content-Type: text/plain' \
  --data "{\"session_id\":\"$SID\",\"event\":\"$1\",\"ad_variant\":\"a\",\"props\":$2}" "$B/api/event.php"; }
codes=""
for e in page_view scroll_50 scroll_90 calc_interact calc_result_viewed; do codes+=$(send "$e" '{"test":1}')" "; done
codes+=$(send cta_click '{"position":"hero","test":1}')" "
codes+=$(send form_focus '{"position":1,"test":1}')" "
codes+=$(send form_error '{"reason":"invalid_email","position":1,"test":1}')" "
codes+=$(send form_submit '{"position":1,"test":1}')" "
codes+=$(send form_success '{"position":1,"test":1}')
[[ $codes == "204 204 204 204 204 204 204 204 204 204" ]] && ok "10 eventů přijato (204)" || bad "kódy odpovědí: $codes"
[[ $(send nesmysl '{"test":1}') == 400 ]] && ok "neznámý event odmítnut (400)" || bad "neznámý event nebyl odmítnut"

after=$(admin "test=1" | val 'Testovací session v období')
[[ $((after - before)) -eq 1 ]] && ok "analytika (jen testovací) vidí novou session: $before → $after" || bad "testovací session: $before → $after (čekáno +1)"

t1=$(admin "test=1&variant=a")
for step in 'Zobrazení stránky' 'Scroll 50' 'Práce s kalkulačkou' 'Zobrazený výsledek' 'Začátek vyplňování formuláře' 'Odeslání formuláře' 'Lead (úspěch)'; do
  n=$(val "$step" <<<"$t1"); [[ ${n:-0} -ge 1 ]] && ok "funnel: $step = $n" || bad "funnel: $step = ${n:-0}"
done
grep -q 'invalid_email' <<<"$t1" && ok "chyba formuláře invalid_email je v přehledu" || bad "chybí invalid_email v chybách formuláře"

echo; echo "=== 3/3 Ostrá čísla testovací návštěvu neobsahují ==="
live_before=$(admin "test=0" | val 'Návštěvy')
send page_view '{"test":1}' >/dev/null
live_after=$(admin "test=0" | val 'Návštěvy')
[[ "$live_before" == "$live_after" ]] && ok "návštěvy (bez testů) beze změny: $live_after" || bad "ostré návštěvy se změnily: $live_before → $live_after"

echo
[[ $fail -eq 0 ]] && echo "VŠE OK" || { echo "NĚKTERÉ TESTY SELHALY – pošli výstup"; exit 1; }
