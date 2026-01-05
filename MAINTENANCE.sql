-- =============================================
-- Lezzet Atlası - Maintenance and Monitoring Queries
-- Database Performance Monitoring and Optimization
-- =============================================

-- =============================================
-- 1. PERFORMANCE MONITORING
-- =============================================

-- Query performance statistics (requires pg_stat_statements)
-- Shows slowest queries by average execution time
SELECT 
    substring(query, 1, 100) as short_query,
    calls,
    total_time,
    mean_time,
    max_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY mean_time DESC
LIMIT 20;

-- Most frequently called queries
SELECT 
    substring(query, 1, 100) as short_query,
    calls,
    total_time,
    mean_time,
    calls * mean_time as total_impact
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 20;

-- Queries consuming most total time
SELECT 
    substring(query, 1, 100) as short_query,
    calls,
    total_time,
    mean_time,
    100.0 * total_time / sum(total_time) OVER () AS percent_total_time
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_time DESC
LIMIT 20;

-- =============================================
-- 2. INDEX USAGE MONITORING
-- =============================================

-- Unused indexes (potential candidates for removal)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE '%_pkey'
  AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Index usage statistics
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Missing indexes (tables with many sequential scans)
SELECT 
    schemaname,
    tablename,
    seq_scan,
    seq_tup_read,
    idx_scan,
    seq_tup_read / seq_scan as avg_seq_tup_read,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size
FROM pg_stat_user_tables
WHERE seq_scan > 0
  AND schemaname = 'public'
ORDER BY seq_tup_read DESC
LIMIT 20;

-- =============================================
-- 3. TABLE STATISTICS
-- =============================================

-- Table sizes and statistics
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as indexes_size,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows,
    ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) as dead_row_percent,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Table bloat estimation
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    n_dead_tup as dead_tuples,
    n_live_tup as live_tuples,
    ROUND(100 * n_dead_tup / NULLIF(n_live_tup, 0), 2) as bloat_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- =============================================
-- 4. CACHE HIT RATIOS
-- =============================================

-- Database-wide cache hit ratio (should be > 99%)
SELECT 
    sum(heap_blks_read) as heap_read,
    sum(heap_blks_hit) as heap_hit,
    ROUND(100 * sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0), 2) as cache_hit_ratio
FROM pg_statio_user_tables;

-- Index cache hit ratio
SELECT 
    sum(idx_blks_read) as idx_read,
    sum(idx_blks_hit) as idx_hit,
    ROUND(100 * sum(idx_blks_hit) / NULLIF(sum(idx_blks_hit) + sum(idx_blks_read), 0), 2) as idx_cache_hit_ratio
FROM pg_statio_user_indexes;

-- Per-table cache hit ratios
SELECT 
    schemaname,
    tablename,
    heap_blks_read,
    heap_blks_hit,
    ROUND(100 * heap_blks_hit / NULLIF(heap_blks_hit + heap_blks_read, 0), 2) as cache_hit_ratio
FROM pg_statio_user_tables
WHERE heap_blks_read + heap_blks_hit > 0
  AND schemaname = 'public'
ORDER BY heap_blks_read DESC;

-- =============================================
-- 5. CONNECTION MONITORING
-- =============================================

-- Active connections
SELECT 
    datname,
    usename,
    application_name,
    client_addr,
    state,
    COUNT(*) as connection_count
FROM pg_stat_activity
WHERE datname IS NOT NULL
GROUP BY datname, usename, application_name, client_addr, state
ORDER BY connection_count DESC;

-- Long-running queries (running > 5 minutes)
SELECT 
    pid,
    usename,
    application_name,
    client_addr,
    state,
    NOW() - query_start as duration,
    substring(query, 1, 200) as query
FROM pg_stat_activity
WHERE state != 'idle'
  AND NOW() - query_start > INTERVAL '5 minutes'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- Blocked queries
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS blocking_statement
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- =============================================
-- 6. MAINTENANCE TASKS
-- =============================================

-- Manual VACUUM and ANALYZE for critical tables
VACUUM ANALYZE places;
VACUUM ANALYZE reviews;
VACUUM ANALYZE place_statistics;
VACUUM ANALYZE favorites;
VACUUM ANALYZE photos;
VACUUM ANALYZE place_view_logs;

-- Refresh materialized views (CONCURRENTLY to avoid locks)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_city;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_category;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_places;

-- Reindex critical tables (schedule during low-traffic periods)
REINDEX TABLE CONCURRENTLY places;
REINDEX TABLE CONCURRENTLY reviews;
REINDEX TABLE CONCURRENTLY place_statistics;

-- Update table statistics
ANALYZE places;
ANALYZE reviews;
ANALYZE place_statistics;

-- =============================================
-- 7. DATA QUALITY CHECKS
-- =============================================

