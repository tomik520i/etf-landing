#!/usr/bin/env bash
# Ruční test API na serveru. Spouští se ručně, po potvrzení.
# Použití: BASE=http://127.0.0.1:8081 ORIGIN=https://uzivatel.github.io ./deploy/test-api.sh
# Pozor: první lead s platným formátem e-mailu zkusí poslat skutečný e-mail přes Resend
# (na @example.com selže a zaloguje se – lead zůstane uložen). Rate limit leadu: 5 / 10 min / IP.
BASE="${BASE:-http://127.0.0.1:8081}"
HOSTH="${HOSTH:-aijunior.opicebot.cz}"
ORIGIN="${ORIGIN:-https://UZIVATEL.github.io}"   # musí být shodný s CORS_ORIGIN v .env
EMAIL="${EMAIL:-test+$(date +%s)@example.com}"
SID="${SID:-3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b}"

c() { curl -sS -i -H "Host: $HOSTH" "$@"; echo; echo "-----"; }
JSON='Content-Type: application/json'

echo "### 1) lead OK (očekávám 200 {ok:true})"
c -X POST "$BASE/api/lead.php" -H "$JSON" \
  -d "{\"email\":\"$EMAIL\",\"consent\":true,\"website\":\"\",\"position\":1,\"ad_variant\":\"a\",\"utm_source\":\"test\",\"utm_campaign\":\"manual\"}"

echo "### 2) honeypot (200 {ok:true}, nic se neuloží)"
c -X POST "$BASE/api/lead.php" -H "$JSON" \
  -d '{"email":"bot@example.com","consent":true,"website":"http://spam.example"}'

echo "### 3) neplatný e-mail (400 invalid_email)"
c -X POST "$BASE/api/lead.php" -H "$JSON" \
  -d '{"email":"neni-email","consent":true,"website":""}'

echo "### 4) bez souhlasu (400 consent_required)"
c -X POST "$BASE/api/lead.php" -H "$JSON" \
  -d "{\"email\":\"$EMAIL\",\"consent\":false,\"website\":\"\"}"

echo "### 5) duplicita (200 {ok:true}, e-mail se znovu neposílá)"
c -X POST "$BASE/api/lead.php" -H "$JSON" \
  -d "{\"email\":\"$EMAIL\",\"consent\":true,\"website\":\"\",\"position\":2}"

echo "### 6) GET na lead (405)"
c "$BASE/api/lead.php"

echo "### 7) OPTIONS z povoleného originu (204 + Access-Control-Allow-Origin)"
c -X OPTIONS "$BASE/api/lead.php" -H "Origin: $ORIGIN" \
  -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: Content-Type"

echo "### 8) OPTIONS z cizího originu (204 bez Access-Control-Allow-Origin)"
c -X OPTIONS "$BASE/api/lead.php" -H "Origin: https://evil.example"

echo "### 9) event OK (204, text/plain jako sendBeacon)"
c -X POST "$BASE/api/event.php" -H "Content-Type: text/plain;charset=UTF-8" \
  -d "{\"session_id\":\"$SID\",\"event\":\"page_view\",\"ad_variant\":\"a\",\"props\":{\"utm_source\":\"test\"}}"

echo "### 10) event neplatný – špatný event (400)"
c -X POST "$BASE/api/event.php" -H "Content-Type: text/plain" \
  -d "{\"session_id\":\"$SID\",\"event\":\"hack\"}"

echo "### 11) event neplatný – špatné session_id (400)"
c -X POST "$BASE/api/event.php" -H "Content-Type: text/plain" \
  -d '{"session_id":"abc","event":"page_view"}'

echo "### 12) unsubscribe se špatným tokenem (400, 'Odkaz je neplatný')"
c "$BASE/api/unsubscribe.php?e=test%40example.com&t=deadbeef"

echo "### 13) přímé volání _bootstrap.php (404)"
c "$BASE/api/_bootstrap.php"

echo "### 14) admin bez přihlášení (401 od Apache) – jen při vhostu s basic auth"
c "$BASE/admin/index.php"

echo "Platný unsubscribe odkaz je v e-mailu z kroku 1 (nebo ho vygeneruj: php -r pomocí APP_SECRET – nevypisuj ho do sdíleného logu)."
