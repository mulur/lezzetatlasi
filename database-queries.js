/**
 * Lezzet Atlası - Optimized Database Queries
 * 
 * High-performance query implementations with proper indexing
 */

const { Pool } = require('pg');

// =============================================
// Database Configuration
// =============================================

const masterPool = new Pool({
    host: process.env.DB_MASTER_HOST || 'localhost',
    port: process.env.DB_MASTER_PORT || 5432,
    database: process.env.DB_NAME || 'lezzetatlasi',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 30000,
});

// Read replicas for scaling read operations
const replicaPools = [
    new Pool({
        host: process.env.DB_REPLICA1_HOST || 'localhost',
        port: 5432,
        database: process.env.DB_NAME || 'lezzetatlasi',
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        max: 50,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        statement_timeout: 30000,
    }),
];

// Load balancer for read queries
let replicaIndex = 0;
function getReadPool() {
    if (replicaPools.length === 0) return masterPool;
    const pool = replicaPools[replicaIndex];
    replicaIndex = (replicaIndex + 1) % replicaPools.length;
    return pool;
}

// =============================================
// Place Queries
// =============================================

/**
 * Get place detail with all related data (optimized single query)
 */
async function getPlaceDetail(placeId) {
    const pool = getReadPool();
    
    const query = `
        WITH place_data AS (
            SELECT 
                p.*,
                ps.average_rating,
                ps.total_reviews,
                ps.approved_reviews,
                ps.total_favorites,
                ps.total_photos,
                ps.rating_1_count,
                ps.rating_2_count,
                ps.rating_3_count,
                ps.rating_4_count,
                ps.rating_5_count,
                ps.popularity_score,
                ps.quality_score
            FROM places p
            LEFT JOIN place_statistics ps ON p.id = ps.place_id
            WHERE p.id = $1 AND p.is_active = true
        ),
        recent_reviews AS (
            SELECT 
                r.id,
                r.user_id,
                r.rating,
                r.title,
                r.comment,
                r.visit_date,
                r.created_at,
                r.helpful_count
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
                ph.medium_url,
                ph.caption,
                ph.is_cover
            FROM photos ph
            WHERE ph.place_id = $1
              AND ph.is_approved = true
            ORDER BY ph.is_cover DESC, ph.sort_order, ph.id
            LIMIT 20
        ),
        place_categories AS (
            SELECT 
                c.id,
                c.name,
                c.slug,
                c.icon
            FROM categories c
            INNER JOIN place_categories pc ON c.id = pc.category_id
            WHERE pc.place_id = $1
            ORDER BY c.sort_order
        ),
        opening_hours_data AS (
            SELECT 
                oh.day_of_week,
                oh.open_time,
                oh.close_time,
                oh.is_closed,
                oh.notes
            FROM opening_hours oh
            WHERE oh.place_id = $1
            ORDER BY oh.day_of_week
        )
        SELECT 
            json_build_object(
                'place', (SELECT row_to_json(pd.*) FROM place_data pd),
                'reviews', (
                    SELECT COALESCE(json_agg(rr.* ORDER BY rr.created_at DESC), '[]'::json)
                    FROM recent_reviews rr
                ),
                'photos', (
                    SELECT COALESCE(json_agg(pp.* ORDER BY pp.is_cover DESC), '[]'::json)
                    FROM place_photos pp
                ),
                'categories', (
                    SELECT COALESCE(json_agg(pc.*), '[]'::json)
                    FROM place_categories pc
                ),
                'opening_hours', (
                    SELECT COALESCE(json_agg(oh.* ORDER BY oh.day_of_week), '[]'::json)
                    FROM opening_hours_data oh
                )
            ) as data
    `;
    
    const result = await pool.query(query, [placeId]);
    return result.rows[0]?.data || null;
}

/**
 * Get place list with filters and pagination (optimized)
 */
