#!/usr/bin/env bash
# ============================================================
# GoberVial - Script de Automatización de Servidor
# Plataforma de Auditoría Ciudadana Vial - Magdalena
# Destino: Ubuntu Server 24.04 LTS en OVHcloud
# Ejecutar como root: sudo bash setup-vps.sh
# ============================================================

set -euo pipefail

# --- Colores para terminal ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_step()  { echo -e "\n${BLUE}============================================================${NC}"; echo -e "${BLUE}[STEP]${NC} $*"; echo -e "${BLUE}============================================================${NC}"; }

# --- Verificar ejecución como root ---
if [[ "$EUID" -ne 0 ]]; then
    log_error "Este script debe ejecutarse como root (sudo bash setup-vps.sh)"
    exit 1
fi

# --- Generación de credenciales aleatorias seguras (NO hardcodeadas) ---
generate_password() {
    openssl rand -base64 32 | tr -d '/+=' | head -c 32
}

DB_ROOT_PASSWORD=$(generate_password)
DB_NAME="gobervial"
DB_USER="gobervial_user"
DB_PASSWORD=$(generate_password)
JWT_SECRET=$(openssl rand -base64 64 | tr -d '/+=' | head -c 64)

APP_DIR="/var/www/gobervial"
API_PORT=3000
DOMAIN="${1:-}"

# ============================================================
# PASO 1: Actualización del sistema operativo
# ============================================================
log_step "1/7: Actualizando sistema operativo Ubuntu"

apt-get update -y && apt-get upgrade -y
apt-get install -y \
    curl wget gnupg ca-certificates lsb-release \
    software-properties-common build-essential \
    unzip zip git ufw htop net-tools

log_info "Sistema operativo actualizado correctamente."

# ============================================================
# PASO 2: Configuración del Firewall UFW
# ============================================================
log_step "2/7: Configurando cortafuegos UFW"

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow "${API_PORT}"/tcp
ufw --force enable

log_info "UFW configurado: SSH, HTTP(80), HTTPS(443), API(${API_PORT}) habilitados."

# ============================================================
# PASO 3: Instalación y Securización de MySQL
# ============================================================
log_step "3/7: Instalando y securizando MySQL"

export DEBIAN_FRONTEND=noninteractive

apt-get install -y mysql-server

# Configurar MySQL para aceptar conexiones desde localhost con autenticación segura
cat > /etc/mysql/mysql.conf.d/gobervial.cnf << 'MYSQLCNF'
[mysqld]
bind-address = 127.0.0.1
mysqlx-bind-address = 127.0.0.1
default-authentication-plugin = mysql_native_password
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
max_connections = 100
sql_mode = STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION
MYSQLCNF

systemctl restart mysql
systemctl enable mysql

# Securización de MySQL equivalente a mysql_secure_installation
mysql -u root << SQLSECURE
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_ROOT_PASSWORD}';
DELETE FROM mysql.user WHERE User='';
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';
FLUSH PRIVILEGES;
SQLSECURE

# Crear base de datos y usuario de aplicación
mysql -u root -p"${DB_ROOT_PASSWORD}" << SQLAPP
CREATE DATABASE IF NOT EXISTS ${DB_NAME}
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQLAPP

log_info "MySQL instalado y securizado. Base de datos '${DB_NAME}' creada."

# ============================================================
# PASO 4: Instalación de Node.js 20 LTS
# ============================================================
log_step "4/7: Instalando Node.js 20 LTS"

if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

npm install -g pm2

log_info "Node.js $(node -v) y npm $(npm -v) instalados. PM2 $(pm2 -v) instalado."

# ============================================================
# PASO 5: Instalación y Configuración de Nginx con Hardening
# ============================================================
log_step "5/7: Instalando y configurando Nginx con hardening de seguridad"

apt-get install -y nginx