-- Places without statistics
SELECT p.id, p.name, p.created_at
FROM places p
LEFT JOIN place_statistics ps ON p.id = ps.place_id
WHERE ps.place_id IS NULL
  AND p.is_active = true;

-- Places with inconsistent review counts
SELECT 
    p.id,
    p.name,
    ps.total_reviews as stats_count,
    COUNT(r.id) as actual_count,
    ps.total_reviews - COUNT(r.id) as difference
FROM places p
INNER JOIN place_statistics ps ON p.id = ps.place_id
LEFT JOIN reviews r ON p.id = r.place_id AND r.is_approved = true
WHERE p.is_active = true
GROUP BY p.id, p.name, ps.total_reviews
HAVING ps.total_reviews != COUNT(r.id)
ORDER BY ABS(ps.total_reviews - COUNT(r.id)) DESC
LIMIT 50;

-- Places with invalid ratings
SELECT 
    p.id,
    p.name,
    ps.average_rating,
    ps.total_reviews
FROM places p
INNER JOIN place_statistics ps ON p.id = ps.place_id
WHERE ps.average_rating < 1.0 OR ps.average_rating > 5.0
  OR (ps.total_reviews > 0 AND ps.average_rating = 0);

-- Orphaned records
SELECT 'place_categories' as table_name, COUNT(*) as orphan_count
FROM place_categories pc
LEFT JOIN places p ON pc.place_id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 'reviews', COUNT(*)
FROM reviews r
LEFT JOIN places p ON r.place_id = p.id
WHERE p.id IS NULL
UNION ALL
SELECT 'photos', COUNT(*)
FROM photos ph
LEFT JOIN places p ON ph.place_id = p.id
WHERE p.id IS NULL;

-- =============================================
-- 8. PERFORMANCE OPTIMIZATION RECOMMENDATIONS
-- =============================================

-- Tables that need more frequent VACUUM
SELECT 
    schemaname,
    tablename,
    n_dead_tup,
    n_live_tup,
    ROUND(100 * n_dead_tup / NULLIF(n_live_tup, 0), 2) as dead_ratio,
    last_autovacuum
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND n_dead_tup > 10000
  AND (last_autovacuum IS NULL OR last_autovacuum < NOW() - INTERVAL '1 day')
ORDER BY n_dead_tup DESC;

-- Tables with outdated statistics
SELECT 
    schemaname,
    tablename,
    n_live_tup,
    last_analyze,
    last_autoanalyze,
    GREATEST(last_analyze, last_autoanalyze) as last_stats_update
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND GREATEST(last_analyze, last_autoanalyze) < NOW() - INTERVAL '7 days'
ORDER BY n_live_tup DESC;

-- Duplicate indexes (indexes that could be consolidated)
SELECT 
    pg_size_pretty(sum(pg_relation_size(idx))::bigint) as total_size,
    array_agg(indexname) as indexes,
    tablename
FROM (
    SELECT 
        indexname,
        tablename,
        indexrelid::regclass as idx,
        (indrelid::text ||E'\n'|| indclass::text ||E'\n'|| indkey::text ||E'\n'||
         COALESCE(indexprs::text,'')||E'\n' || COALESCE(indpred::text,'')) as key
    FROM pg_index
    JOIN pg_class ON pg_class.oid = pg_index.indexrelid
    JOIN pg_stat_user_indexes ON pg_stat_user_indexes.indexrelid = pg_class.oid
    WHERE indisunique IS FALSE
) sub
GROUP BY key, tablename
HAVING count(*) > 1
ORDER BY sum(pg_relation_size(idx)) DESC;

-- =============================================
-- 9. SCHEDULED MAINTENANCE PROCEDURES
-- =============================================