async function getPlaceList(filters = {}, pagination = {}) {
    const pool = getReadPool();
    
    const {
        city,
        district,
        categoryId,
        minRating = 0,
        priceRange,
        search,
        sortBy = 'popularity', // popularity, rating, reviews, newest
    } = filters;
    
    const {
        page = 1,
        limit = 20,
    } = pagination;
    
    const offset = (page - 1) * limit;
    const params = [];
    let paramIndex = 1;
    
    // Build WHERE clause
    const whereClauses = ['p.is_active = true'];
    
    if (city) {
        whereClauses.push(`p.city = $${paramIndex++}`);
        params.push(city);
    }
    
    if (district) {
        whereClauses.push(`p.district = $${paramIndex++}`);
        params.push(district);
    }
    
    if (categoryId) {
        whereClauses.push(`EXISTS (
            SELECT 1 FROM place_categories pc 
            WHERE pc.place_id = p.id AND pc.category_id = $${paramIndex++}
        )`);
        params.push(categoryId);
    }
    
    if (minRating > 0) {
        whereClauses.push(`ps.average_rating >= $${paramIndex++}`);
        params.push(minRating);
    }
    
    if (priceRange) {
        whereClauses.push(`p.price_range = $${paramIndex++}`);
        params.push(priceRange);
    }
    
    if (search) {
        whereClauses.push(`p.search_vector @@ plainto_tsquery('turkish', $${paramIndex++})`);
        params.push(search);
    }
    
    // Build ORDER BY clause
    let orderBy;
    switch (sortBy) {
        case 'rating':
            orderBy = 'ps.average_rating DESC, ps.total_reviews DESC';
            break;
        case 'reviews':
            orderBy = 'ps.total_reviews DESC, ps.average_rating DESC';
            break;
        case 'newest':
            orderBy = 'p.created_at DESC';
            break;
        case 'popularity':
        default:
            orderBy = 'ps.popularity_score DESC';
    }
    
    // Add pagination params
    params.push(limit, offset);
    
    const query = `
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
            ps.total_favorites,
            ps.popularity_score,
            (
                SELECT json_agg(json_build_object('id', c.id, 'name', c.name, 'slug', c.slug))
                FROM categories c
                INNER JOIN place_categories pc ON c.id = pc.category_id
                WHERE pc.place_id = p.id
                LIMIT 5
            ) as categories,
            (
                SELECT ph.thumbnail_url
                FROM photos ph
                WHERE ph.place_id = p.id AND ph.is_approved = true
                ORDER BY ph.is_cover DESC, ph.sort_order
                LIMIT 1
            ) as cover_photo
        FROM places p
        INNER JOIN place_statistics ps ON p.id = ps.place_id
        WHERE ${whereClauses.join(' AND ')}
        ORDER BY ${orderBy}
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    // Get total count for pagination
    const countQuery = `
        SELECT COUNT(*) as total
        FROM places p
        INNER JOIN place_statistics ps ON p.id = ps.place_id
        WHERE ${whereClauses.join(' AND ')}
    `;
    
    const [dataResult, countResult] = await Promise.all([
        pool.query(query, params),
        pool.query(countQuery, params.slice(0, -2)), // Remove limit/offset for count
    ]);
    
    return {
        data: dataResult.rows,
        pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].total),
            totalPages: Math.ceil(countResult.rows[0].total / limit),
        },
    };
}

/**
 * Get top places from materialized view (fastest)
 */
async function getTopPlaces(limit = 100) {
    const pool = getReadPool();
    
    const query = `
        SELECT 
            id,
            name,
            slug,
            city,
            district,
            latitude,
            longitude,
            average_rating,
            total_reviews,
            popularity_score,
            category_names,
            category_ids
        FROM mv_top_places
        LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
}

/**
 * Get top places by city from materialized view
 */
async function getTopPlacesByCity(city, limit = 50) {
    const pool = getReadPool();
    
    const query = `
        SELECT 
            id,
            name,
            slug,
            district,
            latitude,
            longitude,
            average_rating,
            total_reviews,
            popularity_score,
            city_rank
        FROM mv_top_places_by_city
        WHERE city = $1 AND city_rank <= $2
        ORDER BY city_rank
    `;
    
    const result = await pool.query(query, [city, limit]);
    return result.rows;
}

/**
 * Get nearby places using PostGIS (geo-spatial query)
 */
async function getNearbyPlaces(longitude, latitude, radius = 5, limit = 50) {
    const pool = getReadPool();
    
    const query = `
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
            ST_Distance(p.location, ST_MakePoint($1, $2)::geography) / 1000 as distance_km
        FROM places p
        INNER JOIN place_statistics ps ON p.id = ps.place_id
        WHERE p.is_active = true
          AND p.location IS NOT NULL
          AND ST_DWithin(p.location, ST_MakePoint($1, $2)::geography, $3)
          AND ps.total_reviews >= 3
        ORDER BY 
            ps.popularity_score DESC,
            distance_km ASC
        LIMIT $4
    `;
    
    const result = await pool.query(query, [longitude, latitude, radius * 1000, limit]);
    return result.rows;
}

/**
 * Full-text search with ranking
 */
