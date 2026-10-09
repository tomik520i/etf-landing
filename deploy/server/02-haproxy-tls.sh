#!/usr/bin/env bash
# Krok 2/2: certifikát Let's Encrypt + napojení HAProxy pro aijunior.opicebot.cz.
# Zasahuje do produkční HAProxy: před změnou zálohuje, ověří config a při chybě zálohu vrátí.
# Spuštění (až po 01-install-app.sh): sudo bash 02-haproxy-tls.sh
set -euo pipefail

DOMAIN=aijunior.opicebot.cz
CFG=/etc/haproxy/haproxy.cfg
PEM=/etc/haproxy/certs/aijunior.pem
HOOK=/etc/letsencrypt/renewal-hooks/deploy/haproxy_reload.sh
STAMP=$(date +%F-%H%M%S)

[[ $EUID -eq 0 ]] || { echo "Spusť přes sudo."; exit 1; }
step() { echo; echo "=== $* ==="; }

step "1/5 Kontrola, že Apache odpovídá"
curl -sf -o /dev/null -H "Host: $DOMAIN" http://127.0.0.1:8081/ || { echo "Apache na 8081 neodpovídá – nejdřív 01-install-app.sh"; exit 1; }
echo "OK"

step "2/5 Certifikát (webroot /var/www/certbot, stejně jako ostatní domény)"
if [[ -f /etc/letsencrypt/live/$DOMAIN/fullchain.pem ]]; then
  echo "Certifikát už existuje."
else
  # --no-directory-hooks: nespouštět haproxy_reload.sh (ten kopíruje cert na .175 a restartuje twitch_bot)
  certbot certonly --webroot -w /var/www/certbot -d "$DOMAIN" --key-type ecdsa -n --no-directory-hooks
fi
install -d -m 0755 /etc/haproxy/certs
cat "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "/etc/letsencrypt/live/$DOMAIN/privkey.pem" > "$PEM"
chmod 600 "$PEM"
chown root:root "$PEM"
echo "PEM pro HAProxy: $PEM"

step "3/5 HAProxy"
BK="$CFG.bak-aijunior-$STAMP"
cp -a "$CFG" "$BK"
echo "Záloha: $BK"
restore() { cp -a "$BK" "$CFG"; echo "Vráceno ze zálohy, HAProxy beze změny."; exit 1; }

if grep -q 'aijunior_backend' "$CFG"; then
  echo "Konfigurace pro aijunior už v haproxy.cfg je."
else
  # a) certifikát do bind :443 (před 'alpn')
  sed -i -E "/^\s*bind \*:443 ssl/ s# alpn # crt $PEM alpn #" "$CFG"
  # b) směrování podle Host – hned za neoforgemap ve frontendu https-in
  #    (awk místo vícařádkového 'sed a\' – ten se mezi verzemi sedu chová různě)
  awk -v d="$DOMAIN" '{ print }
    /^[[:space:]]*use_backend server_neoforgemap[[:space:]]+if host_neoforgemap/ {
      print "    acl host_aijunior      hdr(host) -i " d
      print "    use_backend aijunior_backend   if host_aijunior"
    }' "$CFG" > "$CFG.new.$STAMP"
  cat "$CFG.new.$STAMP" > "$CFG"   # cat > zachová vlastníka a práva souboru
  rm -f "$CFG.new.$STAMP"
  # c) backend na konec
  cat >> "$CFG" <<EOF

# aijunior.opicebot.cz – ETF landing page (Apache jen na localhostu)
backend aijunior_backend
    mode http
    option forwardfor
    http-request set-header X-Forwarded-Proto https
    server aijunior_apache 127.0.0.1:8081 check
EOF
  # všechny tři změny se musely provést
  grep -q "crt $PEM" "$CFG"                 || { echo "Nepodařilo se upravit bind :443."; restore; }
  grep -q 'use_backend aijunior_backend' "$CFG" || { echo "Nenalezen řádek 'use_backend server_neoforgemap'."; restore; }
fi

haproxy -c -f "$CFG" || { echo "Config nevalidní."; restore; }
systemctl reload haproxy
echo "HAProxy reloadnutá."
echo "Změny:"; diff "$BK" "$CFG" || true

step "4/5 Obnova certifikátu (deploy hook)"
if grep -q '"aijunior.opicebot.cz"' "$HOOK"; then
  echo "Hook už aijunior obsahuje."
else
  cp -a "$HOOK" "$HOOK.bak-aijunior-$STAMP"
  sed -i '/^  "neoforgemap.opicebot.cz"$/a\  "aijunior.opicebot.cz"' "$HOOK"
  sed -i '/^  \["neoforgemap.opicebot.cz"\]=/a\  ["aijunior.opicebot.cz"]="${HAPROXY_CERT_DIR}/aijunior.pem"' "$HOOK"
  bash -n "$HOOK"
  [[ $(grep -c 'aijunior' "$HOOK") -eq 2 ]] || { cp -a "$HOOK.bak-aijunior-$STAMP" "$HOOK"; echo "Úprava hooku selhala, vráceno."; exit 1; }
  echo "Hook doplněn (záloha $HOOK.bak-aijunior-$STAMP)."
fi
certbot renew --cert-name "$DOMAIN" --dry-run --no-directory-hooks -q && echo "Zkouška obnovy: OK"

step "5/5 Test přes HAProxy"
curl -s -o /dev/null -w "https:  %{http_code}\n" --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/"
curl -s -o /dev/null -w "http:   %{http_code} -> %{redirect_url}\n" --resolve "$DOMAIN:80:127.0.0.1" "http://$DOMAIN/"
curl -s -o /dev/null -w ".env:  %{http_code}\n" --resolve "$DOMAIN:443:127.0.0.1" "https://$DOMAIN/.env"
echo "HOTOVO. Otevři https://$DOMAIN/ z mobilu mimo Wi-Fi."
