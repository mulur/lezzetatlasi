# Lezzet Atlası - Uygulama ve Dağıtım Kılavuzu

## 1. Sistem Gereksinimleri

### Donanım Gereksinimleri (Production)

**Veritabanı Sunucusu (Master)**
- CPU: 8 core (minimum), 16 core (önerilen)
- RAM: 32 GB (minimum), 64 GB (önerilen)
- Disk: 500 GB SSD (NVMe önerilen)
- Network: 10 Gbps

**Veritabanı Sunucusu (Replicas)**
- CPU: 4 core (minimum), 8 core (önerilen)
- RAM: 16 GB (minimum), 32 GB (önerilen)
- Disk: 500 GB SSD
- Network: 10 Gbps

**Redis Cache Sunucusu**
- CPU: 4 core
- RAM: 16 GB (minimum), 32 GB (önerilen)
- Disk: 100 GB SSD (persistence için)
- Network: 10 Gbps

**Uygulama Sunucuları (N adet)**
- CPU: 4 core
- RAM: 8 GB
- Disk: 50 GB SSD
- Network: 1 Gbps

### Yazılım Gereksinimleri

- PostgreSQL 14+ (PostGIS extension ile)
- Redis 7.0+
- Node.js 18+ (veya tercih edilen runtime)
- Nginx/HAProxy (load balancer)
- Docker & Docker Compose (container deployment için)

## 2. Kurulum Adımları

### 2.1 PostgreSQL Kurulumu ve Yapılandırması

```bash
# PostgreSQL ve PostGIS kurulumu
sudo apt-get update
sudo apt-get install postgresql-14 postgresql-14-postgis-3

# PostgreSQL yapılandırması
sudo nano /etc/postgresql/14/main/postgresql.conf
```

**Önemli PostgreSQL Ayarları:**

```ini
# Connection Settings
max_connections = 200
superuser_reserved_connections = 3

# Memory Settings
shared_buffers = 8GB                    # %25 of total RAM
effective_cache_size = 24GB             # %75 of total RAM
maintenance_work_mem = 2GB
work_mem = 128MB
wal_buffers = 16MB

# Checkpoint Settings
checkpoint_completion_target = 0.9
wal_level = replica
max_wal_size = 4GB
min_wal_size = 1GB

# Query Planner
random_page_cost = 1.1                  # For SSD
effective_io_concurrency = 200          # For SSD

# Logging
logging_collector = on
log_directory = 'pg_log'
log_filename = 'postgresql-%Y-%m-%d_%H%M%S.log'
log_statement = 'ddl'
log_duration = off
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
log_checkpoints = on
log_connections = on
log_disconnections = on
log_lock_waits = on
log_temp_files = 0
log_autovacuum_min_duration = 0

# Autovacuum
autovacuum = on
autovacuum_max_workers = 4
autovacuum_naptime = 10s
autovacuum_vacuum_scale_factor = 0.05
autovacuum_analyze_scale_factor = 0.02

# Extensions
shared_preload_libraries = 'pg_stat_statements'
pg_stat_statements.max = 10000
pg_stat_statements.track = all
```

**pg_hba.conf ayarları:**

```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
host    lezzetatlasi    lezzetapp       10.0.0.0/8             scram-sha-256
host    replication     replicator      10.0.0.0/8             scram-sha-256
```

### 2.2 Veritabanı Oluşturma

```bash
# PostgreSQL kullanıcısı olarak
sudo -u postgres psql

-- Veritabanı ve kullanıcı oluştur
CREATE DATABASE lezzetatlasi;
CREATE USER lezzetapp WITH ENCRYPTED PASSWORD 'güçlü_şifre_buraya';
GRANT ALL PRIVILEGES ON DATABASE lezzetatlasi TO lezzetapp;

-- Extension'ları etkinleştir
\c lezzetatlasi
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Schema'yı yükle
\i /path/to/DATABASE_SCHEMA.sql

-- Maintenance query'lerini yükle
\i /path/to/MAINTENANCE.sql
```

### 2.3 Redis Kurulumu ve Yapılandırması

```bash
# Redis kurulumu
sudo apt-get install redis-server

# Redis yapılandırması
sudo nano /etc/redis/redis.conf
```

**Önemli Redis Ayarları:**

```ini
# Network
bind 0.0.0.0
protected-mode yes
requirepass güçlü_redis_şifresi

# Memory
maxmemory 16gb
maxmemory-policy allkeys-lru

# Persistence (optional - for important cache data)
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec

# Performance
tcp-backlog 511
timeout 0
tcp-keepalive 300
```

### 2.4 Uygulama Kurulumu

```bash
# Proje dizinine git
cd /opt/lezzetatlasi

# Bağımlılıkları kur
npm install

# Environment variables ayarla
cp .env.example .env
nano .env
```