async function searchPlaces(searchQuery, filters = {}, limit = 50) {
    const pool = getReadPool();
    
    const { city, minRating = 0 } = filters;
    const params = [searchQuery];
    let paramIndex = 2;
    
    const whereClauses = ['p.is_active = true'];
    
    if (city) {
        whereClauses.push(`p.city = $${paramIndex++}`);
        params.push(city);
    }
    
    if (minRating > 0) {
        whereClauses.push(`ps.average_rating >= $${paramIndex++}`);
        params.push(minRating);
    }
    
    params.push(limit);
    
    const query = `
        SELECT 
            p.id,
            p.name,
            p.slug,
            p.city,
            p.district,
            p.description,
            ps.average_rating,
            ps.total_reviews,
            ps.popularity_score,
            ts_rank(p.search_vector, plainto_tsquery('turkish', $1)) as search_rank
        FROM places p
        INNER JOIN place_statistics ps ON p.id = ps.place_id
        WHERE ${whereClauses.join(' AND ')}
          AND p.search_vector @@ plainto_tsquery('turkish', $1)
        ORDER BY search_rank DESC, ps.popularity_score DESC
        LIMIT $${paramIndex}
    `;
    
    const result = await pool.query(query, params);
    return result.rows;
}

/**
 * Get trending places (high recent activity)
 */
async function getTrendingPlaces(limit = 50) {
    const pool = getReadPool();
    
    const query = `
        SELECT 
            id,
            name,
            slug,
            city,
            district,
            average_rating,
            total_reviews,
            trending_score,
            view_count_last_7_days
        FROM mv_trending_places
        LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows;
}

// =============================================
// Review Queries
// =============================================

/**
 * Get place reviews with pagination
 */
async function getPlaceReviews(placeId, options = {}) {
    const pool = getReadPool();
    
    const { page = 1, limit = 20, sortBy = 'newest' } = options;
    const offset = (page - 1) * limit;
    
    let orderBy;
    switch (sortBy) {
        case 'helpful':
            orderBy = 'r.helpful_count DESC, r.created_at DESC';
            break;
        case 'rating_high':
            orderBy = 'r.rating DESC, r.created_at DESC';
            break;
        case 'rating_low':
            orderBy = 'r.rating ASC, r.created_at DESC';
            break;
        case 'newest':
        default:
            orderBy = 'r.created_at DESC';
    }
    
    const query = `
        SELECT 
            r.id,
            r.user_id,
            r.rating,
            r.title,
            r.comment,
            r.visit_date,
            r.created_at,
            r.helpful_count,
            r.is_verified_visit
        FROM reviews r
        WHERE r.place_id = $1 
          AND r.is_approved = true
        ORDER BY ${orderBy}
        LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
        SELECT COUNT(*) as total
        FROM reviews
        WHERE place_id = $1 AND is_approved = true
    `;
    
    const [dataResult, countResult] = await Promise.all([
        pool.query(query, [placeId, limit, offset]),
        pool.query(countQuery, [placeId]),
    ]);
    
    return {
        data: dataResult.rows,
        pagination: {
            page,
            limit,
            total: parseInt(countResult.rows[0].total),
        },
    };
}

// =============================================
// Write Operations (Master DB)
// =============================================

/**
 * Create new place (transactional)
 */
async function createPlace(placeData) {
    const client = await masterPool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Insert place
        const placeResult = await client.query(
            `INSERT INTO places (name, slug, description, address, city, district, 
                                latitude, longitude, phone, website, price_range)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
             RETURNING *`,
            [placeData.name, placeData.slug, placeData.description, placeData.address,
             placeData.city, placeData.district, placeData.latitude, placeData.longitude,
             placeData.phone, placeData.website, placeData.priceRange]
        );
        
        const place = placeResult.rows[0];
        
        // Initialize statistics
        await client.query(
            `INSERT INTO place_statistics (place_id, updated_at)
             VALUES ($1, NOW())`,
            [place.id]
        );
        
        // Add categories if provided
        if (placeData.categoryIds && placeData.categoryIds.length > 0) {
            const categoryValues = placeData.categoryIds.map((catId, idx) => 
                `($1, $${idx + 2})`
            ).join(',');
            
            await client.query(
                `INSERT INTO place_categories (place_id, category_id)
                 VALUES ${categoryValues}`,
                [place.id, ...placeData.categoryIds]
            );
        }
        
        await client.query('COMMIT');
        
        return place;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Create review (transactional with statistics update)
 */
async function createReview(reviewData) {
    const client = await masterPool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Insert review
        const reviewResult = await client.query(
            `INSERT INTO reviews (place_id, user_id, rating, title, comment, visit_date, is_approved)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [reviewData.placeId, reviewData.userId, reviewData.rating, 
             reviewData.title, reviewData.comment, reviewData.visitDate,
             reviewData.isApproved || false]
        );
        
        const review = reviewResult.rows[0];
        
        // Update statistics (trigger will handle this, but we can do quick update here)
        if (review.is_approved) {
            await client.query(
                `INSERT INTO place_statistics (place_id, total_reviews, approved_reviews, last_review_at, updated_at)
                 VALUES ($1, 1, 1, $2, NOW())
                 ON CONFLICT (place_id)
                 DO UPDATE SET 
                    total_reviews = place_statistics.total_reviews + 1,
                    approved_reviews = place_statistics.approved_reviews + 1,
                    last_review_at = $2,
                    updated_at = NOW()`,
                [review.place_id, review.created_at]
            );
        }
        
        await client.query('COMMIT');
        
        return review;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Add to favorites
 */
