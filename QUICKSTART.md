# Lezzet Atlası - Hızlı Başlangıç Kılavuzu

Bu kılavuz, Lezzet Atlası projesi için önerilen yüksek performanslı mimarinin hızlı bir şekilde uygulanması için adım adım talimatlar içerir.

## 🎯 Mimari Genel Bakış

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│              (Web, Mobile, API Clients)                  │
└───────────────────────┬─────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────┐
│                   Load Balancer                          │
│              (Nginx/HAProxy + SSL/TLS)                   │
└───────────────────────┬─────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   App        │ │   App        │ │   App        │
│  Server 1    │ │  Server 2    │ │  Server 3    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       └────────────────┼────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Redis      │ │  PostgreSQL  │ │  PostgreSQL  │
│   Cache      │ │   Master     │ │  Replica 1   │
│              │ │  (Write)     │ │   (Read)     │
└──────────────┘ └──────┬───────┘ └──────────────┘
                        │
                ┌───────▼────────┐
                │   PostgreSQL   │
                │   Replica 2    │
                │    (Read)      │
                └────────────────┘
```

## 📋 Kurulum Sırası

### Aşama 1: Veritabanı Kurulumu (30 dakika)

1. **PostgreSQL Kurulumu**
```bash
# PostgreSQL 14+ kur
sudo apt-get install postgresql-14 postgresql-14-postgis-3

# Veritabanı oluştur
sudo -u postgres createdb lezzetatlasi

# Extension'ları etkinleştir
sudo -u postgres psql lezzetatlasi << EOF
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS btree_gist;
EOF
```

2. **Şemayı Yükle**
```bash
sudo -u postgres psql lezzetatlasi < DATABASE_SCHEMA.sql
sudo -u postgres psql lezzetatlasi < MAINTENANCE.sql
```

3. **PostgreSQL Ayarları**
```bash
# postgresql.conf'u düzenle
sudo nano /etc/postgresql/14/main/postgresql.conf

# Önemli ayarlar (8GB RAM için örnek):
# shared_buffers = 2GB
# effective_cache_size = 6GB
# maintenance_work_mem = 512MB
# work_mem = 32MB

# Restart
sudo systemctl restart postgresql
```

### Aşama 2: Redis Kurulumu (10 dakika)

```bash
# Redis kur
sudo apt-get install redis-server

# Yapılandır
sudo nano /etc/redis/redis.conf

# Önemli ayarlar:
# maxmemory 2gb
# maxmemory-policy allkeys-lru

# Restart
sudo systemctl restart redis
```

### Aşama 3: Uygulama Kurulumu (15 dakika)

```bash
# Node.js kur (18+)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Proje dizini oluştur
sudo mkdir -p /opt/lezzetatlasi
cd /opt/lezzetatlasi

# Dosyaları kopyala
sudo cp cache-service.js /opt/lezzetatlasi/
sudo cp database-queries.js /opt/lezzetatlasi/

# Bağımlılıkları kur
npm init -y
npm install pg ioredis
```

### Aşama 4: Test Data Yükleme (20 dakika)

```bash
# Sample data script'i oluştur
cat > /tmp/load_sample_data.sql << 'EOF'
-- Kategoriler
INSERT INTO categories (name, slug, sort_order) VALUES
('Türk Mutfağı', 'turk-mutfagi', 1),
('İtalyan Mutfağı', 'italyan-mutfagi', 2),
('Fast Food', 'fast-food', 3),
('Kahve & Cafe', 'kahve-cafe', 4),
('Tatlı & Pastane', 'tatli-pastane', 5);

-- Örnek mekanlar
INSERT INTO places (name, slug, city, district, latitude, longitude, description, is_active) VALUES
('Mekan 1', 'mekan-1', 'İstanbul', 'Kadıköy', 40.9904, 29.0288, 'Örnek mekan açıklaması', true),
('Mekan 2', 'mekan-2', 'İstanbul', 'Beşiktaş', 41.0428, 29.0088, 'Örnek mekan açıklaması', true),
('Mekan 3', 'mekan-3', 'Ankara', 'Çankaya', 39.9189, 32.8544, 'Örnek mekan açıklaması', true),
('Mekan 4', 'mekan-4', 'İzmir', 'Konak', 38.4192, 27.1287, 'Örnek mekan açıklaması', true),
('Mekan 5', 'mekan-5', 'İstanbul', 'Şişli', 41.0602, 28.9887, 'Örnek mekan açıklaması', true);