**.env dosyası:**

```env
# Database
DB_MASTER_HOST=master-db.example.com
DB_REPLICA1_HOST=replica1-db.example.com
DB_NAME=lezzetatlasi
DB_USER=lezzetapp
DB_PASSWORD=güçlü_şifre_buraya
DB_PORT=5432

# Redis
REDIS_HOST=redis.example.com
REDIS_PORT=6379
REDIS_PASSWORD=güçlü_redis_şifresi

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# CDN
CDN_BASE_URL=https://cdn.lezzetatlasi.com
```

## 3. Replication Kurulumu (PostgreSQL)

### 3.1 Master Yapılandırması

```bash
# Master'da replication kullanıcısı oluştur
sudo -u postgres psql

CREATE USER replicator WITH REPLICATION ENCRYPTED PASSWORD 'replication_şifresi';
```

**postgresql.conf (Master):**

```ini
wal_level = replica
max_wal_senders = 10
max_replication_slots = 10
synchronous_commit = off
```

### 3.2 Replica Kurulumu

```bash
# Replica sunucusunda
# PostgreSQL servisini durdur
sudo systemctl stop postgresql

# Mevcut data dizinini yedekle
sudo mv /var/lib/postgresql/14/main /var/lib/postgresql/14/main.backup

# Master'dan base backup al
sudo -u postgres pg_basebackup -h master-db.example.com -D /var/lib/postgresql/14/main -U replicator -P -v -R -X stream -C -S replica1

# PostgreSQL'i başlat
sudo systemctl start postgresql
```

**Replication durumunu kontrol et:**

```sql
-- Master'da
SELECT * FROM pg_stat_replication;

-- Replica'da
SELECT * FROM pg_stat_wal_receiver;
```

## 4. Load Balancer Yapılandırması (Nginx)

```nginx
# /etc/nginx/sites-available/lezzetatlasi

upstream app_servers {
    least_conn;
    server app1.example.com:3000 max_fails=3 fail_timeout=30s;
    server app2.example.com:3000 max_fails=3 fail_timeout=30s;
    server app3.example.com:3000 max_fails=3 fail_timeout=30s;
}

# Rate limiting
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=search_limit:10m rate=5r/s;

server {
    listen 80;
    listen [::]:80;
    server_name api.lezzetatlasi.com;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.lezzetatlasi.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.lezzetatlasi.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.lezzetatlasi.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    # Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types application/json text/plain text/css application/javascript;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # API endpoints
    location /api/places {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/search {
        limit_req zone=search_limit burst=10 nodelay;
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api/ {
        limit_req zone=api_limit burst=20 nodelay;
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://app_servers;
        access_log off;
    }
}
```

## 5. Monitoring ve Alerting

### 5.1 Prometheus Metrics

```javascript
// metrics.js - Prometheus metrics exporter
const client = require('prom-client');

// Register default metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new client.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1, 5],
    registers: [register],
});

const cacheHitCounter = new client.Counter({
    name: 'cache_hits_total',
    help: 'Total number of cache hits',
    labelNames: ['cache_key_type'],
    registers: [register],
});

const cacheMissCounter = new client.Counter({
    name: 'cache_misses_total',
    help: 'Total number of cache misses',
    labelNames: ['cache_key_type'],
    registers: [register],
});

const dbQueryDuration = new client.Histogram({
    name: 'db_query_duration_seconds',
    help: 'Duration of database queries in seconds',
    labelNames: ['query_type'],
    buckets: [0.001, 0.01, 0.05, 0.1, 0.5, 1],
    registers: [register],
});

module.exports = {
    register,
    httpRequestDuration,
    cacheHitCounter,
    cacheMissCounter,
    dbQueryDuration,
};
```

### 5.2 Grafana Dashboard

**Panel 1: Request Rate**
```
rate(http_request_duration_seconds_count[5m])
```

**Panel 2: P95 Latency**
```
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
```

**Panel 3: Cache Hit Rate**
```
sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m]))) * 100
```

**Panel 4: Database Query Performance**
```
histogram_quantile(0.95, rate(db_query_duration_seconds_bucket[5m]))
```

## 6. Scheduled Jobs (Cron)