async function addFavorite(userId, placeId) {
    const result = await masterPool.query(
        `INSERT INTO favorites (user_id, place_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, place_id) DO NOTHING
         RETURNING *`,
        [userId, placeId]
    );
    
    return result.rows[0];
}

/**
 * Remove from favorites
 */
async function removeFavorite(userId, placeId) {
    const result = await masterPool.query(
        `DELETE FROM favorites
         WHERE user_id = $1 AND place_id = $2
         RETURNING *`,
        [userId, placeId]
    );
    
    return result.rowCount > 0;
}

/**
 * Increment place view count (write-behind pattern)
 */
async function recordPlaceView(placeId, date = new Date()) {
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    await masterPool.query(
        `INSERT INTO place_view_logs (place_id, view_date, view_count)
         VALUES ($1, $2, 1)
         ON CONFLICT (place_id, view_date)
         DO UPDATE SET view_count = place_view_logs.view_count + 1`,
        [placeId, dateStr]
    );
}

// =============================================
// Statistics and Maintenance
// =============================================

/**
 * Refresh place statistics (full recalculation)
 */
async function refreshPlaceStatistics(placeId) {
    await masterPool.query('SELECT refresh_place_statistics($1)', [placeId]);
}

/**
 * Refresh materialized views
 */
async function refreshMaterializedViews() {
    const client = await masterPool.connect();
    
    try {
        console.log('Refreshing materialized views...');
        
        await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places');
        console.log('Refreshed mv_top_places');
        
        await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_city');
        console.log('Refreshed mv_top_places_by_city');
        
        await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_places_by_category');
        console.log('Refreshed mv_top_places_by_category');
        
        await client.query('REFRESH MATERIALIZED VIEW CONCURRENTLY mv_trending_places');
        console.log('Refreshed mv_trending_places');
        
        console.log('All materialized views refreshed successfully');
    } catch (error) {
        console.error('Error refreshing materialized views:', error);
        throw error;
    } finally {
        client.release();
    }
}

/**
 * Archive old view logs (data retention)
 */
async function archiveOldViewLogs(daysToKeep = 90) {
    const client = await masterPool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Archive to monthly stats
        await client.query(`
            INSERT INTO place_monthly_stats (place_id, year_month, total_views)
            SELECT 
                place_id,
                TO_CHAR(view_date, 'YYYY-MM') as year_month,
                SUM(view_count) as total_views
            FROM place_view_logs
            WHERE view_date < CURRENT_DATE - INTERVAL '${daysToKeep} days'
            GROUP BY place_id, TO_CHAR(view_date, 'YYYY-MM')
            ON CONFLICT (place_id, year_month)
            DO UPDATE SET total_views = place_monthly_stats.total_views + EXCLUDED.total_views
        `);
        
        // Delete old logs
        const deleteResult = await client.query(
            `DELETE FROM place_view_logs
             WHERE view_date < CURRENT_DATE - INTERVAL '${daysToKeep} days'`
        );
        
        await client.query('COMMIT');
        
        console.log(`Archived and deleted ${deleteResult.rowCount} old view log entries`);
        return deleteResult.rowCount;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

// =============================================
// Exports
// =============================================

module.exports = {
    // Read operations
    getPlaceDetail,
    getPlaceList,
    getTopPlaces,
    getTopPlacesByCity,
    getNearbyPlaces,
    searchPlaces,
    getTrendingPlaces,
    getPlaceReviews,
    
    // Write operations
    createPlace,
    createReview,
    addFavorite,
    removeFavorite,
    recordPlaceView,
    
    // Maintenance
    refreshPlaceStatistics,
    refreshMaterializedViews,
    archiveOldViewLogs,
    
    // Connection pools
    masterPool,
    replicaPools,
};
