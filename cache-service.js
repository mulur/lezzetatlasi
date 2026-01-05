/**
 * Lezzet Atlası - Redis Cache Strategy Implementation
 * 
 * Multi-tier caching with Redis for high-performance data access
 */

const Redis = require('ioredis');
const crypto = require('crypto');

// =============================================
// Redis Configuration
// =============================================

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
};

// Create Redis clients
const redis = new Redis(redisConfig);
const redisPub = new Redis(redisConfig);
const redisSub = new Redis(redisConfig);

// =============================================
// Cache Key Patterns and TTL
// =============================================

const CACHE_KEYS = {
    // Place detail cache - 1 hour
    PLACE_DETAIL: (id) => `place:detail:${id}`,
    PLACE_DETAIL_TTL: 3600,
    
    // Place list cache - 5 minutes
    PLACE_LIST: (params) => `place:list:${createHash(params)}`,
    PLACE_LIST_TTL: 300,
    
    // City-based list - 10 minutes
    PLACE_LIST_BY_CITY: (city, page, limit) => `place:list:city:${city}:${page}:${limit}`,
    PLACE_LIST_BY_CITY_TTL: 600,
    
    // Category-based list - 10 minutes
    PLACE_LIST_BY_CATEGORY: (categoryId, page, limit) => `place:list:cat:${categoryId}:${page}:${limit}`,
    PLACE_LIST_BY_CATEGORY_TTL: 600,
    
    // Top places - 15 minutes
    TOP_PLACES: (limit) => `place:top:${limit}`,
    TOP_PLACES_TTL: 900,
    
    // Place statistics - 30 minutes
    PLACE_STATS: (id) => `place:stats:${id}`,
    PLACE_STATS_TTL: 1800,
    
    // Categories - 1 day
    CATEGORIES_ALL: 'categories:all',
    CATEGORIES_TREE: 'categories:tree',
    CATEGORIES_TTL: 86400,
    
    // Search results - 30 minutes
    SEARCH_RESULTS: (query, filters) => `search:${createHash({ query, ...filters })}`,
    SEARCH_RESULTS_TTL: 1800,
    
    // User favorites - 5 minutes
    USER_FAVORITES: (userId) => `user:favorites:${userId}`,
    USER_FAVORITES_TTL: 300,
    
    // Recent places - 10 minutes
    RECENT_PLACES: (limit) => `place:recent:${limit}`,
    RECENT_PLACES_TTL: 600,
    
    // Nearby places - 15 minutes
    NEARBY_PLACES: (lat, lon, radius) => `place:nearby:${lat}:${lon}:${radius}`,
    NEARBY_PLACES_TTL: 900,
    
    // Trending places - 5 minutes
    TRENDING_PLACES: (limit) => `place:trending:${limit}`,
    TRENDING_PLACES_TTL: 300,
    
    // View count (temporary counter)
    PLACE_VIEW_COUNT: (placeId, date) => `place:views:${placeId}:${date}`,
    PLACE_VIEW_COUNT_TTL: 86400 * 7, // 7 days
    
    // Rate limiting
    RATE_LIMIT: (ip, endpoint) => `ratelimit:${ip}:${endpoint}`,
    RATE_LIMIT_TTL: 60,
};

// =============================================
// Helper Functions
// =============================================

/**
 * Create hash from object for cache key
 */
function createHash(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return crypto.createHash('md5').update(str).digest('hex');
}

/**
 * Serialize data for storage
 */
function serialize(data) {
    return JSON.stringify(data);
}

/**
 * Deserialize data from storage
 */
function deserialize(data) {
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch (err) {
        console.error('Deserialization error:', err);
        return null;
    }
}

// =============================================
// Cache Service Class
// =============================================

class CacheService {
    constructor(redisClient) {
        this.redis = redisClient;
        this.localCache = new Map();
        this.maxLocalCacheSize = 1000;
        this.localCacheTTL = 60000; // 60 seconds
    }
    
    /**
     * Get value from cache (L1 -> L2)
     */
    async get(key) {
        // L1: Check local cache first
        const localValue = this.getFromLocalCache(key);
        if (localValue !== null) {
            return localValue;
        }
        
        // L2: Check Redis
        const redisValue = await this.redis.get(key);
        if (redisValue) {
            const data = deserialize(redisValue);
            // Store in local cache
            this.setToLocalCache(key, data);
            return data;
        }
        
        return null;
    }
    