-- İstatistikleri başlat
INSERT INTO place_statistics (place_id, updated_at)
SELECT id, NOW() FROM places;

-- Materialized view'ları ilk kez oluştur
REFRESH MATERIALIZED VIEW mv_top_places;
REFRESH MATERIALIZED VIEW mv_top_places_by_city;
REFRESH MATERIALIZED VIEW mv_top_places_by_category;
REFRESH MATERIALIZED VIEW mv_trending_places;
EOF

sudo -u postgres psql lezzetatlasi < /tmp/load_sample_data.sql
```

### Aşama 5: Doğrulama (10 dakika)

```bash
# PostgreSQL bağlantısını test et
psql lezzetatlasi -c "SELECT COUNT(*) FROM places;"

# Redis bağlantısını test et
redis-cli PING

# Index'lerin oluştuğunu kontrol et
psql lezzetatlasi -c "\di"

# Materialized view'ları kontrol et
psql lezzetatlasi -c "SELECT COUNT(*) FROM mv_top_places;"
```

## 🧪 Basit Test Senaryosu

### Node.js Test Script'i

```javascript
// test.js
const { Pool } = require('pg');
const Redis = require('ioredis');

// Database connection
const pool = new Pool({
    host: 'localhost',
    database: 'lezzetatlasi',
    user: 'postgres',
    max: 10,
});

// Redis connection
const redis = new Redis();

async function testDatabase() {
    console.log('Testing database...');
    const result = await pool.query('SELECT COUNT(*) FROM places');
    console.log(`✓ Total places: ${result.rows[0].count}`);
}

async function testCache() {
    console.log('\nTesting cache...');
    await redis.set('test:key', 'test:value', 'EX', 60);
    const value = await redis.get('test:key');
    console.log(`✓ Cache test: ${value}`);
}

async function testQuery() {
    console.log('\nTesting optimized query...');
    const start = Date.now();
    const result = await pool.query(`
        SELECT p.*, ps.average_rating, ps.total_reviews
        FROM places p
        LEFT JOIN place_statistics ps ON p.id = ps.place_id
        WHERE p.is_active = true
        LIMIT 10
    `);
    const duration = Date.now() - start;
    console.log(`✓ Query completed in ${duration}ms`);
    console.log(`✓ Found ${result.rows.length} places`);
}

async function testMaterializedView() {
    console.log('\nTesting materialized view...');
    const start = Date.now();
    const result = await pool.query('SELECT * FROM mv_top_places LIMIT 10');
    const duration = Date.now() - start;
    console.log(`✓ MV query completed in ${duration}ms`);
    console.log(`✓ Found ${result.rows.length} top places`);
}

async function runTests() {
    try {
        await testDatabase();
        await testCache();
        await testQuery();
        await testMaterializedView();
        console.log('\n✓ All tests passed!');
    } catch (error) {
        console.error('✗ Test failed:', error);
    } finally {
        await pool.end();
        await redis.quit();
    }
}

runTests();
```

```bash
# Test'i çalıştır
node test.js
```

## 📊 Performance Baseline Oluşturma

### 1. Query Performance Testi

```sql
-- Slow query'leri etkinleştir
ALTER SYSTEM SET log_min_duration_statement = 100;
SELECT pg_reload_conf();

-- Test query'leri çalıştır
EXPLAIN ANALYZE SELECT * FROM places WHERE city = 'İstanbul' LIMIT 20;
EXPLAIN ANALYZE SELECT * FROM mv_top_places LIMIT 100;

-- Performance baseline kaydet
SELECT 
    query,
    calls,
    mean_time,
    max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. Cache Performance Testi

```bash
# Redis benchmark
redis-benchmark -h localhost -p 6379 -n 100000 -c 50

# Expected results:
# GET: ~50,000+ ops/sec
# SET: ~40,000+ ops/sec
```

