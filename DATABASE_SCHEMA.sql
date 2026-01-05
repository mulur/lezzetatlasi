-- =============================================
-- Lezzet Atlası - Database Schema
-- High-Performance Architecture
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- =============================================
-- 1. CORE TABLES (OLTP)
-- =============================================

-- Places (Main table)
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
    location GEOGRAPHY(POINT, 4326),
    phone VARCHAR(20),
    website VARCHAR(255),
    email VARCHAR(255),
    price_range SMALLINT CHECK (price_range >= 1 AND price_range <= 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    search_vector tsvector
);

-- Indexes for places
CREATE INDEX idx_places_city ON places(city) WHERE is_active = true;
CREATE INDEX idx_places_district ON places(city, district) WHERE is_active = true;
CREATE INDEX idx_places_slug ON places(slug);
CREATE INDEX idx_places_location_gist ON places USING GIST(location);
CREATE INDEX idx_places_active ON places(is_active, created_at DESC);
CREATE INDEX idx_places_created ON places(created_at DESC);
CREATE INDEX idx_places_search ON places USING GIN(search_vector);

-- Composite index for common query patterns
CREATE INDEX idx_places_city_active ON places(city, is_active) 
    INCLUDE (id, name, slug, latitude, longitude)
    WHERE is_active = true;

-- Categories
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    parent_id BIGINT REFERENCES categories(id) ON DELETE SET NULL,
    icon VARCHAR(100),
    description TEXT,
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_sort ON categories(sort_order);
CREATE INDEX idx_categories_active ON categories(is_active, sort_order);