    /**
     * Set value in cache (both L1 and L2)
     */
    async set(key, value, ttl = 3600) {
        const serialized = serialize(value);
        
        // Set in Redis with TTL
        await this.redis.setex(key, ttl, serialized);
        
        // Set in local cache
        this.setToLocalCache(key, value);
        
        return true;
    }
    
    /**
     * Delete from cache
     */
    async del(key) {
        await this.redis.del(key);
        this.localCache.delete(key);
        return true;
    }
    
    /**
     * Delete multiple keys matching pattern
     */
    async delPattern(pattern) {
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
        
        // Clear local cache entries matching pattern
        for (const [key] of this.localCache) {
            if (this.matchPattern(key, pattern)) {
                this.localCache.delete(key);
            }
        }
        
        return keys.length;
    }
    
    /**
     * Get or set pattern (cache-aside)
     */
    async getOrSet(key, fetcher, ttl = 3600) {
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        
        // Fetch fresh data
        const fresh = await fetcher();
        
        // Store in cache
        if (fresh !== null && fresh !== undefined) {
            await this.set(key, fresh, ttl);
        }
        
        return fresh;
    }
    
    /**
     * Get with lock to prevent cache stampede
     */
    async getOrSetWithLock(key, fetcher, ttl = 3600, lockTTL = 10) {
        // Try to get from cache
        const cached = await this.get(key);
        if (cached !== null) {
            return cached;
        }
        
        const lockKey = `lock:${key}`;
        
        // Try to acquire lock
        const acquired = await this.redis.set(lockKey, '1', 'EX', lockTTL, 'NX');
        
        if (acquired) {
            try {
                // Fetch fresh data
                const fresh = await fetcher();
                
                // Store in cache
                if (fresh !== null && fresh !== undefined) {
                    await this.set(key, fresh, ttl);
                }
                
                return fresh;
            } finally {
                // Release lock
                await this.redis.del(lockKey);
            }
        } else {
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, 100));
            return this.getOrSetWithLock(key, fetcher, ttl, lockTTL);
        }
    }
    
    /**
     * Increment counter
     */
    async incr(key, ttl = null) {
        const value = await this.redis.incr(key);
        if (ttl && value === 1) {
            await this.redis.expire(key, ttl);
        }
        return value;
    }
    
    /**
     * Add to sorted set
     */
    async zadd(key, score, member) {
        return this.redis.zadd(key, score, member);
    }
    
    /**
     * Get sorted set range
     */
    async zrevrange(key, start, stop, withScores = false) {
        if (withScores) {
            return this.redis.zrevrange(key, start, stop, 'WITHSCORES');
        }
        return this.redis.zrevrange(key, start, stop);
    }
    
    /**
     * Add to set
     */
    async sadd(key, ...members) {
        return this.redis.sadd(key, ...members);
    }
    
    /**
     * Get set members
     */
    async smembers(key) {
        return this.redis.smembers(key);
    }
    
    /**
     * Set hash field
     */
    async hset(key, field, value) {
        return this.redis.hset(key, field, serialize(value));
    }
    
    /**
     * Get hash field
     */
    async hget(key, field) {
        const value = await this.redis.hget(key, field);
        return deserialize(value);
    }
    
    /**
     * Get all hash fields
     */
    async hgetall(key) {
        const data = await this.redis.hgetall(key);
        const result = {};
        for (const [field, value] of Object.entries(data)) {
            result[field] = deserialize(value);
        }
        return result;
    }
    
    /**
     * Geo add
     */
    async geoadd(key, longitude, latitude, member) {
        return this.redis.geoadd(key, longitude, latitude, member);
    }
    
    /**
     * Geo radius search
     */
    async georadius(key, longitude, latitude, radius, unit = 'km', withDist = true) {
        const args = [key, longitude, latitude, radius, unit];
        if (withDist) {
            args.push('WITHDIST');
        }
        return this.redis.georadius(...args);
    }
    
    // =============================================
    // Local Cache (L1) Methods
    // =============================================
    
    getFromLocalCache(key) {
        const entry = this.localCache.get(key);
        if (!entry) return null;
        
        // Check if expired
        if (Date.now() > entry.expiry) {
            this.localCache.delete(key);
            return null;
        }
        
        return entry.value;
    }
    
    setToLocalCache(key, value) {
        // Implement LRU eviction
        if (this.localCache.size >= this.maxLocalCacheSize) {
            // Remove oldest entry
            const firstKey = this.localCache.keys().next().value;
            this.localCache.delete(firstKey);
        }
        
        this.localCache.set(key, {
            value,
            expiry: Date.now() + this.localCacheTTL,
        });
    }
    
    clearLocalCache() {
        this.localCache.clear();
    }
    
    matchPattern(key, pattern) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        return regex.test(key);
    }
}