# Configuración base de hardening en nginx.conf
cat > /etc/nginx/nginx.conf << 'NGINXMAIN'
user www-data;
worker_processes auto;
pid /run/nginx.pid;
error_log /var/log/nginx/error.log warn;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    ##
    # Configuración básica
    ##
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    server_names_hash_bucket_size 64;

    client_max_body_size 10M;
    client_body_buffer_size 128k;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    ##
    # Logging
    ##
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    ##
    # Rate Limiting global (10 req/s por IP)
    ##
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login_limit:5m rate=5r/m;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    ##
    # Gzip
    ##
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    ##
    # Headers de seguridad globales
    ##
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), geolocation=(), microphone=()" always;

    ##
    # Virtual Hosts
    ##
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
NGINXMAIN

systemctl restart nginx
systemctl enable nginx

log_info "Nginx instalado y configurado con hardening de seguridad."

# ============================================================
# PASO 6: Configuración de directorios de aplicación
# ============================================================
log_step "6/7: Creando estructura de directorios de la aplicación"

mkdir -p "${APP_DIR}/api"
mkdir -p "${APP_DIR}/api/uploads/evidencias"
mkdir -p "${APP_DIR}/api/logs"
mkdir -p "${APP_DIR}/app"

chown -R www-data:www-data "${APP_DIR}"
chmod -R 755 "${APP_DIR}"
chmod -R 775 "${APP_DIR}/api/uploads"

log_info "Directorios creados en ${APP_DIR}"

# ============================================================
# PASO 7: Generación de archivo .env con credenciales seguras
# ============================================================
log_step "7/8: Generando archivo .env con credenciales aleatorias"

cat > "${APP_DIR}/api/.env" << DOTENV
NODE_ENV=production
PORT=${API_PORT}
HOST=0.0.0.0

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
DB_CONNECTION_LIMIT=10
DB_QUEUE_LIMIT=0

JWT_SECRET=${JWT_SECRET}
JWT_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

BCRYPT_SALT_ROUNDS=10

UPLOAD_DIR=uploads/evidencias
MAX_FILE_SIZE_MB=10

API_PREFIX=/api/v1
CORS_ORIGIN=https://${DOMAIN:-localhost}

LOG_LEVEL=info
LOG_FILE=logs/app.log
DOTENV

chown www-data:www-data "${APP_DIR}/api/.env"
chmod 600 "${APP_DIR}/api/.env"

CREDENTIALS_FILE="${APP_DIR}/api/.credentials-gobevial"
cat > "${CREDENTIALS_FILE}" << CREDS
============================================================
  GoberVial - Credenciales generadas el $(date)
  GUARDA ESTE ARCHIVO EN LUGAR SEGURO. NO COMMITTEAR.
============================================================

  Base de datos MySQL:
    Host      : 127.0.0.1:3306
    Nombre BD : ${DB_NAME}
    Usuario   : ${DB_USER}
    Password  : ${DB_PASSWORD}
    Root pass : ${DB_ROOT_PASSWORD}

  JWT:
    Secret    : ${JWT_SECRET}

  API:
    Puerto    : ${API_PORT}
    Ruta .env : ${APP_DIR}/api/.env

  IMPORTANTE: Copia estas credenciales a tu gestor de
  contraseñas y luego elimina este archivo con:
    shred -u ${CREDENTIALS_FILE}
============================================================
CREDS

chmod 600 "${CREDENTIALS_FILE}"
log_info ".env generado en ${APP_DIR}/api/.env"
log_warn "Credenciales guardadas en ${CREDENTIALS_FILE} - COPIALAS Y ELIMINA ESTE ARCHIVO"

# ============================================================
# PASO 8: Configuración del Virtual Host de Nginx
# ============================================================
log_step "8/8: Configurando Virtual Host de Nginx"

if [[ -n "$DOMAIN" ]]; then
    cat > "/etc/nginx/sites-available/${DOMAIN}" << NGINXSITE
# ============================================================
# GoberVial - Virtual Host
# Dominio: ${DOMAIN}
# ============================================================

