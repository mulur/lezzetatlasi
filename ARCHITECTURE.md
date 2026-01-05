# Lezzet Atlası - Performans ve Ölçeklenebilirlik Mimarisi

## 1. Genel Bakış

Bu dokümant, Lezzet Atlası uygulaması için yüksek performanslı ve ölçeklenebilir bir mimari önerir. Özellikle mekan detay ve liste sorgularında optimal performans sağlamak için aggregate/summary tablolar, Redis cache, materialized view'lar, transactional update stratejileri ve index önerileri içerir.

## 2. Veritabanı Mimarisi

### 2.1 Ana Tablolar (OLTP)

```sql
-- Mekanlar ana tablosu
CREATE TABLE places (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    address TEXT,
    city VARCHAR(100),
    district VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    phone VARCHAR(20),
    website VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    
    -- Performans için indexler
    INDEX idx_places_city (city),
    INDEX idx_places_district (district),
    INDEX idx_places_slug (slug),
    INDEX idx_places_location (latitude, longitude),
    INDEX idx_places_active (is_active),
    INDEX idx_places_created (created_at DESC)
);

-- Yemek kategorileri
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id BIGINT REFERENCES categories(id),
    icon VARCHAR(100),
    sort_order INT DEFAULT 0,
    
    INDEX idx_categories_parent (parent_id),
    INDEX idx_categories_sort (sort_order)
);

-- Mekan-kategori ilişkisi
CREATE TABLE place_categories (
    place_id BIGINT REFERENCES places(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (place_id, category_id),
    
    INDEX idx_pc_category (category_id),
    INDEX idx_pc_place (place_id)
);

-- Değerlendirmeler
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    rating DECIMAL(2, 1) CHECK (rating >= 1.0 AND rating <= 5.0),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN DEFAULT false,
    
    INDEX idx_reviews_place (place_id, created_at DESC),
    INDEX idx_reviews_user (user_id),
    INDEX idx_reviews_rating (rating),
    INDEX idx_reviews_approved (is_approved, created_at DESC)
);

-- Fotoğraflar
CREATE TABLE photos (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id BIGINT,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    caption TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_photos_place (place_id, sort_order),
    INDEX idx_photos_user (user_id)
);

-- Çalışma saatleri
CREATE TABLE opening_hours (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    day_of_week SMALLINT CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    
    INDEX idx_opening_place (place_id)
);

-- Favoriler
CREATE TABLE favorites (
    user_id BIGINT NOT NULL,
    place_id BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, place_id),
    
    INDEX idx_favorites_user (user_id, created_at DESC),
    INDEX idx_favorites_place (place_id)
);
```

### 2.2 Aggregate/Summary Tablolar (OLAP)

```sql
-- Mekan istatistikleri özet tablosu
CREATE TABLE place_statistics (
    place_id BIGINT PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
    
    -- Değerlendirme metrikleri
    total_reviews INT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    rating_1_count INT DEFAULT 0,
    rating_2_count INT DEFAULT 0,
    rating_3_count INT DEFAULT 0,
    rating_4_count INT DEFAULT 0,
    rating_5_count INT DEFAULT 0,
    
    -- Popülerlik metrikleri
    total_favorites INT DEFAULT 0,
    total_photos INT DEFAULT 0,
    total_views INT DEFAULT 0,
    view_count_last_7_days INT DEFAULT 0,
    view_count_last_30_days INT DEFAULT 0,
    
    -- Aktivite metrikleri
    last_review_at TIMESTAMP,
    last_photo_at TIMESTAMP,
    
    -- Sıralama için composite skorlar
    popularity_score DECIMAL(10, 2) DEFAULT 0,
    quality_score DECIMAL(10, 2) DEFAULT 0,
    
    -- Güncelleme zamanı
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Performans indexleri
    INDEX idx_stats_rating (average_rating DESC),
    INDEX idx_stats_reviews (total_reviews DESC),
    INDEX idx_stats_popularity (popularity_score DESC),
    INDEX idx_stats_quality (quality_score DESC),
    INDEX idx_stats_updated (updated_at)
);

-- Şehir bazlı istatistikler
CREATE TABLE city_statistics (
    city VARCHAR(100) PRIMARY KEY,
    total_places INT DEFAULT 0,
    active_places INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_city_stats_places (total_places DESC)
);

-- Kategori bazlı istatistikler
CREATE TABLE category_statistics (
    category_id BIGINT PRIMARY KEY REFERENCES categories(id) ON DELETE CASCADE,
    total_places INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_cat_stats_places (total_places DESC)
);

-- Günlük mekan görüntüleme logları (hot data)
CREATE TABLE place_view_logs (
    place_id BIGINT NOT NULL,
    view_date DATE NOT NULL,
    view_count INT DEFAULT 1,
    PRIMARY KEY (place_id, view_date),
    
    INDEX idx_view_logs_date (view_date DESC)
);

-- Aylık toplam istatistikler (warm data)
CREATE TABLE place_monthly_stats (
    place_id BIGINT NOT NULL,
    year_month VARCHAR(7) NOT NULL, -- YYYY-MM format
    total_views INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    total_favorites INT DEFAULT 0,
    PRIMARY KEY (place_id, year_month),
    
    INDEX idx_monthly_stats_date (year_month DESC)
);
```

