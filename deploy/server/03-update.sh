#!/usr/bin/env bash
# Aktualizace aplikace z GitHubu se zálohou a automatickým návratem.
# Spuštění: sudo bash /var/www/aijunior/deploy/server/03-update.sh
# Ruční návrat: sudo bash /var/www/aijunior/deploy/server/04-rollback.sh
set -euo pipefail

APP_DIR=/var/www/aijunior
BACKUP_DIR=/var/backups/aijunior
PHPV=8.3
STAMP=$(date +%F-%H%M%S)
[[ $EUID -eq 0 ]] || { echo "Spusť přes sudo."; exit 1; }

git config --global --get-all safe.directory | grep -qx "$APP_DIR" || git config --global --add safe.directory "$APP_DIR"

echo "=== 1/5 Záloha ==="
install -d -m 700 "$BACKUP_DIR"
PREV=$(git -C "$APP_DIR" rev-parse HEAD)
echo "$PREV" > "$BACKUP_DIR/last-deploy-prev.txt"
mariadb-dump --single-transaction etf_lp | gzip > "$BACKUP_DIR/etf_lp-$STAMP.sql.gz"
chmod 600 "$BACKUP_DIR/etf_lp-$STAMP.sql.gz"
ls -1t "$BACKUP_DIR"/etf_lp-*.sql.gz | tail -n +11 | xargs -r rm -f   # ponechat 10 posledních
echo "Předchozí commit: $(git -C "$APP_DIR" log -1 --format='%h %s' "$PREV")"
echo "Záloha DB: $BACKUP_DIR/etf_lp-$STAMP.sql.gz"

rollback() {
  echo; echo "!!! $1 – vracím na $PREV"
  git -C "$APP_DIR" reset -q --hard "$PREV"
  cp "$APP_DIR/deploy/apache-vhost.conf" /etc/apache2/sites-available/aijunior.conf
  apache2ctl configtest && systemctl reload apache2
  echo "Vráceno na $(git -C "$APP_DIR" log -1 --format='%h %s')."
  exit 1
}

echo; echo "=== 2/5 Stažení z GitHubu ==="
git -C "$APP_DIR" pull --ff-only
NEW=$(git -C "$APP_DIR" rev-parse HEAD)
[[ $NEW == "$PREV" ]] && echo "Žádné nové commity." || git -C "$APP_DIR" log --oneline "$PREV..$NEW"

echo; echo "=== 3/5 Kontrola PHP ==="
fail=0
while IFS= read -r f; do
  "php$PHPV" -l "$f" >/dev/null || { echo "SYNTAX: $f"; fail=1; }
done < <(find "$APP_DIR/public" "$APP_DIR/config.php" -name '*.php')
[[ $fail -eq 0 ]] || rollback "Chyba syntaxe PHP"
echo "php -l: OK"

echo; echo "=== 4/5 Apache ==="
cp "$APP_DIR/deploy/apache-vhost.conf" /etc/apache2/sites-available/aijunior.conf
# Neprozrazovat verzi Apache a OS v hlavičce Server ani na chybových stránkách
sed -i -E 's/^ServerTokens .*/ServerTokens Prod/; s/^ServerSignature .*/ServerSignature Off/' /etc/apache2/conf-available/security.conf
apache2ctl configtest || rollback "Neplatná konfigurace Apache"
systemctl reload apache2
for p in / /css/style.css /js/app.js /data/prices/SPY.json /pdf/etf-srovnani.pdf; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Host: aijunior.opicebot.cz' "http://127.0.0.1:8081$p")
  [[ $code == 200 ]] || rollback "$p vrací $code"
done
echo "Stránka, CSS, JS, data a PDF: 200"

echo; echo "=== 5/5 Test měření a analytiky ==="
bash "$APP_DIR/deploy/server/smoke-analytics.sh" || rollback "Test měření selhal"

echo; echo "Nasazeno: $(git -C "$APP_DIR" log -1 --format='%h %s')"
echo "Návrat v případě potřeby: sudo bash $APP_DIR/deploy/server/04-rollback.sh"