## 🔧 Günlük Bakım Kurulumu

### Cron Job'ları Oluştur

```bash
# Crontab'ı düzenle
sudo crontab -e -u postgres

# Aşağıdaki satırları ekle:

# Materialized view refresh (her 4 saatte)
0 */4 * * * psql lezzetatlasi -c "SELECT refresh_all_materialized_views();" >> /var/log/lezzetatlasi/mv_refresh.log 2>&1

# Daily maintenance (her gece 2'de)
0 2 * * * psql lezzetatlasi -c "SELECT daily_maintenance();" >> /var/log/lezzetatlasi/maintenance.log 2>&1

# Vacuum (her gece 3'te)
0 3 * * * psql lezzetatlasi -c "VACUUM ANALYZE places; VACUUM ANALYZE reviews; VACUUM ANALYZE place_statistics;" >> /var/log/lezzetatlasi/vacuum.log 2>&1
```

## 📈 Monitoring Kurulumu (Opsiyonel)

### Basit Log Monitoring

```bash
# Log dizini oluştur
sudo mkdir -p /var/log/lezzetatlasi
sudo chown postgres:postgres /var/log/lezzetatlasi

# Log rotation ayarla
sudo nano /etc/logrotate.d/lezzetatlasi

# Aşağıdaki içeriği ekle:
/var/log/lezzetatlasi/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
}
```

## ✅ Checklist

### Kurulum Tamamlandı Mı?

- [ ] PostgreSQL kuruldu ve çalışıyor
- [ ] Redis kuruldu ve çalışıyor
- [ ] Database schema yüklendi
- [ ] Extension'lar etkinleştirildi
- [ ] Index'ler oluşturuldu
- [ ] Materialized view'lar oluşturuldu
- [ ] Trigger'lar ve function'lar yüklendi
- [ ] Sample data yüklendi
- [ ] Test script'i çalıştı
- [ ] Cron job'lar ayarlandı
- [ ] Log monitoring kuruldu

### Performance Kontrol

- [ ] Query response time < 100ms
- [ ] Cache hit rate > 80%
- [ ] No slow queries in log
- [ ] Materialized views güncel
- [ ] Disk space yeterli (>50% free)

## 🚀 Sonraki Adımlar

1. **Production Ortamına Geçiş**
   - DEPLOYMENT.md dosyasını inceleyin
   - SSL/TLS sertifikalarını yapılandırın
   - Load balancer kurun
   - Backup stratejisi uygulayın

2. **Scaling**
   - Read replica ekleyin
   - Application server sayısını artırın
   - CDN entegrasyonu yapın

3. **Monitoring**
   - Prometheus + Grafana kurun
   - Alert kuralları oluşturun
   - Dashboard'lar hazırlayın

## 🆘 Sorun Giderme

### PostgreSQL bağlantı hatası
```bash
# PostgreSQL'in çalıştığını kontrol et
sudo systemctl status postgresql

# Log'ları kontrol et
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### Redis bağlantı hatası
```bash
# Redis'in çalıştığını kontrol et
sudo systemctl status redis

# Test bağlantı
redis-cli PING
```

### Yavaş query'ler
```sql
-- En yavaş query'leri bul
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 5;

-- EXPLAIN ANALYZE kullan
EXPLAIN (ANALYZE, BUFFERS) <your_query_here>;
```

## 📚 Ek Kaynaklar

- **Detaylı Dokümantasyon**: ARCHITECTURE.md
- **Production Deployment**: DEPLOYMENT.md
- **Maintenance Query'leri**: MAINTENANCE.sql
- **Database Schema**: DATABASE_SCHEMA.sql

## 💡 İpuçları

1. **Önce test verisi ile başlayın** - Production data'yı yüklemeden önce sistem testi yapın
2. **Cache warming yapın** - İlk kullanıcı deneyimini iyileştirmek için
3. **Monitoring kurun** - Sorunları erken tespit etmek için
4. **Backup stratejisi** - Günlük otomatik backup'lar ayarlayın
5. **Documentation** - Tüm değişiklikleri dokümante edin

---

**Tebrikler!** 🎉 Yüksek performanslı Lezzet Atlası mimariniz hazır!
