#!/usr/bin/env bash
# Aktualizace aplikace z GitHubu. Spuštění: sudo bash /var/www/aijunior/deploy/server/03-update.sh
set -euo pipefail

APP_DIR=/var/www/aijunior
PHPV=8.3
[[ $EUID -eq 0 ]] || { echo "Spusť přes sudo."; exit 1; }

git -C "$APP_DIR" pull --ff-only

fail=0
while IFS= read -r f; do
  "php$PHPV" -l "$f" >/dev/null || { echo "SYNTAX: $f"; fail=1; }
done < <(find "$APP_DIR/public" "$APP_DIR/config.php" -name '*.php')
[[ $fail -eq 0 ]] || { echo "Chyba syntaxe – Apache nereloaduji."; exit 1; }
echo "php -l: OK"

# Vhost se mohl změnit
cp "$APP_DIR/deploy/apache-vhost.conf" /etc/apache2/sites-available/aijunior.conf

# Neprozrazovat verzi Apache a OS v hlavičce Server ani na chybových stránkách
sed -i -E 's/^ServerTokens .*/ServerTokens Prod/; s/^ServerSignature .*/ServerSignature Off/' /etc/apache2/conf-available/security.conf

apache2ctl configtest
systemctl reload apache2
echo "Aktualizováno na $(git -C "$APP_DIR" log -1 --format='%h %s')"

echo; echo "=== Test měření a analytiky ==="
bash "$APP_DIR/deploy/server/smoke-analytics.sh"