-- Place-Category relationship
CREATE TABLE place_categories (
    place_id BIGINT REFERENCES places(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (place_id, category_id)
);

CREATE INDEX idx_pc_category ON place_categories(category_id);
CREATE INDEX idx_pc_place ON place_categories(place_id);

-- Reviews
CREATE TABLE reviews (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    rating DECIMAL(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    title VARCHAR(255),
    comment TEXT,
    visit_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN DEFAULT false,
    is_verified_visit BOOLEAN DEFAULT false,
    helpful_count INT DEFAULT 0,
    spam_count INT DEFAULT 0
);

CREATE INDEX idx_reviews_place ON reviews(place_id, created_at DESC) WHERE is_approved = true;
CREATE INDEX idx_reviews_user ON reviews(user_id, created_at DESC);
CREATE INDEX idx_reviews_rating ON reviews(place_id, rating) WHERE is_approved = true;
CREATE INDEX idx_reviews_approved ON reviews(is_approved, created_at DESC);
CREATE INDEX idx_reviews_place_approved ON reviews(place_id, is_approved);

-- Photos
CREATE TABLE photos (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    user_id BIGINT,
    url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    medium_url VARCHAR(500),
    caption TEXT,
    sort_order INT DEFAULT 0,
    is_cover BOOLEAN DEFAULT false,
    width INT,
    height INT,
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_approved BOOLEAN DEFAULT true
);

CREATE INDEX idx_photos_place ON photos(place_id, sort_order) WHERE is_approved = true;
CREATE INDEX idx_photos_user ON photos(user_id);
CREATE INDEX idx_photos_cover ON photos(place_id, is_cover) WHERE is_cover = true;

-- Opening hours
CREATE TABLE opening_hours (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    open_time TIME,
    close_time TIME,
    is_closed BOOLEAN DEFAULT false,
    notes VARCHAR(255)
);

CREATE INDEX idx_opening_place ON opening_hours(place_id, day_of_week);
CREATE UNIQUE INDEX idx_opening_place_day ON opening_hours(place_id, day_of_week);

-- Favorites
CREATE TABLE favorites (
    user_id BIGINT NOT NULL,
    place_id BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, place_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id, created_at DESC);
CREATE INDEX idx_favorites_place ON favorites(place_id, created_at DESC);

-- Menu items
CREATE TABLE menu_items (
    id BIGSERIAL PRIMARY KEY,
    place_id BIGINT NOT NULL REFERENCES places(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'TRY',
    category VARCHAR(100),
    is_available BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_place ON menu_items(place_id, category, sort_order);

-- =============================================
-- 2. AGGREGATE/SUMMARY TABLES (OLAP)
-- =============================================

-- Place statistics (main aggregate table)
CREATE TABLE place_statistics (
    place_id BIGINT PRIMARY KEY REFERENCES places(id) ON DELETE CASCADE,
    
    -- Review metrics
    total_reviews INT DEFAULT 0,
    approved_reviews INT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    rating_1_count INT DEFAULT 0,
    rating_2_count INT DEFAULT 0,
    rating_3_count INT DEFAULT 0,
    rating_4_count INT DEFAULT 0,
    rating_5_count INT DEFAULT 0,
    
    -- Engagement metrics
    total_favorites INT DEFAULT 0,
    total_photos INT DEFAULT 0,
    total_menu_items INT DEFAULT 0,
    
    -- View metrics
    total_views INT DEFAULT 0,
    view_count_last_7_days INT DEFAULT 0,
    view_count_last_30_days INT DEFAULT 0,
    
    -- Activity timestamps
    last_review_at TIMESTAMP,
    last_photo_at TIMESTAMP,
    last_favorite_at TIMESTAMP,
    
    -- Computed scores
    popularity_score DECIMAL(10, 2) DEFAULT 0,
    quality_score DECIMAL(10, 2) DEFAULT 0,
    trending_score DECIMAL(10, 2) DEFAULT 0,
    
    -- Update timestamp
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for place_statistics
CREATE INDEX idx_stats_rating ON place_statistics(average_rating DESC, total_reviews DESC);
CREATE INDEX idx_stats_reviews ON place_statistics(total_reviews DESC);
CREATE INDEX idx_stats_popularity ON place_statistics(popularity_score DESC);
CREATE INDEX idx_stats_quality ON place_statistics(quality_score DESC);
CREATE INDEX idx_stats_trending ON place_statistics(trending_score DESC);
CREATE INDEX idx_stats_updated ON place_statistics(updated_at DESC);

-- City statistics
CREATE TABLE city_statistics (
    city VARCHAR(100) PRIMARY KEY,
    total_places INT DEFAULT 0,
    active_places INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_favorites INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_city_stats_places ON city_statistics(total_places DESC);
CREATE INDEX idx_city_stats_rating ON city_statistics(average_rating DESC);

-- Category statistics
CREATE TABLE category_statistics (
    category_id BIGINT PRIMARY KEY REFERENCES categories(id) ON DELETE CASCADE,
    total_places INT DEFAULT 0,
    active_places INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    average_rating DECIMAL(3, 2) DEFAULT 0,
    total_favorites INT DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cat_stats_places ON category_statistics(total_places DESC);
CREATE INDEX idx_cat_stats_rating ON category_statistics(average_rating DESC);

-- Place view logs (hot data - last 90 days)
CREATE TABLE place_view_logs (
    place_id BIGINT NOT NULL,
    view_date DATE NOT NULL,
    view_count INT DEFAULT 1,
    unique_visitors INT DEFAULT 1,
    PRIMARY KEY (place_id, view_date)
);

CREATE INDEX idx_view_logs_date ON place_view_logs(view_date DESC);
CREATE INDEX idx_view_logs_place ON place_view_logs(place_id, view_date DESC);

-- Partial index for recent data (last 30 days)
CREATE INDEX idx_view_logs_recent ON place_view_logs(place_id, view_date DESC)
    WHERE view_date >= CURRENT_DATE - INTERVAL '30 days';

-- Monthly statistics (warm data archive)
CREATE TABLE place_monthly_stats (
    place_id BIGINT NOT NULL,
    year_month VARCHAR(7) NOT NULL, -- YYYY-MM format
    total_views INT DEFAULT 0,
    total_reviews INT DEFAULT 0,
    total_favorites INT DEFAULT 0,
    avg_rating DECIMAL(3, 2) DEFAULT 0,
    PRIMARY KEY (place_id, year_month)
);

CREATE INDEX idx_monthly_stats_date ON place_monthly_stats(year_month DESC);

-- =============================================
-- 3. MATERIALIZED VIEWS
-- =============================================

-- Top places (overall)
CREATE MATERIALIZED VIEW mv_top_places AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.city,
    p.district,
    p.latitude,
    p.longitude,
    p.price_range,
    ps.average_rating,
    ps.total_reviews,
    ps.approved_reviews,
    ps.popularity_score,
    ps.quality_score,
    ps.total_favorites,
    ps.view_count_last_30_days,
    COALESCE(
        array_agg(DISTINCT c.name ORDER BY c.name) FILTER (WHERE c.id IS NOT NULL), 
        ARRAY[]::VARCHAR[]
    ) as category_names,
    COALESCE(
        array_agg(DISTINCT c.id ORDER BY c.id) FILTER (WHERE c.id IS NOT NULL), 
        ARRAY[]::BIGINT[]
    ) as category_ids
FROM places p
INNER JOIN place_statistics ps ON p.id = ps.place_id
LEFT JOIN place_categories pc ON p.id = pc.place_id
LEFT JOIN categories c ON pc.category_id = c.id
WHERE p.is_active = true
  AND ps.total_reviews >= 3
GROUP BY p.id, p.name, p.slug, p.city, p.district, p.latitude, p.longitude, p.price_range,
         ps.average_rating, ps.total_reviews, ps.approved_reviews, ps.popularity_score, 
         ps.quality_score, ps.total_favorites, ps.view_count_last_30_days
ORDER BY ps.popularity_score DESC
LIMIT 1000;

CREATE UNIQUE INDEX idx_mv_top_places_id ON mv_top_places(id);
CREATE INDEX idx_mv_top_places_city ON mv_top_places(city);
CREATE INDEX idx_mv_top_places_score ON mv_top_places(popularity_score DESC);

-- Top places by city
CREATE MATERIALIZED VIEW mv_top_places_by_city AS
SELECT 
    p.city,
    p.id,
    p.name,
    p.slug,
    p.district,
    p.latitude,
    p.longitude,
    ps.average_rating,
    ps.total_reviews,
    ps.popularity_score,
    ps.quality_score,
    ROW_NUMBER() OVER (PARTITION BY p.city ORDER BY ps.popularity_score DESC) as city_rank
FROM places p
INNER JOIN place_statistics ps ON p.id = ps.place_id
WHERE p.is_active = true
  AND ps.total_reviews >= 3
ORDER BY p.city, ps.popularity_score DESC;

CREATE INDEX idx_mv_top_city_places ON mv_top_places_by_city(city, city_rank);
CREATE INDEX idx_mv_top_city_places_id ON mv_top_places_by_city(id);

-- Top places by category
CREATE MATERIALIZED VIEW mv_top_places_by_category AS
SELECT 
    c.id as category_id,
    c.name as category_name,
    c.slug as category_slug,
    p.id as place_id,
    p.name as place_name,
    p.slug as place_slug,
    p.city,
    p.district,
    ps.average_rating,
    ps.total_reviews,
    ps.popularity_score,
    ps.quality_score,
    ROW_NUMBER() OVER (PARTITION BY c.id ORDER BY ps.popularity_score DESC) as category_rank
FROM categories c
INNER JOIN place_categories pc ON c.id = pc.category_id
INNER JOIN places p ON pc.place_id = p.id
INNER JOIN place_statistics ps ON p.id = ps.place_id
WHERE p.is_active = true
  AND c.is_active = true
  AND ps.total_reviews >= 3
ORDER BY c.id, ps.popularity_score DESC;

CREATE INDEX idx_mv_top_cat_places ON mv_top_places_by_category(category_id, category_rank);
CREATE INDEX idx_mv_top_cat_places_id ON mv_top_places_by_category(place_id);

-- Trending places (based on recent activity)
CREATE MATERIALIZED VIEW mv_trending_places AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.city,
    p.district,
    ps.average_rating,
    ps.total_reviews,
    ps.trending_score,
    ps.view_count_last_7_days,
    ps.last_review_at
FROM places p
INNER JOIN place_statistics ps ON p.id = ps.place_id
WHERE p.is_active = true
  AND ps.trending_score > 0
ORDER BY ps.trending_score DESC
LIMIT 500;

CREATE UNIQUE INDEX idx_mv_trending_places_id ON mv_trending_places(id);
CREATE INDEX idx_mv_trending_score ON mv_trending_places(trending_score DESC);

-- =============================================
-- 4. TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update place search vector
CREATE OR REPLACE FUNCTION update_place_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('turkish', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('turkish', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('turkish', COALESCE(NEW.city, '')), 'C') ||
        setweight(to_tsvector('turkish', COALESCE(NEW.district, '')), 'C') ||
        setweight(to_tsvector('turkish', COALESCE(NEW.address, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_places_search_vector
    BEFORE INSERT OR UPDATE ON places
    FOR EACH ROW
    EXECUTE FUNCTION update_place_search_vector();

-- Update place location from lat/long
CREATE OR REPLACE FUNCTION update_place_location()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_places_location
    BEFORE INSERT OR UPDATE ON places
    FOR EACH ROW
    EXECUTE FUNCTION update_place_location();

-- Update place updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_places_updated_at
    BEFORE UPDATE ON places
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reviews_updated_at
    BEFORE UPDATE ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update statistics on review insert/update
CREATE OR REPLACE FUNCTION update_place_stats_on_review()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_approved = true THEN
        -- Quick counter update
        INSERT INTO place_statistics (place_id, total_reviews, approved_reviews, last_review_at, updated_at)
        VALUES (NEW.place_id, 1, 1, NEW.created_at, NOW())
        ON CONFLICT (place_id)
        DO UPDATE SET 
            total_reviews = place_statistics.total_reviews + 1,
            approved_reviews = place_statistics.approved_reviews + 1,
            last_review_at = NEW.created_at,
            updated_at = NOW();
        
        -- Notify background job for detailed calculation
        PERFORM pg_notify('recalculate_stats', NEW.place_id::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_review_insert
    AFTER INSERT ON reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_place_stats_on_review();

-- Update favorites count
CREATE OR REPLACE FUNCTION update_place_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO place_statistics (place_id, total_favorites, last_favorite_at, updated_at)
        VALUES (NEW.place_id, 1, NEW.created_at, NOW())
        ON CONFLICT (place_id)
        DO UPDATE SET 
            total_favorites = place_statistics.total_favorites + 1,
            last_favorite_at = NEW.created_at,
            updated_at = NOW();
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE place_statistics 
        SET total_favorites = GREATEST(total_favorites - 1, 0),
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

-- Update photos count
CREATE OR REPLACE FUNCTION update_place_photos_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_approved = true THEN
        INSERT INTO place_statistics (place_id, total_photos, last_photo_at, updated_at)
        VALUES (NEW.place_id, 1, NEW.created_at, NOW())
        ON CONFLICT (place_id)
        DO UPDATE SET 
            total_photos = place_statistics.total_photos + 1,
            last_photo_at = NEW.created_at,
            updated_at = NOW();
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE place_statistics 
        SET total_photos = GREATEST(total_photos - 1, 0),
            updated_at = NOW()
        WHERE place_id = OLD.place_id;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_photo_changes
    AFTER INSERT OR DELETE ON photos
    FOR EACH ROW
    EXECUTE FUNCTION update_place_photos_count();

-- =============================================
-- 5. HELPER FUNCTIONS
-- =============================================

-- Calculate popularity score
CREATE OR REPLACE FUNCTION calculate_popularity_score(
    p_total_reviews INT,
    p_average_rating DECIMAL,
    p_total_favorites INT,
    p_view_count_30d INT,
    p_last_review_at TIMESTAMP
) RETURNS DECIMAL AS $$
DECLARE
    review_score DECIMAL;
    rating_score DECIMAL;
    favorite_score DECIMAL;
    view_score DECIMAL;
    recency_score DECIMAL;
    days_since_review INT;
BEGIN
    -- Review score (logarithmic scale)
    review_score := LOG(GREATEST(p_total_reviews, 1)) * 10;
    
    -- Rating score
    rating_score := COALESCE(p_average_rating, 0) * 20;
    
    -- Favorite score
    favorite_score := LOG(GREATEST(p_total_favorites, 1)) * 5;
    
    -- View score (30 days)
    view_score := LOG(GREATEST(p_view_count_30d, 1)) * 3;
    
    -- Recency score (decay factor)
    days_since_review := EXTRACT(DAY FROM (NOW() - COALESCE(p_last_review_at, NOW() - INTERVAL '365 days')));
    recency_score := 10 * EXP(-days_since_review / 90.0);
    
    RETURN review_score + rating_score + favorite_score + view_score + recency_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate quality score
CREATE OR REPLACE FUNCTION calculate_quality_score(
    p_average_rating DECIMAL,
    p_total_reviews INT,
    p_rating_distribution INT[]
) RETURNS DECIMAL AS $$
DECLARE
    base_score DECIMAL;
    confidence_factor DECIMAL;
    distribution_factor DECIMAL;
BEGIN
    -- Base score from rating
    base_score := COALESCE(p_average_rating, 0) * 20;
    
    -- Confidence factor (more reviews = more confidence)
    confidence_factor := LEAST(p_total_reviews / 10.0, 1.0);
    
    -- Distribution factor (penalize polarized ratings)
    distribution_factor := 1.0; -- Simplified, could be more complex
    
    RETURN base_score * confidence_factor * distribution_factor;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Calculate trending score (last 7 days activity)
CREATE OR REPLACE FUNCTION calculate_trending_score(
    p_view_count_7d INT,
    p_recent_reviews INT,
    p_recent_favorites INT
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (p_view_count_7d * 0.5) + (p_recent_reviews * 10) + (p_recent_favorites * 5);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Refresh place statistics (complete recalculation)
CREATE OR REPLACE FUNCTION refresh_place_statistics(p_place_id BIGINT)
RETURNS void AS $$
DECLARE
    v_stats RECORD;
    v_view_stats RECORD;
BEGIN
    -- Calculate review statistics
    SELECT 
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE is_approved = true) as approved_reviews,
        AVG(rating) FILTER (WHERE is_approved = true) as average_rating,
        COUNT(*) FILTER (WHERE rating = 1 AND is_approved = true) as rating_1_count,
        COUNT(*) FILTER (WHERE rating = 2 AND is_approved = true) as rating_2_count,
        COUNT(*) FILTER (WHERE rating = 3 AND is_approved = true) as rating_3_count,
        COUNT(*) FILTER (WHERE rating = 4 AND is_approved = true) as rating_4_count,
        COUNT(*) FILTER (WHERE rating = 5 AND is_approved = true) as rating_5_count,
        MAX(created_at) FILTER (WHERE is_approved = true) as last_review_at
    INTO v_stats
    FROM reviews 
    WHERE place_id = p_place_id;
    
    -- Calculate view statistics
    SELECT 
        COALESCE(SUM(view_count) FILTER (WHERE view_date >= CURRENT_DATE - INTERVAL '7 days'), 0) as views_7d,
        COALESCE(SUM(view_count) FILTER (WHERE view_date >= CURRENT_DATE - INTERVAL '30 days'), 0) as views_30d
    INTO v_view_stats
    FROM place_view_logs
    WHERE place_id = p_place_id;
    
    -- Get favorites and photos count
    -- Update place_statistics with all calculated values
    INSERT INTO place_statistics (
        place_id, total_reviews, approved_reviews, average_rating,
        rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count,
        last_review_at, view_count_last_7_days, view_count_last_30_days,
        total_favorites, total_photos,
        updated_at
    )
    SELECT 
        p_place_id,
        v_stats.total_reviews,
        v_stats.approved_reviews,
        ROUND(v_stats.average_rating, 2),
        v_stats.rating_1_count,
        v_stats.rating_2_count,
        v_stats.rating_3_count,
        v_stats.rating_4_count,
        v_stats.rating_5_count,
        v_stats.last_review_at,
        v_view_stats.views_7d,
        v_view_stats.views_30d,
        (SELECT COUNT(*) FROM favorites WHERE place_id = p_place_id),
        (SELECT COUNT(*) FROM photos WHERE place_id = p_place_id AND is_approved = true),
        NOW()
    ON CONFLICT (place_id)
    DO UPDATE SET
        total_reviews = EXCLUDED.total_reviews,
        approved_reviews = EXCLUDED.approved_reviews,
        average_rating = EXCLUDED.average_rating,
        rating_1_count = EXCLUDED.rating_1_count,
        rating_2_count = EXCLUDED.rating_2_count,
        rating_3_count = EXCLUDED.rating_3_count,
        rating_4_count = EXCLUDED.rating_4_count,
        rating_5_count = EXCLUDED.rating_5_count,
        last_review_at = EXCLUDED.last_review_at,
        view_count_last_7_days = EXCLUDED.view_count_last_7_days,
        view_count_last_30_days = EXCLUDED.view_count_last_30_days,
        total_favorites = EXCLUDED.total_favorites,
        total_photos = EXCLUDED.total_photos,
        updated_at = NOW();
    
    -- Update calculated scores
    UPDATE place_statistics
    SET 
        popularity_score = calculate_popularity_score(
            total_reviews, average_rating, total_favorites, 
            view_count_last_30_days, last_review_at
        ),
        quality_score = calculate_quality_score(
            average_rating, total_reviews,
            ARRAY[rating_1_count, rating_2_count, rating_3_count, rating_4_count, rating_5_count]
        ),
        trending_score = calculate_trending_score(
            view_count_last_7_days, 
            (SELECT COUNT(*) FROM reviews WHERE place_id = p_place_id AND created_at >= NOW() - INTERVAL '7 days'),
            (SELECT COUNT(*) FROM favorites WHERE place_id = p_place_id AND created_at >= NOW() - INTERVAL '7 days')
        )
    WHERE place_id = p_place_id;
    
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 6. SAMPLE DATA QUERIES
-- =============================================

-- Get top places with all details
COMMENT ON MATERIALIZED VIEW mv_top_places IS 
'Top 1000 places ordered by popularity score. Refresh daily.
Usage: SELECT * FROM mv_top_places WHERE city = ''İstanbul'' LIMIT 20;';

-- Get place detail with statistics
COMMENT ON TABLE place_statistics IS 
'Aggregate statistics for each place. Updated via triggers and background jobs.
Usage: SELECT p.*, ps.* FROM places p JOIN place_statistics ps ON p.id = ps.place_id WHERE p.id = $1;';

-- Search places
COMMENT ON INDEX idx_places_search IS
'Full-text search index for places using Turkish language.
Usage: SELECT * FROM places WHERE search_vector @@ to_tsquery(''turkish'', ''kebap'') ORDER BY ts_rank(search_vector, to_tsquery(''turkish'', ''kebap'')) DESC;';

-- Nearby places
COMMENT ON INDEX idx_places_location_gist IS
'GiST index for geo-spatial queries.
Usage: SELECT * FROM places WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, 5000) ORDER BY location <-> ST_MakePoint($1, $2)::geography LIMIT 20;';