```bash
# /etc/cron.d/lezzetatlasi

# Refresh materialized views every 4 hours
0 */4 * * * postgres psql -d lezzetatlasi -c "SELECT refresh_all_materialized_views();" >> /var/log/lezzetatlasi/mv_refresh.log 2>&1

# Run daily maintenance at 2 AM
0 2 * * * postgres psql -d lezzetatlasi -c "SELECT daily_maintenance();" >> /var/log/lezzetatlasi/daily_maintenance.log 2>&1

# Vacuum critical tables daily at 3 AM
0 3 * * * postgres psql -d lezzetatlasi -c "VACUUM ANALYZE places; VACUUM ANALYZE reviews; VACUUM ANALYZE place_statistics;" >> /var/log/lezzetatlasi/vacuum.log 2>&1

# Archive old view logs weekly
0 4 * * 0 node /opt/lezzetatlasi/scripts/archive-view-logs.js >> /var/log/lezzetatlasi/archive.log 2>&1

# Backup database daily at 1 AM
0 1 * * * /usr/local/bin/backup-db.sh >> /var/log/lezzetatlasi/backup.log 2>&1
```

## 7. Backup Strategy

### 7.1 Database Backup Script

```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh

BACKUP_DIR="/backup/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="lezzetatlasi"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Full database backup
pg_dump -U postgres -Fc $DB_NAME > $BACKUP_DIR/${DB_NAME}_${DATE}.dump

# Backup specific tables (for faster restore)
pg_dump -U postgres -Fc -t places -t place_statistics $DB_NAME > $BACKUP_DIR/${DB_NAME}_critical_${DATE}.dump

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.dump" -mtime +7 -delete

# Upload to S3 (optional)
# aws s3 cp $BACKUP_DIR/${DB_NAME}_${DATE}.dump s3://lezzetatlasi-backups/

echo "Backup completed: ${DB_NAME}_${DATE}.dump"
```

### 7.2 Redis Backup

```bash
# Redis RDB snapshot
redis-cli BGSAVE

# Copy RDB file to backup location
cp /var/lib/redis/dump.rdb /backup/redis/dump_$(date +%Y%m%d).rdb
```

## 8. Deployment Checklist

### Pre-Production

- [ ] Database schema oluşturuldu
- [ ] Index'ler oluşturuldu
- [ ] Materialized view'lar oluşturuldu
- [ ] Trigger'lar oluşturuldu
- [ ] Functions oluşturuldu
- [ ] Initial data yüklendi (kategoriler, şehirler, vb.)
- [ ] Redis kuruldu ve yapılandırıldı
- [ ] Application deploy edildi
- [ ] Environment variables ayarlandı
- [ ] SSL sertifikaları yüklendi
- [ ] Load balancer yapılandırıldı

### Production Deployment

- [ ] Database replication kuruldu ve test edildi
- [ ] Cache warming script çalıştırıldı
- [ ] Monitoring kuruldu (Prometheus + Grafana)
- [ ] Alerting kuralları oluşturuldu
- [ ] Backup script'leri test edildi
- [ ] Cron job'lar ayarlandı
- [ ] Disaster recovery planı oluşturuldu
- [ ] Performance test yapıldı
- [ ] Security audit tamamlandı

### Post-Deployment

- [ ] Cache hit rate monitör edildi (target: >90%)
- [ ] Database performance monitör edildi
- [ ] Application logs kontrol edildi
- [ ] Error rate kontrol edildi (target: <0.1%)
- [ ] Response time kontrol edildi (target: <100ms)
- [ ] Resource usage kontrol edildi (CPU, RAM, Disk)

## 9. Troubleshooting

### Yavaş Query'ler

```sql
-- En yavaş query'leri bul
SELECT * FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;

-- EXPLAIN ANALYZE kullan
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM places WHERE city = 'İstanbul';
```

### Cache Problemleri

```bash
# Redis connection test
redis-cli -h redis.example.com -a password PING

# Cache hit rate kontrol
redis-cli INFO stats | grep keyspace

# Cache memory kullanımı
redis-cli INFO memory
```

### Replication Lag

```sql
-- Master'da
SELECT 
    client_addr,
    state,
    sent_lsn,
    write_lsn,
    flush_lsn,
    replay_lsn,
    write_lag,
    flush_lag,
    replay_lag
FROM pg_stat_replication;
```

## 10. Performance Tuning Tips

1. **Connection Pooling**: Her application instance için max 20 connection
2. **Query Timeout**: 30 saniye ile sınırla
3. **Cache TTL**: Sık değişen data için kısa (5 dk), statik data için uzun (1 gün)
4. **Index Maintenance**: Ayda bir REINDEX CONCURRENTLY çalıştır
5. **Materialized View Refresh**: Off-peak hours'da refresh et
6. **Monitoring**: Cache hit rate, query performance, error rate sürekli monitör et
7. **Scaling**: Read load artarsa replica sayısını artır
8. **CDN**: Static content'i CDN'e taşı

## 11. Kaynaklar

- PostgreSQL Documentation: https://www.postgresql.org/docs/
- PostGIS Documentation: https://postgis.net/docs/
- Redis Documentation: https://redis.io/documentation
- Nginx Documentation: https://nginx.org/en/docs/
- Node.js Best Practices: https://github.com/goldbergyoni/nodebestpractices
