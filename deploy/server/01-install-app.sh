#!/usr/bin/env bash
# Krok 1/2: Apache + PHP-FPM + MariaDB + aplikace na 192.168.1.200.
# Na HAProxy ani certifikáty nesahá. Spuštění: sudo bash 01-install-app.sh
# Opakované spuštění je bezpečné (existující .env, heslo DB a htpasswd nepřepisuje).
set -euo pipefail

APP_DIR=/var/www/aijunior
REPO=https://github.com/tomik520i/etf-landing.git
PHPV=8.3
HOST=aijunior.opicebot.cz

[[ $EUID -eq 0 ]] || { echo "Spusť přes sudo."; exit 1; }
step() { echo; echo "=== $* ==="; }

step "1/6 Balíčky"
# Apache by se po instalaci pokusil obsadit port 80 (drží ho HAProxy) – start služeb dočasně zakázán
printf '#!/bin/sh\nexit 101\n' > /usr/sbin/policy-rc.d
chmod +x /usr/sbin/policy-rc.d
trap 'rm -f /usr/sbin/policy-rc.d' EXIT
apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get install -y -q \
  apache2 apache2-utils "php$PHPV-fpm" "php$PHPV-mysql" "php$PHPV-mbstring" "php$PHPV-curl" mariadb-server
rm -f /usr/sbin/policy-rc.d
trap - EXIT

step "2/6 Apache jen na 127.0.0.1:8081"
cp -n /etc/apache2/ports.conf /etc/apache2/ports.conf.orig
echo 'Listen 127.0.0.1:8081' > /etc/apache2/ports.conf
a2dissite -q 000-default || true
a2enmod -q proxy_fcgi setenvif remoteip headers rewrite
a2enconf -q "php$PHPV-fpm"

step "3/6 Kód z GitHubu"
if [[ -d $APP_DIR/.git ]]; then
  git -C "$APP_DIR" pull --ff-only
else
  git clone -q "$REPO" "$APP_DIR"
fi

step "4/6 MariaDB"
systemctl enable --now mariadb
grep -Eq '^\s*bind-address\s*=\s*127\.0\.0\.1' /etc/mysql/mariadb.conf.d/50-server.cnf \
  && echo "bind-address = 127.0.0.1 (OK)" || echo "POZOR: bind-address není 127.0.0.1 – zkontroluj 50-server.cnf"
mariadb -e "DROP USER IF EXISTS ''@'localhost'; DROP USER IF EXISTS ''@'$(hostname)'; DROP DATABASE IF EXISTS test;"
mariadb < "$APP_DIR/deploy/schema.sql"

ENV_FILE=$APP_DIR/.env
if [[ -f $ENV_FILE ]]; then
  echo ".env už existuje – heslo DB ani APP_SECRET neměním."
else
  # Heslo vznikne jen tady na serveru a zapíše se rovnou do .env – nikde se nevypisuje
  DBPASS=$(openssl rand -base64 30 | tr -d '/+=' | cut -c1-32)
  mariadb -e "CREATE OR REPLACE USER 'etf_lp'@'localhost' IDENTIFIED BY '$DBPASS';
              GRANT SELECT, INSERT ON etf_lp.* TO 'etf_lp'@'localhost'; FLUSH PRIVILEGES;"
  ( umask 077
    sed -e "s|^DB_PASS=.*|DB_PASS=$DBPASS|" \
        -e "s|^APP_SECRET=.*|APP_SECRET=$(openssl rand -hex 32)|" \
        "$APP_DIR/.env.example" > "$ENV_FILE" )
  unset DBPASS
  echo ".env vytvořen (DB_PASS a APP_SECRET vygenerovány). RESEND_API_KEY doplň ručně."
fi
chown root:www-data "$ENV_FILE"
chmod 640 "$ENV_FILE"

step "5/6 Vhost a basic auth pro /admin"
cp "$APP_DIR/deploy/apache-vhost.conf" /etc/apache2/sites-available/aijunior.conf
a2ensite -q aijunior
if [[ ! -f /etc/apache2/.htpasswd-aijunior ]]; then
  echo "Zadej heslo pro admin přehled (uživatel: admin):"
  htpasswd -c /etc/apache2/.htpasswd-aijunior admin
fi
chown root:www-data /etc/apache2/.htpasswd-aijunior
chmod 640 /etc/apache2/.htpasswd-aijunior
apache2ctl configtest
systemctl enable --now "php$PHPV-fpm" apache2
systemctl restart "php$PHPV-fpm" apache2

step "6/6 Testy"
fail=0
while IFS= read -r f; do
  "php$PHPV" -l "$f" >/dev/null || { echo "SYNTAX: $f"; fail=1; }
done < <(find "$APP_DIR/public" "$APP_DIR/config.php" -name '*.php')
[[ $fail -eq 0 ]] && echo "php -l: OK"

check() { # očekávaný kód, popis, curl argumenty…
  local want=$1 desc=$2; shift 2
  local got; got=$(curl -s -o /dev/null -w '%{http_code}' -H "Host: $HOST" "$@")
  [[ $got == "$want" ]] && echo "OK   $got  $desc" || { echo "CHYBA $got (čekáno $want)  $desc"; fail=1; }
}
B=http://127.0.0.1:8081
check 200 "úvodní stránka"            "$B/"
check 200 "data JSON"                 "$B/data/prices/SPY.json"
check 200 "PDF"                       "$B/pdf/etf-srovnani.pdf"
check 403 ".env není vidět"           "$B/.env"
check 403 "_bootstrap.php zakázán"    "$B/api/_bootstrap.php"
check 401 "admin chce heslo"          "$B/admin/"
check 405 "lead.php jen POST"         "$B/api/lead.php"
check 400 "event bez dat odmítnut"    -X POST --data 'x' "$B/api/event.php"
check 204 "event se uloží do DB"      -X POST -H 'Content-Type: text/plain' \
  --data '{"session_id":"00000000-0000-4000-8000-000000000000","event":"page_view","ad_variant":null,"props":{"test":"install"}}' "$B/api/event.php"
echo
ss -tln | grep -E ':(8081|3306)\s' || true
[[ $fail -eq 0 ]] && echo "HOTOVO bez chyb. Další krok: 02-haproxy-tls.sh" || { echo "Některé testy selhaly – pošli výstup."; exit 1; }