server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};

    # --- Rate Limiting ---
    limit_req zone=api_limit burst=20 nodelay;
    limit_conn conn_limit 10;

    # --- API Backend (Node.js / Express) ---
    location /api/ {
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    # --- Login endpoint con rate limit más estricto ---
    location /api/v1/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        proxy_pass http://127.0.0.1:${API_PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # --- Frontend Angular estático ---
    location / {
        root ${APP_DIR}/app;
        index index.html;
        try_files \$uri \$uri/ /index.html;

        # Caché para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }

    # --- Cabeceras de seguridad estrictas ---
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline' https://unpkg.com; img-src 'self' data: blob: https://*.tile.openstreetmap.org; connect-src 'self'; frame-src 'self'; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'" always;
    add_header Permissions-Policy "camera=(self), geolocation=(self), microphone=()" always;

    # --- Bloquear acceso a archivos sensibles ---
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~* \.(sql|log|md|sh|env|example)\$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINXSITE

    ln -sf "/etc/nginx/sites-available/${DOMAIN}" /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default

    nginx -t && systemctl reload nginx

    log_info "Virtual Host configurado para ${DOMAIN}"

    # Instalar Certbot para SSL/TLS
    log_info "Instalando Certbot para Let's Encrypt (ejecutar después de apuntar DNS)..."
    apt-get install -y certbot python3-certbot-nginx

    echo ""
    echo "============================================================"
    echo "  Certbot instalado. Cuando el DNS apunte al servidor,"
    echo "  ejecuta: sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
    echo "============================================================"
else
    # Configuración por defecto sin dominio (desarrollo/IP)
    cat > /etc/nginx/sites-available/default << 'NGINXDEFAULT'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    server_tokens off;

    limit_req zone=api_limit burst=20 nodelay;
    limit_conn conn_limit 10;

    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    location /api/v1/auth/login {
        limit_req zone=login_limit burst=3 nodelay;
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        root /var/www/gobervial/app;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }

    location ~* \.(sql|log|md|sh|env|example)$ {
        deny all;
        access_log off;
        log_not_found off;
    }
}
NGINXDEFAULT

    ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
    nginx -t && systemctl reload nginx
    log_info "Virtual Host por defecto configurado (sin dominio)."
fi

# ============================================================
# RESUMEN FINAL
# ============================================================
echo ""
echo "============================================================"
echo -e "${GREEN}  GOBERVIAL - SERVIDOR CONFIGURADO EXITOSAMENTE${NC}"
echo "============================================================"
echo ""
echo "  Sistema Operativo : Ubuntu $(lsb_release -rs)"
echo "  Node.js           : $(node -v)"
echo "  npm               : $(npm -v)"
echo "  MySQL             : $(mysql --version)"
echo "  Nginx             : $(nginx -v 2>&1)"
echo "  PM2               : $(pm2 -v)"
echo "  Firewall          : UFW Activo"
echo ""
echo "  Base de datos     : ${DB_NAME}"
echo "  Usuario DB        : ${DB_USER}"
echo "  Puerto API        : ${API_PORT}"
echo "  Directorio app    : ${APP_DIR}"
echo ""
echo   "  Próximos pasos:"
echo "  1. Importar schema.sql en MySQL:"
echo "     mysql -u ${DB_USER} -p ${DB_NAME} < database/schema.sql"
echo "  2. El .env ya fue generado en ${APP_DIR}/api/.env"
echo "  3. Desplegar backend con PM2"
echo "  4. Desplegar frontend Angular compilado en ${APP_DIR}/app/"
echo ""
echo -e "  ${YELLOW}CREDENCIALES: ${CREDENTIALS_FILE}${NC}"
echo "  Copia este archivo a tu gestor de contraseñas AHORA."
echo "  Luego elimínalo: shred -u ${CREDENTIALS_FILE}"
if [[ -n "$DOMAIN" ]]; then
    echo "  5. Ejecutar Certbot para SSL:"
    echo "     sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
fi
echo ""
echo "============================================================"