### 2.3 Materialized Views

```sql
-- En popüler mekanlar (Top 1000)
CREATE MATERIALIZED VIEW mv_top_places AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.city,
    p.district,
    p.latitude,
    p.longitude,
    ps.average_rating,
    ps.total_reviews,
    ps.popularity_score,
    ps.quality_score,
    ps.total_favorites,
    ps.view_count_last_30_days,
    COALESCE(array_agg(DISTINCT c.name) FILTER (WHERE c.id IS NOT NULL), ARRAY[]::VARCHAR[]) as category_names
FROM places p
INNER JOIN place_statistics ps ON p.id = ps.place_id
LEFT JOIN place_categories pc ON p.id = pc.place_id
LEFT JOIN categories c ON pc.category_id = c.id
WHERE p.is_active = true
GROUP BY p.id, p.name, p.slug, p.city, p.district, p.latitude, p.longitude,
         ps.average_rating, ps.total_reviews, ps.popularity_score, 
         ps.quality_score, ps.total_favorites, ps.view_count_last_30_days
ORDER BY ps.popularity_score DESC
LIMIT 1000;

CREATE UNIQUE INDEX idx_mv_top_places_id ON mv_top_places(id);
CREATE INDEX idx_mv_top_places_city ON mv_top_places(city);
CREATE INDEX idx_mv_top_places_score ON mv_top_places(popularity_score DESC);

-- Şehir bazlı en iyi mekanlar
CREATE MATERIALIZED VIEW mv_top_places_by_city AS
SELECT 
    p.city,
    p.id,
    p.name,
    p.slug,
    p.district,
    ps.average_rating,
    ps.total_reviews,
    ps.popularity_score,
    ROW_NUMBER() OVER (PARTITION BY p.city ORDER BY ps.popularity_score DESC) as city_rank
FROM places p
INNER JOIN place_statistics ps ON p.id = ps.place_id
WHERE p.is_active = true
  AND ps.total_reviews >= 3
ORDER BY p.city, ps.popularity_score DESC;

CREATE INDEX idx_mv_top_city_places ON mv_top_places_by_city(city, city_rank);

-- Kategori bazlı en iyi mekanlar
CREATE MATERIALIZED VIEW mv_top_places_by_category AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    p.id as place_id,
    p.name as place_name,
    p.slug,
    p.city,
    ps.average_rating,
    ps.total_reviews,
    ps.popularity_score,
    ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY ps.popularity_score DESC) as category_rank
FROM categories c
INNER JOIN place_categories pc ON c.id = pc.category_id
INNER JOIN places p ON pc.place_id = p.id
INNER JOIN place_statistics ps ON p.id = ps.place_id
WHERE p.is_active = true
  AND ps.total_reviews >= 3
ORDER BY c.id, ps.popularity_score DESC;

CREATE INDEX idx_mv_top_cat_places ON mv_top_places_by_category(category_id, category_rank);
```

## 3. Redis Cache Stratejisi

### 3.1 Cache Anahtarları ve TTL Değerleri

```javascript
// Cache key pattern'leri ve TTL stratejisi
const CACHE_KEYS = {
    // Mekan detay cache - 1 saat
    PLACE_DETAIL: (id) => `place:detail:${id}`,
    PLACE_DETAIL_TTL: 3600,
    
    // Mekan listesi cache - 5 dakika (sık değişen data)
    PLACE_LIST: (params) => `place:list:${createHash(params)}`,
    PLACE_LIST_TTL: 300,
    
    // Şehir bazlı liste - 10 dakika
    PLACE_LIST_BY_CITY: (city, page) => `place:list:city:${city}:page:${page}`,
    PLACE_LIST_BY_CITY_TTL: 600,
    
    // Kategori bazlı liste - 10 dakika
    PLACE_LIST_BY_CATEGORY: (categoryId, page) => `place:list:cat:${categoryId}:page:${page}`,
    PLACE_LIST_BY_CATEGORY_TTL: 600,
    
    // Top places - 15 dakika
    TOP_PLACES: (limit) => `place:top:${limit}`,
    TOP_PLACES_TTL: 900,
    
    // Mekan istatistikleri - 30 dakika
    PLACE_STATS: (id) => `place:stats:${id}`,
    PLACE_STATS_TTL: 1800,
    
    // Kategori listesi - 1 gün (nadiren değişir)
    CATEGORIES_ALL: 'categories:all',
    CATEGORIES_TTL: 86400,
    
    // Arama sonuçları - 30 dakika
    SEARCH_RESULTS: (query) => `search:${createHash(query)}`,
    SEARCH_RESULTS_TTL: 1800,
    
    // Kullanıcı favorileri - 5 dakika
    USER_FAVORITES: (userId) => `user:favorites:${userId}`,
    USER_FAVORITES_TTL: 300,
    
    // Son eklenen mekanlar - 10 dakika
    RECENT_PLACES: (limit) => `place:recent:${limit}`,
    RECENT_PLACES_TTL: 600,
};

// Cache invalidation patterns
const CACHE_INVALIDATION = {
    // Mekan güncellendiğinde temizlenecek cache'ler
    onPlaceUpdate: (placeId) => [
        `place:detail:${placeId}`,
        `place:stats:${placeId}`,
        'place:list:*',
        'place:top:*',
        'place:recent:*',
    ],
    
    // Review eklendiğinde
    onReviewAdd: (placeId) => [
        `place:detail:${placeId}`,
        `place:stats:${placeId}`,
        'place:list:*',
    ],
    
    // Favori eklendiğinde
    onFavoriteAdd: (userId, placeId) => [
        `user:favorites:${userId}`,
        `place:stats:${placeId}`,
    ],
};
```