// Create singleton instance
const cacheService = new CacheService(redis);

// =============================================
// Cache Invalidation Service
// =============================================

class CacheInvalidationService {
    constructor(cacheService, publisher) {
        this.cache = cacheService;
        this.publisher = publisher;
    }
    
    /**
     * Invalidate place-related caches
     */
    async onPlaceUpdate(placeId) {
        const patterns = [
            CACHE_KEYS.PLACE_DETAIL(placeId),
            CACHE_KEYS.PLACE_STATS(placeId),
            'place:list:*',
            'place:top:*',
            'place:recent:*',
            'place:trending:*',
        ];
        
        await Promise.all(patterns.map(pattern => this.cache.delPattern(pattern)));
        
        // Publish invalidation event
        await this.publisher.publish('cache:invalidate', JSON.stringify({
            type: 'place_update',
            placeId,
            patterns,
        }));
    }
    
    /**
     * Invalidate review-related caches
     */
    async onReviewAdd(placeId) {
        const patterns = [
            CACHE_KEYS.PLACE_DETAIL(placeId),
            CACHE_KEYS.PLACE_STATS(placeId),
            'place:list:*',
        ];
        
        await Promise.all(patterns.map(pattern => this.cache.delPattern(pattern)));
    }
    
    /**
     * Invalidate favorite-related caches
     */
    async onFavoriteAdd(userId, placeId) {
        const patterns = [
            CACHE_KEYS.USER_FAVORITES(userId),
            CACHE_KEYS.PLACE_STATS(placeId),
        ];
        
        await Promise.all(patterns.map(pattern => this.cache.delPattern(pattern)));
    }
    
    /**
     * Invalidate category caches
     */
    async onCategoryUpdate() {
        const patterns = [
            CACHE_KEYS.CATEGORIES_ALL,
            CACHE_KEYS.CATEGORIES_TREE,
            'place:list:cat:*',
        ];
        
        await Promise.all(patterns.map(pattern => this.cache.delPattern(pattern)));
    }
}

const invalidationService = new CacheInvalidationService(cacheService, redisPub);

// =============================================
// Application-Level Cache Functions
// =============================================

/**
 * Get place detail with caching
 */
async function getPlaceDetailCached(placeId, fetcher) {
    const key = CACHE_KEYS.PLACE_DETAIL(placeId);
    return cacheService.getOrSetWithLock(
        key,
        fetcher,
        CACHE_KEYS.PLACE_DETAIL_TTL
    );
}

/**
 * Get place list with caching
 */
async function getPlaceListCached(params, fetcher) {
    const key = CACHE_KEYS.PLACE_LIST(params);
    return cacheService.getOrSet(
        key,
        fetcher,
        CACHE_KEYS.PLACE_LIST_TTL
    );
}

/**
 * Get top places with caching
 */
async function getTopPlacesCached(limit, fetcher) {
    const key = CACHE_KEYS.TOP_PLACES(limit);
    return cacheService.getOrSet(
        key,
        fetcher,
        CACHE_KEYS.TOP_PLACES_TTL
    );
}

/**
 * Increment place view count
 */
async function incrementPlaceView(placeId) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = CACHE_KEYS.PLACE_VIEW_COUNT(placeId, date);
    return cacheService.incr(key, CACHE_KEYS.PLACE_VIEW_COUNT_TTL);
}

/**
 * Cache popular places in sorted set
 */
async function cachePopularPlaces(places) {
    const key = 'place:popular';
    
    // Clear existing
    await redis.del(key);
    
    // Add all places with their popularity scores
    const pipeline = redis.pipeline();
    places.forEach(place => {
        pipeline.zadd(key, place.popularity_score, place.id);
    });
    await pipeline.exec();
    
    // Set expiry
    await redis.expire(key, 3600); // 1 hour
}

/**
 * Get popular places from sorted set
 */
async function getPopularPlacesFromCache(start = 0, end = 99) {
    return cacheService.zrevrange('place:popular', start, end);
}

/**
 * Cache place locations for geo queries
 */
