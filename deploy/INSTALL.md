# Nasazení na Ubuntu server 192.168.1.200

Cíl: `https://aijunior.opicebot.cz` → HAProxy (:443, TLS) → Apache `127.0.0.1:8081` + PHP-FPM → MariaDB `127.0.0.1:3306`.

Všechny příkazy spouští správce serveru ručně, krok po kroku. Hesla se zadávají jen na serveru, nikdy do chatu ani do gitu.

---

## 0. Kontrola před začátkem (jen čtení)

```bash
lsb_release -a                 # verze Ubuntu (ovlivní verzi PHP)
sudo ss -tlnp                  # co poslouchá na kterých portech (80/443 = HAProxy)
sudo haproxy -v
sudo certbot certificates      # jak se vydávají stávající certifikáty
ls /etc/letsencrypt/renewal/   # v *.conf hledej řádek "authenticator" a "http01_port"
grep -nE "^\s*(frontend|backend|bind|crt)" /etc/haproxy/haproxy.cfg
```

Výstup posledních tří příkazů pošli do chatu (neobsahuje tajné údaje). Podle něj doladíme krok 7 a 8.

## 1. Instalace balíčků

Apache by se po instalaci pokusil obsadit port 80, který už drží HAProxy. Proto mu dočasně zakážeme automatický start:

```bash
printf '#!/bin/sh\nexit 101\n' | sudo tee /usr/sbin/policy-rc.d && sudo chmod +x /usr/sbin/policy-rc.d
sudo apt update
sudo apt install -y apache2 apache2-utils php-fpm php-mysql php-mbstring mariadb-server git
sudo rm /usr/sbin/policy-rc.d
ls /run/php/ /etc/php/          # zjisti verzi PHP (např. 8.3)
```

Pokud verze PHP není 8.3, uprav `php8.3` v krocích níže i v `apache-vhost.conf`.

## 2. Apache jen na localhostu

```bash
echo 'Listen 127.0.0.1:8081' | sudo tee /etc/apache2/ports.conf
sudo a2dissite 000-default
sudo a2enmod proxy_fcgi setenvif remoteip headers rewrite
sudo a2enconf php8.3-fpm
```

## 3. MariaDB

```bash
grep -n bind-address /etc/mysql/mariadb.conf.d/50-server.cnf   # musí být 127.0.0.1
sudo mariadb-secure-installation                               # odstraní anonymní uživatele a test DB
```

Kód stáhneš v kroku 4, schéma spustíš potom. Uživatele vytvoř ručně. Nejdřív si vygeneruj heslo a ulož ho jen do `.env`:

```bash
openssl rand -base64 24
sudo mariadb
```
```sql
CREATE USER 'etf_lp'@'localhost' IDENTIFIED BY 'SEM_VLOZ_HESLO';
GRANT SELECT, INSERT ON etf_lp.* TO 'etf_lp'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Kód a `.env`

```bash
sudo git clone https://github.com/UZIVATEL/REPO.git /var/www/aijunior
sudo mariadb < /var/www/aijunior/deploy/schema.sql
sudo cp /var/www/aijunior/.env.example /var/www/aijunior/.env
sudo nano /var/www/aijunior/.env          # DB_PASS, SMTP_PASS (Resend API klíč), MAIL_FROM…
sudo chown root:www-data /var/www/aijunior/.env
sudo chmod 640 /var/www/aijunior/.env
```

## 5. Vhost a basic auth pro admin

```bash
sudo cp /var/www/aijunior/deploy/apache-vhost.conf /etc/apache2/sites-available/aijunior.conf
sudo htpasswd -c /etc/apache2/.htpasswd-aijunior admin
sudo chown root:www-data /etc/apache2/.htpasswd-aijunior && sudo chmod 640 /etc/apache2/.htpasswd-aijunior
sudo a2ensite aijunior
sudo apache2ctl configtest
sudo systemctl enable --now apache2
sudo systemctl restart php8.3-fpm apache2
```

Lokální test na serveru:

```bash
curl -sI -H 'Host: aijunior.opicebot.cz' http://127.0.0.1:8081/            # 200
curl -sI -H 'Host: aijunior.opicebot.cz' http://127.0.0.1:8081/.env        # 403 nebo 404
curl -sI -H 'Host: aijunior.opicebot.cz' http://127.0.0.1:8081/admin/      # 401
sudo ss -tlnp | grep -E '8081|3306'     # obojí jen na 127.0.0.1
```

## 6. DNS (Forpsi)

Přidej A záznam `aijunior` → veřejná IP. Ověření: `dig +short aijunior.opicebot.cz`.

## 7. Certifikát Let's Encrypt

Použij stejný postup, jakým se vydávají stávající certifikáty (krok 0). Typická varianta s HAProxy je **certbot standalone za HAProxy**: certbot poslouchá na lokálním portu (např. 8888) a HAProxy na něj pošle `/.well-known/acme-challenge/`.

```bash
sudo certbot certonly --standalone --http-01-port 8888 -d aijunior.opicebot.cz
sudo cat /etc/letsencrypt/live/aijunior.opicebot.cz/fullchain.pem \
         /etc/letsencrypt/live/aijunior.opicebot.cz/privkey.pem \
  | sudo tee /etc/haproxy/certs/aijunior.opicebot.cz.pem > /dev/null
sudo chmod 600 /etc/haproxy/certs/aijunior.opicebot.cz.pem
```

Port a cesta k certům se musí shodovat s tím, co už na serveru používáš. Obnovu musí pokrýt existující deploy hook, který skládá `.pem` pro HAProxy. Ověř: `sudo certbot renew --dry-run`.

## 8. HAProxy

```bash
sudo cp /etc/haproxy/haproxy.cfg /etc/haproxy/haproxy.cfg.bak-$(date +%F)
sudo nano /etc/haproxy/haproxy.cfg        # doplnit podle deploy/haproxy-snippet.cfg
sudo haproxy -c -f /etc/haproxy/haproxy.cfg
sudo systemctl reload haproxy
```

## 9. Ověření zvenku (z mobilu mimo Wi-Fi nebo z jiné sítě)

```bash
curl -sI https://aijunior.opicebot.cz/                 # 200, platný certifikát
curl -sI https://aijunior.opicebot.cz/.env             # 403/404
curl -sI http://aijunior.opicebot.cz/                  # 301 na https
```

Router musí forwardovat jen 80 a 443 na .200. Apache (8081), MariaDB (3306) ani llama-server nesmí být zvenku dostupné.

## Aktualizace

```bash
cd /var/www/aijunior && sudo git pull
```