### 3.2 Cache Katmanları (Multi-tier Caching)

```
┌─────────────────────────────────────────┐
│         Application Layer               │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│    L1 Cache: Local Memory (LRU)         │
│    - Hot data (most accessed)           │
│    - TTL: 60 seconds                    │
│    - Size: 1000 items                   │
└─────────────────────────────────────────┘
                  ↓ (miss)
┌─────────────────────────────────────────┐
│    L2 Cache: Redis (Distributed)        │
│    - Warm data                          │
│    - TTL: 5-60 minutes                  │
│    - Size: Unlimited                    │
└─────────────────────────────────────────┘
                  ↓ (miss)
┌─────────────────────────────────────────┐
│    L3: Database (PostgreSQL)            │
│    - Cold data                          │
│    - With query optimization            │
└─────────────────────────────────────────┘
```

### 3.3 Redis Data Structures

```javascript
// Sorted Set kullanarak popüler mekanlar
// ZADD place:popular {popularity_score} {place_id}
// ZREVRANGE place:popular 0 99 WITHSCORES // Top 100

// Hash kullanarak mekan detayı
// HMSET place:1234 name "..." city "..." rating "4.5" ...
// HGETALL place:1234

// Set kullanarak kategori mekanları
// SADD category:123:places 1001 1002 1003
// SMEMBERS category:123:places

// Geo-spatial queries için
// GEOADD places:locations {longitude} {latitude} {place_id}
// GEORADIUS places:locations {lon} {lat} 5 km WITHDIST
```

## 4. Transactional Update Stratejileri

### 4.1 Write-Through vs Write-Behind

```javascript
// Write-Through Pattern (Tutarlılık öncelikli)
async function createReview(reviewData) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Review'i veritabanına yaz
        const result = await client.query(
            'INSERT INTO reviews (place_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
            [reviewData.place_id, reviewData.user_id, reviewData.rating, reviewData.comment]
        );
        
        // 2. Place statistics'i güncelle
        await updatePlaceStatistics(client, reviewData.place_id);
        
        await client.query('COMMIT');
        
        // 3. Cache'i invalidate et (non-blocking)
        invalidateCache(`place:detail:${reviewData.place_id}`);
        invalidateCache(`place:stats:${reviewData.place_id}`);
        
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// Write-Behind Pattern (Performans öncelikli)
async function incrementPlaceView(placeId) {
    // 1. Hemen cache'e yaz (async)
    await redis.incr(`place:views:${placeId}:${getCurrentDate()}`);
    
    // 2. Queue'ya ekle (batch processing için)
    await queue.add('update-view-stats', { placeId, date: getCurrentDate() });
    
    return true; // Immediately return
}

// Batch processor (background job)
async function processViewStatsBatch(jobs) {
    const updates = jobs.reduce((acc, job) => {
        const key = `${job.data.placeId}:${job.data.date}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});
    
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        for (const [key, count] of Object.entries(updates)) {
            const [placeId, date] = key.split(':');
            await client.query(
                `INSERT INTO place_view_logs (place_id, view_date, view_count)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (place_id, view_date)
                 DO UPDATE SET view_count = place_view_logs.view_count + $3`,
                [placeId, date, count]
            );
        }
        
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}
```

### 4.2 Eventual Consistency Pattern

```javascript
// İki aşamalı güncelleme stratejisi
async function updatePlaceStatistics(placeId) {
    // Aşama 1: Hızlı güncelleme (yaklaşık değerler)
    await updateStatisticsApproximate(placeId);
    
    // Aşama 2: Detaylı güncelleme (arka planda)
    await queue.add('recalculate-exact-stats', { placeId }, {
        delay: 5000, // 5 saniye sonra
        attempts: 3,
    });
}