async function cachePlaceLocations(places) {
    const key = 'places:locations';
    
    // Clear existing
    await redis.del(key);
    
    // Add all places with their coordinates
    const pipeline = redis.pipeline();
    places.forEach(place => {
        if (place.longitude && place.latitude) {
            pipeline.geoadd(key, place.longitude, place.latitude, place.id);
        }
    });
    await pipeline.exec();
    
    // Set expiry
    await redis.expire(key, 3600); // 1 hour
}

/**
 * Get nearby places from cache
 */
async function getNearbyPlacesFromCache(longitude, latitude, radius = 5) {
    return cacheService.georadius(
        'places:locations',
        longitude,
        latitude,
        radius,
        'km',
        true
    );
}

/**
 * Rate limiting check
 */
async function checkRateLimit(ip, endpoint, maxRequests = 100) {
    const key = CACHE_KEYS.RATE_LIMIT(ip, endpoint);
    const count = await cacheService.incr(key, CACHE_KEYS.RATE_LIMIT_TTL);
    return count <= maxRequests;
}

// =============================================
// Cache Warming Functions
// =============================================

/**
 * Warm up cache with popular data
 */
async function warmUpCache(db) {
    console.log('Starting cache warm-up...');
    
    try {
        // 1. Load top places
        const topPlaces = await db.query(`
            SELECT * FROM mv_top_places LIMIT 100
        `);
        await cachePopularPlaces(topPlaces.rows);
        console.log('Cached top places');
        
        // 2. Load place locations
        const locations = await db.query(`
            SELECT id, latitude, longitude 
            FROM places 
            WHERE is_active = true AND latitude IS NOT NULL
        `);
        await cachePlaceLocations(locations.rows);
        console.log('Cached place locations');
        
        // 3. Cache categories
        const categories = await db.query(`
            SELECT * FROM categories WHERE is_active = true
        `);
        await cacheService.set(
            CACHE_KEYS.CATEGORIES_ALL,
            categories.rows,
            CACHE_KEYS.CATEGORIES_TTL
        );
        console.log('Cached categories');
        
        // 4. Cache top places by major cities
        const cities = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Bursa'];
        for (const city of cities) {
            const cityPlaces = await db.query(`
                SELECT * FROM mv_top_places_by_city 
                WHERE city = $1 AND city_rank <= 50
            `, [city]);
            
            const key = CACHE_KEYS.PLACE_LIST_BY_CITY(city, 1, 50);
            await cacheService.set(key, cityPlaces.rows, CACHE_KEYS.PLACE_LIST_BY_CITY_TTL);
        }
        console.log('Cached city-specific places');
        
        console.log('Cache warm-up completed');
    } catch (error) {
        console.error('Cache warm-up error:', error);
    }
}

// =============================================
// Cache Monitoring
// =============================================

/**
 * Get cache statistics
 */
async function getCacheStats() {
    const info = await redis.info('stats');
    const memory = await redis.info('memory');
    
    return {
        connected: redis.status === 'ready',
        stats: parseRedisInfo(info),
        memory: parseRedisInfo(memory),
    };
}

function parseRedisInfo(info) {
    const lines = info.split('\r\n');
    const result = {};
    
    lines.forEach(line => {
        if (line && !line.startsWith('#')) {
            const [key, value] = line.split(':');
            if (key && value) {
                result[key] = isNaN(value) ? value : Number(value);
            }
        }
    });
    
    return result;
}

/**
 * Monitor cache hit rate
 */
async function getCacheHitRate() {
    const stats = await getCacheStats();
    const hits = stats.stats.keyspace_hits || 0;
    const misses = stats.stats.keyspace_misses || 0;
    const total = hits + misses;
    
    return {
        hits,
        misses,
        total,
        hitRate: total > 0 ? (hits / total * 100).toFixed(2) + '%' : 'N/A',
    };
}

// =============================================
// Exports
// =============================================

module.exports = {
    redis,
    cacheService,
    invalidationService,
    CACHE_KEYS,
    
    // Application functions
    getPlaceDetailCached,
    getPlaceListCached,
    getTopPlacesCached,
    incrementPlaceView,
    cachePopularPlaces,
    getPopularPlacesFromCache,
    cachePlaceLocations,
    getNearbyPlacesFromCache,
    checkRateLimit,
    
    // Maintenance
    warmUpCache,
    getCacheStats,
    getCacheHitRate,
};
