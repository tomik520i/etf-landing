#!/usr/bin/env bash
# Návrat aplikace na předchozí nasazený commit (nebo na zadaný commit).
# Spuštění: sudo bash /var/www/aijunior/deploy/server/04-rollback.sh [commit]
# Databázi nevrací – zálohy jsou v /var/backups/aijunior/etf_lp-*.sql.gz (obnova: gunzip -c … | mariadb etf_lp).
set -euo pipefail

APP_DIR=/var/www/aijunior
BACKUP_DIR=/var/backups/aijunior
[[ $EUID -eq 0 ]] || { echo "Spusť přes sudo."; exit 1; }

TARGET=${1:-$(cat "$BACKUP_DIR/last-deploy-prev.txt")}
git -C "$APP_DIR" cat-file -e "$TARGET^{commit}" || { echo "Commit $TARGET neexistuje."; exit 1; }

echo "Teď:     $(git -C "$APP_DIR" log -1 --format='%h %s')"
git -C "$APP_DIR" reset -q --hard "$TARGET"
echo "Vráceno: $(git -C "$APP_DIR" log -1 --format='%h %s')"

cp "$APP_DIR/deploy/apache-vhost.conf" /etc/apache2/sites-available/aijunior.conf
apache2ctl configtest
systemctl reload apache2
code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: aijunior.opicebot.cz' http://127.0.0.1:8081/)
echo "Úvodní stránka: $code"