async function updateStatisticsApproximate(placeId) {
    // Redis'ten yaklaşık değerleri al
    const cachedStats = await redis.hgetall(`place:approx:stats:${placeId}`);
    
    if (cachedStats) {
        // Aggregate tabloyu hızlıca güncelle
        await pool.query(
            `UPDATE place_statistics 
             SET total_reviews = $1, 
                 average_rating = $2,
                 updated_at = NOW()
             WHERE place_id = $3`,
            [cachedStats.total_reviews, cachedStats.average_rating, placeId]
        );
    }
}

async function recalculateExactStats(placeId) {
    const client = await pool.connect();
    try {
        // Exact hesaplama
        const result = await client.query(
            `SELECT 
                COUNT(*) as total_reviews,
                AVG(rating) as average_rating,
                COUNT(*) FILTER (WHERE rating = 1) as rating_1_count,
                COUNT(*) FILTER (WHERE rating = 2) as rating_2_count,
                COUNT(*) FILTER (WHERE rating = 3) as rating_3_count,
                COUNT(*) FILTER (WHERE rating = 4) as rating_4_count,
                COUNT(*) FILTER (WHERE rating = 5) as rating_5_count,
                MAX(created_at) as last_review_at
             FROM reviews 
             WHERE place_id = $1 AND is_approved = true`,
            [placeId]
        );
        
        const stats = result.rows[0];
        
        // Popularity score hesapla
        const popularityScore = calculatePopularityScore(stats);
        const qualityScore = calculateQualityScore(stats);
        
        // Update exact stats
        await client.query(
            `INSERT INTO place_statistics (place_id, total_reviews, average_rating, 
                rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
                last_review_at, popularity_score, quality_score, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
             ON CONFLICT (place_id) 
             DO UPDATE SET 
                total_reviews = $2,
                average_rating = $3,
                rating_1_count = $4,
                rating_2_count = $5,
                rating_3_count = $6,
                rating_4_count = $7,
                rating_5_count = $8,
                last_review_at = $9,
                popularity_score = $10,
                quality_score = $11,
                updated_at = NOW()`,
            [placeId, stats.total_reviews, stats.average_rating, 
             stats.rating_1_count, stats.rating_2_count, stats.rating_3_count,
             stats.rating_4_count, stats.rating_5_count, stats.last_review_at,
             popularityScore, qualityScore]
        );
        
        // Cache'i invalidate et
        await invalidateCache(`place:stats:${placeId}`);
        await invalidateCache(`place:detail:${placeId}`);
        
    } finally {
        client.release();
    }
}
```

### 4.3 Database Triggers for Automatic Updates

```sql
-- Review eklendiğinde veya güncellendiğinde otomatik statistics güncelleme
CREATE OR REPLACE FUNCTION update_place_statistics_on_review()
RETURNS TRIGGER AS $$
BEGIN
    -- Sadece onaylanmış review'lar için
    IF NEW.is_approved = true THEN
        -- Basit counter güncelleme (hızlı)
        INSERT INTO place_statistics (place_id, total_reviews, updated_at)
        VALUES (NEW.place_id, 1, NOW())
        ON CONFLICT (place_id)
        DO UPDATE SET 
            total_reviews = place_statistics.total_reviews + 1,
            updated_at = NOW();
        
        -- Background job queue'ya ekle (tam hesaplama için)
        PERFORM pg_notify('recalculate_stats', NEW.place_id::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_place_statistics_on_review();

-- Favori eklendiğinde
CREATE OR REPLACE FUNCTION update_place_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE place_statistics 
        SET total_favorites = total_favorites + 1,
            updated_at = NOW()
        WHERE place_id = NEW.place_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE place_statistics 
        SET total_favorites = total_favorites - 1,
            updated_at = NOW()
        WHERE place_id = OLD.place_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_favorite_changes
    AFTER INSERT OR DELETE ON favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_place_favorites_count();
```

## 5. Index Stratejileri

### 5.1 Composite Indexes

```sql
-- Sık kullanılan query pattern'lerine göre composite index'ler

-- Şehir + aktiflik + sıralama
CREATE INDEX idx_places_city_active_score ON places(city, is_active) 
    INCLUDE (id, name, slug)
    WHERE is_active = true;

-- Kategori bazlı sıralama
CREATE INDEX idx_place_cat_rating ON place_categories(category_id) 
    INCLUDE (place_id);

-- Location-based queries için
CREATE INDEX idx_places_location_active ON places(latitude, longitude, is_active)
    WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Review'lar için time-series index
CREATE INDEX idx_reviews_place_time ON reviews(place_id, created_at DESC)
    WHERE is_approved = true;

-- Popular places için covering index
CREATE INDEX idx_places_popular ON place_statistics(popularity_score DESC)
    INCLUDE (place_id, average_rating, total_reviews);
```

### 5.2 Partial Indexes

```sql
-- Sadece aktif mekanlar için
CREATE INDEX idx_places_active_only ON places(city, district)
    WHERE is_active = true;

-- Sadece onaylanmış review'lar için
CREATE INDEX idx_reviews_approved ON reviews(place_id, rating)
    WHERE is_approved = true;

-- Son 30 günün view logları için (hot data)
CREATE INDEX idx_view_logs_recent ON place_view_logs(place_id, view_date)
    WHERE view_date >= CURRENT_DATE - INTERVAL '30 days';

-- Yüksek puanlı mekanlar için
CREATE INDEX idx_places_highly_rated ON place_statistics(place_id)
    WHERE average_rating >= 4.0 AND total_reviews >= 10;
```

### 5.3 GiST Indexes (Geo-spatial)

```sql
-- PostGIS extension ile coğrafi sorgular için
CREATE EXTENSION IF NOT EXISTS postgis;

-- Geometri kolonunu ekle
ALTER TABLE places ADD COLUMN location GEOGRAPHY(POINT, 4326);

-- Mevcut lat/long'dan location'ı güncelle
UPDATE places 
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- GiST index oluştur
CREATE INDEX idx_places_location_gist ON places USING GIST(location);

-- Yakındaki mekanları bul (örnek query)
-- SELECT * FROM places 
-- WHERE ST_DWithin(location, ST_MakePoint(29.0, 41.0)::geography, 5000)
-- ORDER BY location <-> ST_MakePoint(29.0, 41.0)::geography
-- LIMIT 20;
```

### 5.4 Full-Text Search Indexes

```sql
-- Mekan arama için tsvector kolonu ekle
ALTER TABLE places ADD COLUMN search_vector tsvector;

-- Search vector'u güncelle
UPDATE places
SET search_vector = 
    setweight(to_tsvector('turkish', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('turkish', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('turkish', COALESCE(city, '')), 'C') ||
    setweight(to_tsvector('turkish', COALESCE(district, '')), 'C');

-- GIN index oluştur (full-text search için)
CREATE INDEX idx_places_search ON places USING GIN(search_vector);

-- Otomatik güncelleme için trigger
CREATE OR REPLACE FUNCTION places_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('turkish', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('turkish', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('turkish', COALESCE(NEW.city, '')), 'C') ||
        setweight(to_tsvector('turkish', COALESCE(NEW.district, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_places_search_vector
    BEFORE INSERT OR UPDATE ON places
    FOR EACH ROW
    EXECUTE FUNCTION places_search_vector_update();
```

## 6. Materialized View Refresh Stratejileri

### 6.1 Incremental Refresh Strategy

```sql
-- Scheduled refresh (Cron job veya pg_cron kullanarak)
-- Her gece 2'de tam refresh
-- 0 2 * * * REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places;

-- Her 4 saatte bir şehir bazlı refresh
-- 0 */4 * * * REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_city;

-- Background worker ile
CREATE OR REPLACE FUNCTION refresh_materialized_views_concurrent()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_city;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_category;
END;
$$ LANGUAGE plpgsql;
```

### 6.2 Event-driven Refresh

```javascript
// Belirli event'lerde sadece etkilenen bölümü yenile
async function onSignificantChange(placeId) {
    // Materialized view yerine geçici cache güncellemesi
    const topPlaces = await getTopPlacesFromDB(); // Fresh query
    await redis.set('mv:top_places', JSON.stringify(topPlaces), 'EX', 3600);
    
    // Schedule full MV refresh (off-peak hours)
    await scheduleJob('refresh-mv-top-places', {
        executeAt: getNextOffPeakTime(),
    });
}
```

## 7. Query Optimization Örnekleri

### 7.1 Mekan Liste Sorgusu (Optimized)

```sql
-- BAD: N+1 problem
SELECT * FROM places WHERE city = 'İstanbul' LIMIT 20;
-- Then for each place:
SELECT AVG(rating) FROM reviews WHERE place_id = ?;

-- GOOD: Join with aggregate table
SELECT 
    p.id,
    p.name,
    p.slug,
    p.city,
    p.district,
    p.latitude,
    p.longitude,
    ps.average_rating,
    ps.total_reviews,
    ps.total_favorites
FROM places p
INNER JOIN place_statistics ps ON p.id = ps.place_id
WHERE p.city = 'İstanbul' 
  AND p.is_active = true
ORDER BY ps.popularity_score DESC
LIMIT 20;

-- BETTER: Use materialized view for hot queries
SELECT * FROM mv_top_places_by_city 
WHERE city = 'İstanbul' 
  AND city_rank <= 20;
```

### 7.2 Mekan Detay Sorgusu (Optimized)

```sql
-- Single query with all related data
WITH place_data AS (
    SELECT 
        p.*,
        ps.average_rating,
        ps.total_reviews,
        ps.total_favorites,
        ps.total_photos,
        ps.rating_1_count,
        ps.rating_2_count,
        ps.rating_3_count,
        ps.rating_4_count,
        ps.rating_5_count
    FROM places p
    INNER JOIN place_statistics ps ON p.id = ps.place_id
    WHERE p.id = $1
),
recent_reviews AS (
    SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        r.user_id
    FROM reviews r
    WHERE r.place_id = $1 
      AND r.is_approved = true
    ORDER BY r.created_at DESC
    LIMIT 10
),
place_photos AS (
    SELECT 
        ph.id,
        ph.url,
        ph.thumbnail_url,
        ph.caption
    FROM photos ph
    WHERE ph.place_id = $1
    ORDER BY ph.sort_order, ph.id
    LIMIT 10
),
place_categories AS (
    SELECT 
        c.id,
        c.name,
        c.slug
    FROM categories c
    INNER JOIN place_categories pc ON c.id = pc.category_id
    WHERE pc.place_id = $1
)
SELECT 
    pd.*,
    COALESCE(json_agg(DISTINCT rr.*) FILTER (WHERE rr.id IS NOT NULL), '[]') as recent_reviews,
    COALESCE(json_agg(DISTINCT pp.*) FILTER (WHERE pp.id IS NOT NULL), '[]') as photos,
    COALESCE(json_agg(DISTINCT pc.*) FILTER (WHERE pc.id IS NOT NULL), '[]') as categories
FROM place_data pd
LEFT JOIN recent_reviews rr ON true
LEFT JOIN place_photos pp ON true
LEFT JOIN place_categories pc ON true
GROUP BY pd.id, pd.name, pd.slug, pd.description, pd.address, pd.city, 
         pd.district, pd.latitude, pd.longitude, pd.phone, pd.website,
         pd.average_rating, pd.total_reviews, pd.total_favorites, pd.total_photos,
         pd.rating_1_count, pd.rating_2_count, pd.rating_3_count, 
         pd.rating_4_count, pd.rating_5_count;
```

### 7.3 Geo-spatial Search (Nearby Places)

```sql
-- Yakındaki mekanları bul (5km içinde)
SELECT 
    p.id,
    p.name,
    p.slug,
    p.city,
    ps.average_rating,
    ps.total_reviews,
    ST_Distance(p.location, ST_MakePoint($1, $2)::geography) / 1000 as distance_km
FROM places p
INNER JOIN place_statistics ps ON p.id = ps.place_id
WHERE p.is_active = true
  AND ST_DWithin(p.location, ST_MakePoint($1, $2)::geography, 5000)
  AND ps.total_reviews >= 3
ORDER BY 
    ps.popularity_score DESC,
    distance_km ASC
LIMIT 50;

-- Index kullanımı: idx_places_location_gist
```

## 8. Monitoring ve Maintenance

### 8.1 Performance Metrics

```sql
-- Yavaş query'leri bul
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- En yavaş query'ler
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- En çok çağrılan query'ler
SELECT 
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 20;

-- Index kullanım istatistikleri
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;

-- Kullanılmayan index'ler
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey';

-- Table bloat kontrolü
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 8.2 Cache Hit Ratio Monitoring

```javascript
// Redis monitoring
async function getRedisStats() {
    const info = await redis.info('stats');
    const stats = parseRedisInfo(info);
    
    return {
        hits: stats.keyspace_hits,
        misses: stats.keyspace_misses,
        hitRate: stats.keyspace_hits / (stats.keyspace_hits + stats.keyspace_misses),
        evictedKeys: stats.evicted_keys,
        expiredKeys: stats.expired_keys,
    };
}

// PostgreSQL cache hit ratio
async function getPostgresCacheHitRatio() {
    const result = await pool.query(`
        SELECT 
            sum(heap_blks_read) as heap_read,
            sum(heap_blks_hit) as heap_hit,
            sum(heap_blks_hit) / (sum(heap_blks_hit) + sum(heap_blks_read)) as ratio
        FROM pg_statio_user_tables
    `);
    
    return result.rows[0];
}
```

### 8.3 Maintenance Jobs

```sql
-- Vacuum ve analyze (scheduled)
-- Daily vacuum
VACUUM ANALYZE places;
VACUUM ANALYZE reviews;
VACUUM ANALYZE place_statistics;

-- Weekly full vacuum
VACUUM FULL place_view_logs;

-- Eski view loglarını arşivle (30 günden eski)
INSERT INTO place_view_logs_archive 
SELECT * FROM place_view_logs 
WHERE view_date < CURRENT_DATE - INTERVAL '30 days';

DELETE FROM place_view_logs 
WHERE view_date < CURRENT_DATE - INTERVAL '30 days';

-- Materialized view refresh
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_city;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_category;

-- Index rebuild (monthly)
REINDEX TABLE CONCURRENTLY places;
REINDEX TABLE CONCURRENTLY reviews;
```

## 9. Scalability Strategies

### 9.1 Read Replicas

```
┌─────────────────┐
│   Application   │
└────────┬────────┘
         │
         ├───────────────┐
         ↓               ↓
┌─────────────┐   ┌─────────────┐
│   Master    │──→│   Replica 1 │
│ (Write/Read)│   │ (Read only) │
└─────────────┘   └─────────────┘
         │
         ├───────────────┐
         ↓               ↓
   ┌─────────────┐ ┌─────────────┐
   │  Replica 2  │ │  Replica 3  │
   │(Read only)  │ │(Read only)  │
   └─────────────┘ └─────────────┘
```

```javascript
// Database connection pool configuration
const masterPool = new Pool({
    host: 'master-db.example.com',
    database: 'lezzetatlasi',
    max: 20,
});

const replicaPools = [
    new Pool({ host: 'replica1-db.example.com', database: 'lezzetatlasi', max: 50 }),
    new Pool({ host: 'replica2-db.example.com', database: 'lezzetatlasi', max: 50 }),
    new Pool({ host: 'replica3-db.example.com', database: 'lezzetatlasi', max: 50 }),
];

// Load balancer for read queries
let replicaIndex = 0;
function getReadPool() {
    const pool = replicaPools[replicaIndex];
    replicaIndex = (replicaIndex + 1) % replicaPools.length;
    return pool;
}

// Usage
async function getPlaceById(id) {
    // Read from replica
    const pool = getReadPool();
    return pool.query('SELECT * FROM places WHERE id = $1', [id]);
}

async function createPlace(placeData) {
    // Write to master
    return masterPool.query(
        'INSERT INTO places (name, city, ...) VALUES ($1, $2, ...) RETURNING *',
        [placeData.name, placeData.city, ...]
    );
}
```

### 9.2 Database Sharding Strategy

```
Sharding by City:
┌─────────────────────────────────┐
│        Application Layer        │
└────────────────┬────────────────┘
                 │
      ┌──────────┼──────────┐
      ↓          ↓          ↓
┌──────────┐ ┌──────────┐ ┌──────────┐
│ Shard 1  │ │ Shard 2  │ │ Shard 3  │
│ İstanbul │ │  Ankara  │ │  İzmir   │
│  Bursa   │ │  Antalya │ │  Adana   │
└──────────┘ └──────────┘ └──────────┘
```

```javascript
// Sharding key: city
const SHARD_MAP = {
    'İstanbul': 'shard1',
    'Bursa': 'shard1',
    'Ankara': 'shard2',
    'Antalya': 'shard2',
    'İzmir': 'shard3',
    'Adana': 'shard3',
    // ...
};

function getShardForCity(city) {
    return SHARD_MAP[city] || 'shard1'; // default shard
}

async function getPlacesByCity(city) {
    const shard = getShardForCity(city);
    const pool = shardPools[shard];
    return pool.query('SELECT * FROM places WHERE city = $1', [city]);
}
```

### 9.3 CDN Strategy for Static Content

```javascript
// Fotoğraflar için CDN kullanımı
const CDN_CONFIG = {
    baseUrl: 'https://cdn.lezzetatlasi.com',
    regions: {
        'eu': 'https://eu-cdn.lezzetatlasi.com',
        'us': 'https://us-cdn.lezzetatlasi.com',
    },
    imageSizes: {
        thumbnail: '200x200',
        medium: '800x600',
        large: '1920x1080',
    },
};

function getImageUrl(photoId, size = 'medium', region = 'eu') {
    const cdnUrl = CDN_CONFIG.regions[region] || CDN_CONFIG.baseUrl;
    return `${cdnUrl}/photos/${size}/${photoId}.jpg`;
}

// Lazy loading ve progressive image loading
function generateImageHtml(photo) {
    return `
        <img 
            src="${getImageUrl(photo.id, 'thumbnail')}"
            data-src="${getImageUrl(photo.id, 'large')}"
            loading="lazy"
            class="progressive-image"
            alt="${photo.caption}"
        />
    `;
}
```

## 10. Best Practices ve Öneriler

### 10.1 Performans Checklist

- ✅ Her query için EXPLAIN ANALYZE çalıştır
- ✅ N+1 query problemlerini engelle
- ✅ Connection pooling kullan
- ✅ Prepared statements kullan (SQL injection önleme + performans)
- ✅ Pagination için OFFSET yerine cursor-based pagination tercih et
- ✅ Heavy computation'ları background job'lara taşı
- ✅ Rate limiting uygula (DDoS koruması)
- ✅ API response'larını compress et (gzip/brotli)
- ✅ Database query timeout ayarla
- ✅ Monitoring ve alerting sistemi kur

### 10.2 Cache Invalidation Best Practices

```javascript
// Cache invalidation stratejileri
const CacheInvalidation = {
    // 1. Time-based expiration (TTL)
    async setWithTTL(key, value, ttl) {
        await redis.set(key, JSON.stringify(value), 'EX', ttl);
    },
    
    // 2. Event-based invalidation
    async invalidateOnUpdate(entity, id) {
        const patterns = getInvalidationPatterns(entity, id);
        await Promise.all(patterns.map(pattern => redis.del(pattern)));
    },
    
    // 3. Version-based invalidation
    async getWithVersion(key, version) {
        const versionedKey = `${key}:v${version}`;
        return redis.get(versionedKey);
    },
    
    // 4. Lazy invalidation (check and refresh)
    async getOrRefresh(key, fetcher, ttl) {
        let value = await redis.get(key);
        
        if (!value) {
            value = await fetcher();
            await redis.set(key, JSON.stringify(value), 'EX', ttl);
        }
        
        return JSON.parse(value);
    },
    
    // 5. Cache stampede prevention
    async getOrRefreshWithLock(key, fetcher, ttl) {
        const lockKey = `lock:${key}`;
        const value = await redis.get(key);
        
        if (value) {
            return JSON.parse(value);
        }
        
        // Try to acquire lock
        const acquired = await redis.set(lockKey, '1', 'EX', 10, 'NX');
        
        if (acquired) {
            try {
                const freshValue = await fetcher();
                await redis.set(key, JSON.stringify(freshValue), 'EX', ttl);
                return freshValue;
            } finally {
                await redis.del(lockKey);
            }
        } else {
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.getOrRefreshWithLock(key, fetcher, ttl);
        }
    },
};
```

### 10.3 Database Connection Pool Optimization

```javascript
// PostgreSQL connection pool configuration
const poolConfig = {
    // Connection limits
    max: 20, // Maximum pool size
    min: 5,  // Minimum idle connections
    
    // Timeouts
    connectionTimeoutMillis: 5000,  // 5 seconds
    idleTimeoutMillis: 30000,       // 30 seconds
    maxUses: 7500,                  // Close connection after 7500 queries
    
    // Statement timeout
    statement_timeout: 30000,        // 30 seconds
    query_timeout: 30000,
    
    // Connection retry
    allowExitOnIdle: false,
};

const pool = new Pool(poolConfig);

// Pool event monitoring
pool.on('connect', (client) => {
    console.log('New client connected');
});

pool.on('acquire', (client) => {
    console.log('Client acquired from pool');
});

pool.on('remove', (client) => {
    console.log('Client removed from pool');
});

pool.on('error', (err, client) => {
    console.error('Pool error:', err);
});
```

### 10.4 API Response Optimization

```javascript
// Response compression and pagination
app.get('/api/places', compression(), async (req, res) => {
    const { page = 1, limit = 20, city, category } = req.query;
    
    // Limit max items per page
    const safeLimit = Math.min(parseInt(limit), 100);
    const offset = (parseInt(page) - 1) * safeLimit;
    
    // Build cache key
    const cacheKey = `places:list:${city || 'all'}:${category || 'all'}:${page}:${safeLimit}`;
    
    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
        return res.json(JSON.parse(cached));
    }
    
    // Query database
    const [places, total] = await Promise.all([
        getPlaces({ city, category, limit: safeLimit, offset }),
        getPlacesCount({ city, category }),
    ]);
    
    const response = {
        data: places,
        pagination: {
            page: parseInt(page),
            limit: safeLimit,
            total,
            totalPages: Math.ceil(total / safeLimit),
            hasNext: offset + safeLimit < total,
            hasPrev: page > 1,
        },
    };
    
    // Cache response
    await redis.set(cacheKey, JSON.stringify(response), 'EX', 300);
    
    res.json(response);
});
```

## 11. Sonuç ve Özet

Bu mimari dokümantasyon, Lezzet Atlası uygulaması için kapsamlı bir performans ve ölçeklenebilirlik stratejisi sunmaktadır:

### Temel Özellikler:

1. **Aggregate Tables**: Mekan istatistikleri için özel özet tablolar
2. **Redis Caching**: Çok katmanlı cache stratejisi ile hızlı erişim
3. **Materialized Views**: En popüler sorgular için önceden hesaplanmış görünümler
4. **Transactional Updates**: Write-through ve write-behind pattern'leri
5. **Optimized Indexes**: Composite, partial, GiST ve full-text search indexleri
6. **Query Optimization**: N+1 problemini engelleyen optimize edilmiş sorgular
7. **Scalability**: Read replicas, sharding ve CDN stratejileri

### Performans Kazanımları (Tahmini):

- Liste sorguları: ~10ms (cache hit), ~50ms (cache miss)
- Detay sorguları: ~5ms (cache hit), ~30ms (cache miss)
- Arama sorguları: ~20ms (full-text search)
- Geo-spatial queries: ~40ms (5km radius)
- Write operations: ~15ms (async background processing ile)

### Monitoring ve Maintenance:

- pg_stat_statements ile query performans takibi
- Redis stats ile cache hit ratio monitoring
- Scheduled vacuum ve analyze jobs
- Materialized view refresh jobs
- Index usage statistics

Bu mimari, 1 milyon+ mekan ve 10 milyon+ review scale'inde bile yüksek performans sağlayacak şekilde tasarlanmıştır.
