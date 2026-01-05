# Lezzet Atlası - High-Performance Architecture

Bu repository, Lezzet Atlası projesi için yüksek performanslı ve ölçeklenebilir mimari dokümantasyonu, veritabanı şemaları ve uygulama örnek kodlarını içerir.

## 📋 İçerik

### Dokümantasyon

- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detaylı mimari dokümantasyonu
  - Aggregate/summary tablolar
  - Redis cache stratejisi
  - Materialized view'lar
  - Transactional update stratejileri
  - Index önerileri
  - Query optimizasyonu
  - Ölçeklenebilirlik stratejileri

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Dağıtım ve kurulum kılavuzu
  - Sistem gereksinimleri
  - PostgreSQL kurulumu ve yapılandırması
  - Redis kurulumu
  - Replication kurulumu
  - Load balancer yapılandırması
  - Monitoring ve alerting
  - Backup stratejisi

### Kod ve Şemalar

- **[DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql)** - PostgreSQL veritabanı şeması
  - Ana tablolar (places, reviews, photos, vb.)
  - Aggregate/summary tablolar
  - Materialized view'lar
  - Trigger'lar ve function'lar
  - Index'ler

- **[MAINTENANCE.sql](MAINTENANCE.sql)** - Bakım ve monitoring sorguları
  - Performance monitoring
  - Index kullanım istatistikleri
  - Cache hit ratio kontrolü
  - Maintenance prosedürleri

- **[cache-service.js](cache-service.js)** - Redis cache implementasyonu
  - Multi-tier caching (L1 + L2)
  - Cache invalidation stratejileri
  - Cache stampede prevention
  - Geo-spatial caching

- **[database-queries.js](database-queries.js)** - Optimize edilmiş veritabanı sorguları
  - Mekan detay ve liste sorguları
  - Full-text search
  - Geo-spatial queries
  - Review ve istatistik sorguları

## 🚀 Hızlı Başlangıç

### 1. Veritabanı Kurulumu

```bash
# PostgreSQL veritabanı oluştur
createdb lezzetatlasi

# Extension'ları yükle
psql lezzetatlasi -c "CREATE EXTENSION postgis;"
psql lezzetatlasi -c "CREATE EXTENSION pg_stat_statements;"

# Şemayı yükle
psql lezzetatlasi < DATABASE_SCHEMA.sql

# Maintenance prosedürlerini yükle
psql lezzetatlasi < MAINTENANCE.sql
```

### 2. Redis Kurulumu

```bash
# Redis'i başlat
redis-server

# Veya Docker ile
docker run -d -p 6379:6379 redis:7-alpine
```

### 3. Uygulama Kurulumu

```bash
# Bağımlılıkları yükle
npm install

# Environment variables ayarla
cp .env.example .env

# Uygulamayı başlat
npm start
```

## 📊 Performans Hedefleri

Bu mimari ile ulaşılabilecek performans metrikleri:

| Metrik | Hedef | Notlar |
|--------|-------|--------|
| Mekan liste sorgusu | <50ms | Cache hit ile ~10ms |
| Mekan detay sorgusu | <30ms | Cache hit ile ~5ms |
| Arama sorgusu | <100ms | Full-text search ile |
| Geo-spatial sorgu | <50ms | PostGIS GiST index ile |
| Cache hit rate | >90% | Multi-tier caching ile |
| Database cache hit | >99% | Uygun indexing ile |
| Concurrent users | 10,000+ | Read replica'lar ile |
| Write throughput | 1,000 TPS | Async processing ile |

## 🏗️ Mimari Özellikleri

### Veritabanı Katmanı

- **OLTP Tablolar**: Transactional operations için normalize edilmiş tablolar
- **OLAP Tablolar**: Analytics ve reporting için aggregate tablolar
- **Materialized Views**: En popüler sorgular için önceden hesaplanmış görünümler
- **Indexing**: Composite, partial, GiST ve full-text search indexleri
- **Triggers**: Otomatik istatistik güncellemeleri için

### Cache Katmanı

- **L1 Cache**: Application memory'de LRU cache (60 saniye)
- **L2 Cache**: Redis distributed cache (5-60 dakika)
- **Cache Invalidation**: Event-driven invalidation stratejisi
- **Cache Stampede Prevention**: Lock-based synchronization

### Ölçeklenebilirlik

- **Read Replicas**: Read load'u dağıtmak için
- **Sharding**: Geo-based sharding stratejisi
- **CDN**: Static content için
- **Load Balancing**: Multiple application instances

## 📈 Monitoring

### Key Metrics

```sql
-- Cache hit ratio (>99% hedeflenir)
SELECT * FROM pg_stat_database WHERE datname = 'lezzetatlasi';

-- En yavaş query'ler
SELECT * FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;

-- Index kullanımı
SELECT * FROM pg_stat_user_indexes ORDER BY idx_scan DESC;
```

### Grafana Dashboards

- Request rate ve latency
- Cache hit rate
- Database performance
- Error rate
- Resource utilization

## 🔧 Maintenance

### Günlük Görevler

```bash
# Daily maintenance function'ını çalıştır
psql lezzetatlasi -c "SELECT daily_maintenance();"
```

### Periyodik Görevler

- **4 saatte bir**: Materialized view refresh
- **Günlük**: Vacuum analyze critical tables
- **Haftalık**: View logs arşivleme
- **Aylık**: Full reindex

## 🔐 Güvenlik

- Connection pooling ile resource limiting
- Rate limiting (100 req/min per IP)
- SQL injection koruması (prepared statements)
- XSS koruması (input sanitization)
- HTTPS/TLS encryption
- Redis password authentication

## 📚 Daha Fazla Bilgi

- [ARCHITECTURE.md](ARCHITECTURE.md) - Detaylı mimari açıklamaları
- [DEPLOYMENT.md](DEPLOYMENT.md) - Production deployment kılavuzu
- [DATABASE_SCHEMA.sql](DATABASE_SCHEMA.sql) - Tam veritabanı şeması
- [MAINTENANCE.sql](MAINTENANCE.sql) - Monitoring ve maintenance sorguları

## 🤝 Katkıda Bulunma

Bu dokümantasyon sürekli geliştirilmektedir. Önerileriniz için issue açabilir veya pull request gönderebilirsiniz.

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

---

**Not**: Bu repository, Lezzet Atlası projesi için performans ve ölçeklenebilirlik mimarisi önerilerini içerir. Production ortamına geçmeden önce kendi gereksinimlerinize göre özelleştirmeniz önerilir.