-- Function to run daily maintenance
CREATE OR REPLACE FUNCTION daily_maintenance()
RETURNS void AS $$
BEGIN
    -- Vacuum and analyze critical tables
    VACUUM ANALYZE places;
    VACUUM ANALYZE reviews;
    VACUUM ANALYZE place_statistics;
    
    -- Update city statistics
    INSERT INTO city_statistics (city, total_places, active_places, total_reviews, average_rating, total_favorites)
    SELECT 
        p.city,
        COUNT(*) as total_places,
        COUNT(*) FILTER (WHERE p.is_active = true) as active_places,
        COALESCE(SUM(ps.total_reviews), 0) as total_reviews,
        COALESCE(AVG(ps.average_rating), 0) as average_rating,
        COALESCE(SUM(ps.total_favorites), 0) as total_favorites
    FROM places p
    LEFT JOIN place_statistics ps ON p.id = ps.place_id
    WHERE p.city IS NOT NULL
    GROUP BY p.city
    ON CONFLICT (city)
    DO UPDATE SET
        total_places = EXCLUDED.total_places,
        active_places = EXCLUDED.active_places,
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        total_favorites = EXCLUDED.total_favorites,
        updated_at = NOW();
    
    -- Update category statistics
    INSERT INTO category_statistics (category_id, total_places, active_places, total_reviews, average_rating, total_favorites)
    SELECT 
        c.id,
        COUNT(pc.place_id) as total_places,
        COUNT(pc.place_id) FILTER (WHERE p.is_active = true) as active_places,
        COALESCE(SUM(ps.total_reviews), 0) as total_reviews,
        COALESCE(AVG(ps.average_rating), 0) as average_rating,
        COALESCE(SUM(ps.total_favorites), 0) as total_favorites
    FROM categories c
    LEFT JOIN place_categories pc ON c.id = pc.category_id
    LEFT JOIN places p ON pc.place_id = p.id
    LEFT JOIN place_statistics ps ON p.id = ps.place_id
    GROUP BY c.id
    ON CONFLICT (category_id)
    DO UPDATE SET
        total_places = EXCLUDED.total_places,
        active_places = EXCLUDED.active_places,
        total_reviews = EXCLUDED.total_reviews,
        average_rating = EXCLUDED.average_rating,
        total_favorites = EXCLUDED.total_favorites,
        updated_at = NOW();
    
    -- Archive old view logs (keep last 90 days)
    INSERT INTO place_monthly_stats (place_id, year_month, total_views)
    SELECT 
        place_id,
        TO_CHAR(view_date, 'YYYY-MM') as year_month,
        SUM(view_count) as total_views
    FROM place_view_logs
    WHERE view_date < CURRENT_DATE - INTERVAL '90 days'
    GROUP BY place_id, TO_CHAR(view_date, 'YYYY-MM')
    ON CONFLICT (place_id, year_month)
    DO UPDATE SET total_views = place_monthly_stats.total_views + EXCLUDED.total_views;
    
    DELETE FROM place_view_logs WHERE view_date < CURRENT_DATE - INTERVAL '90 days';
    
    -- Refresh trending scores
    UPDATE place_statistics ps
    SET 
        view_count_last_7_days = (
            SELECT COALESCE(SUM(view_count), 0)
            FROM place_view_logs
            WHERE place_id = ps.place_id
              AND view_date >= CURRENT_DATE - INTERVAL '7 days'
        ),
        view_count_last_30_days = (
            SELECT COALESCE(SUM(view_count), 0)
            FROM place_view_logs
            WHERE place_id = ps.place_id
              AND view_date >= CURRENT_DATE - INTERVAL '30 days'
        ),
        trending_score = calculate_trending_score(
            (SELECT COALESCE(SUM(view_count), 0)
             FROM place_view_logs
             WHERE place_id = ps.place_id
               AND view_date >= CURRENT_DATE - INTERVAL '7 days'),
            (SELECT COUNT(*)
             FROM reviews
             WHERE place_id = ps.place_id
               AND created_at >= NOW() - INTERVAL '7 days'),
            (SELECT COUNT(*)
             FROM favorites
             WHERE place_id = ps.place_id
               AND created_at >= NOW() - INTERVAL '7 days')
        ),
        updated_at = NOW();
    
    RAISE NOTICE 'Daily maintenance completed successfully';
END;
$$ LANGUAGE plpgsql;

-- Function to refresh materialized views (run every 4 hours)
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_city;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_category;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_places;
    
    RAISE NOTICE 'All materialized views refreshed successfully';
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 10. MONITORING QUERIES FOR DASHBOARDS
-- =============================================

-- Overall system health metrics
SELECT 
    (SELECT COUNT(*) FROM places WHERE is_active = true) as active_places,
    (SELECT COUNT(*) FROM reviews WHERE is_approved = true) as approved_reviews,
    (SELECT COUNT(DISTINCT user_id) FROM favorites) as active_users,
    (SELECT AVG(average_rating) FROM place_statistics WHERE total_reviews >= 3) as avg_rating_overall,
    (SELECT SUM(view_count) FROM place_view_logs WHERE view_date >= CURRENT_DATE - INTERVAL '7 days') as total_views_7d,
    (SELECT COUNT(*) FROM reviews WHERE created_at >= NOW() - INTERVAL '24 hours') as new_reviews_24h;

-- Top performing places (last 7 days)
SELECT 
    p.id,
    p.name,
    p.city,
    ps.average_rating,
    ps.total_reviews,
    ps.view_count_last_7_days,
    ps.trending_score
FROM places p
INNER JOIN place_statistics ps ON p.id = ps.place_id
WHERE p.is_active = true
  AND ps.view_count_last_7_days > 0
ORDER BY ps.trending_score DESC
LIMIT 20;

-- Cities with most activity
SELECT 
    city,
    total_places,
    active_places,
    total_reviews,
    ROUND(average_rating, 2) as avg_rating,
    total_favorites
FROM city_statistics
ORDER BY total_reviews DESC
LIMIT 20;
