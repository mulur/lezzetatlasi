-- Lezzet Atlası - Veritabanı Şema Dosyası
-- MySQL/MariaDB
-- Versiyon: 1.0
-- Tarih: 2026-01-05

-- Veritabanı oluşturma
CREATE DATABASE IF NOT EXISTS lezzetatlasi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lezzetatlasi;

-- ============================================================================
-- 1. USERS & AUTHENTICATION
-- ============================================================================

-- Users: Kullanıcı tablosu
CREATE TABLE Users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at TIMESTAMP NULL,
    
    INDEX idx_email (email),
    INDEX idx_username (username),
    INDEX idx_is_active (is_active),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. GOURMET RANKS
-- ============================================================================

-- GourmetRanks: Rütbe tanımları
CREATE TABLE GourmetRanks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    min_score DECIMAL(10,2) NOT NULL,
    max_score DECIMAL(10,2) NULL,
    color VARCHAR(7) NOT NULL,
    icon VARCHAR(50) NULL,
    benefits JSON NULL,
    display_order INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_score_range (min_score, max_score),
    INDEX idx_display_order (display_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GourmetProfile: Kullanıcı gurme profilleri
CREATE TABLE GourmetProfile (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL UNIQUE,
    bio TEXT NULL,
    avatar_url VARCHAR(500) NULL,
    total_reviews INT NOT NULL DEFAULT 0,
    current_rank_id INT NOT NULL DEFAULT 1,
    total_score DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (current_rank_id) REFERENCES GourmetRanks(id),
    
    INDEX idx_user_id (user_id),
    INDEX idx_rank_id (current_rank_id),
    INDEX idx_total_score (total_score DESC),
    INDEX idx_total_reviews (total_reviews DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- GourmetScoreSnapshots: Skor geçmişi
CREATE TABLE GourmetScoreSnapshots (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    gourmet_id BIGINT NOT NULL,
    score DECIMAL(10,2) NOT NULL,
    rank_id INT NOT NULL,
    review_count INT NOT NULL,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (gourmet_id) REFERENCES GourmetProfile(id) ON DELETE CASCADE,
    FOREIGN KEY (rank_id) REFERENCES GourmetRanks(id),
    
    UNIQUE KEY uk_gourmet_date (gourmet_id, snapshot_date),
    INDEX idx_gourmet_id (gourmet_id),
    INDEX idx_snapshot_date (snapshot_date DESC),
    INDEX idx_score (score DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. INVITE SYSTEM
-- ============================================================================

-- InviteCodes: Davet kodu sistemi
CREATE TABLE InviteCodes (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_by BIGINT NOT NULL,
    used_by BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    expires_at TIMESTAMP NULL,
    max_uses INT NOT NULL DEFAULT 1,
    current_uses INT NOT NULL DEFAULT 0,
    
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (used_by) REFERENCES Users(id) ON DELETE SET NULL,
    
    INDEX idx_code (code),
    INDEX idx_created_by (created_by),
    INDEX idx_used_by (used_by),
    INDEX idx_is_active (is_active),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. PLACES & LOCATIONS
-- ============================================================================

-- Places: Mekanlar
CREATE TABLE Places (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10,8) NULL,
    longitude DECIMAL(11,8) NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100) NULL,
    category VARCHAR(50) NOT NULL,
    phone VARCHAR(20) NULL,
    website VARCHAR(500) NULL,
    avg_rating DECIMAL(3,2) NULL DEFAULT 0.00,
    total_ratings INT NOT NULL DEFAULT 0,
    price_range ENUM('$', '$$', '$$$', '$$$$') NULL,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE RESTRICT,
    
    INDEX idx_slug (slug),
    INDEX idx_city (city),
    INDEX idx_district (district),
    INDEX idx_category (category),
    INDEX idx_avg_rating (avg_rating DESC),
    INDEX idx_location (latitude, longitude),
    INDEX idx_is_verified (is_verified),
    INDEX idx_is_active (is_active),
    INDEX idx_place_active_verified (is_active, is_verified),
    INDEX idx_place_city_category (city, category, avg_rating DESC),
    FULLTEXT INDEX ft_name_description (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PlacePhotos: Mekan fotoğrafları
CREATE TABLE PlacePhotos (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    place_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    caption VARCHAR(500) NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_cover BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    FOREIGN KEY (place_id) REFERENCES Places(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE RESTRICT,
    
    INDEX idx_place_id (place_id),
    INDEX idx_user_id (user_id),
    INDEX idx_display_order (place_id, display_order),
    INDEX idx_is_cover (place_id, is_cover),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. MENUS & MENU ITEMS
-- ============================================================================

-- PlaceMenus: Menü kategorileri
CREATE TABLE PlaceMenus (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    place_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    FOREIGN KEY (place_id) REFERENCES Places(id) ON DELETE CASCADE,
    
    INDEX idx_place_id (place_id),
    INDEX idx_display_order (place_id, display_order),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- MenuItems: Menü öğeleri
CREATE TABLE MenuItems (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    menu_id BIGINT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    price DECIMAL(10,2) NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    display_order INT NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (menu_id) REFERENCES PlaceMenus(id) ON DELETE CASCADE,
    
    INDEX idx_menu_id (menu_id),
    INDEX idx_display_order (menu_id, display_order),
    INDEX idx_is_available (is_available),
    FULLTEXT INDEX ft_name_description (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PriceHistory: Fiyat geçmişi
CREATE TABLE PriceHistory (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    menu_item_id BIGINT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recorded_by BIGINT NULL,
    
    FOREIGN KEY (menu_item_id) REFERENCES MenuItems(id) ON DELETE CASCADE,
    FOREIGN KEY (recorded_by) REFERENCES Users(id) ON DELETE SET NULL,
    
    INDEX idx_menu_item_id (menu_item_id),
    INDEX idx_recorded_at (recorded_at DESC),
    INDEX idx_recorded_by (recorded_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. RATINGS & COMMENTS
-- ============================================================================

-- PlaceRatings: Değerlendirmeler
CREATE TABLE PlaceRatings (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    place_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating DECIMAL(2,1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
    taste_score DECIMAL(2,1) NULL CHECK (taste_score >= 1.0 AND taste_score <= 5.0),
    service_score DECIMAL(2,1) NULL CHECK (service_score >= 1.0 AND service_score <= 5.0),
    ambiance_score DECIMAL(2,1) NULL CHECK (ambiance_score >= 1.0 AND ambiance_score <= 5.0),
    price_score DECIMAL(2,1) NULL CHECK (price_score >= 1.0 AND price_score <= 5.0),
    visit_date DATE NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (place_id) REFERENCES Places(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    
    UNIQUE KEY uk_user_place (user_id, place_id),
    INDEX idx_place_id (place_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating (rating DESC),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_rating_place_user (place_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PlaceComments: Yorumlar
CREATE TABLE PlaceComments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    place_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating_id BIGINT NOT NULL,
    comment_text TEXT NOT NULL,
    visit_date DATE NULL,
    is_edited BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    moderated_at TIMESTAMP NULL,
    moderated_by BIGINT NULL,
    
    FOREIGN KEY (place_id) REFERENCES Places(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (rating_id) REFERENCES PlaceRatings(id) ON DELETE CASCADE,
    FOREIGN KEY (moderated_by) REFERENCES Users(id) ON DELETE SET NULL,
    
    UNIQUE KEY uk_rating_comment (rating_id),
    INDEX idx_place_id (place_id),
    INDEX idx_user_id (user_id),
    INDEX idx_rating_id (rating_id),
    INDEX idx_created_at (created_at DESC),
    INDEX idx_is_hidden (is_hidden),
    INDEX idx_comment_place_active (place_id, is_hidden, created_at DESC),
    FULLTEXT INDEX ft_comment_text (comment_text)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- CommentReactions: Yorum tepkileri
CREATE TABLE CommentReactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    comment_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    reaction_type ENUM('helpful', 'thanks', 'funny', 'inspiring') NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (comment_id) REFERENCES PlaceComments(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    
    UNIQUE KEY uk_user_comment_reaction (user_id, comment_id, reaction_type),
    INDEX idx_comment_id (comment_id),
    INDEX idx_user_id (user_id),
    INDEX idx_reaction_type (reaction_type),
    INDEX idx_created_at (created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. AGGREGATION & SUMMARY TABLES
-- ============================================================================

-- PlaceRatingSummary: Mekan değerlendirme özeti (denormalized)
CREATE TABLE PlaceRatingSummary (
    place_id BIGINT PRIMARY KEY,
    avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    total_ratings INT NOT NULL DEFAULT 0,
    avg_taste DECIMAL(3,2) NULL,
    avg_service DECIMAL(3,2) NULL,
    avg_ambiance DECIMAL(3,2) NULL,
    avg_price DECIMAL(3,2) NULL,
    rating_5_count INT NOT NULL DEFAULT 0,
    rating_4_count INT NOT NULL DEFAULT 0,
    rating_3_count INT NOT NULL DEFAULT 0,
    rating_2_count INT NOT NULL DEFAULT 0,
    rating_1_count INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (place_id) REFERENCES Places(id) ON DELETE CASCADE,
    
    INDEX idx_avg_rating (avg_rating DESC),
    INDEX idx_total_ratings (total_ratings DESC),
    INDEX idx_last_updated (last_updated)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INITIAL DATA: GOURMET RANKS
-- ============================================================================

INSERT INTO GourmetRanks (name, min_score, max_score, color, icon, benefits, display_order) VALUES
('Yeni Keşifçi', 0.00, 100.00, '#95A5A6', 'compass', 
 '{"daily_reviews": 5, "photo_uploads": 10, "invite_codes": 0}', 1),
('Meraklı Damak', 100.01, 300.00, '#3498DB', 'utensils', 
 '{"daily_reviews": 10, "photo_uploads": 20, "invite_codes": 1, "badge": "bronze"}', 2),
('Lezzet Avcısı', 300.01, 600.00, '#9B59B6', 'search', 
 '{"daily_reviews": 15, "photo_uploads": 30, "invite_codes": 3, "badge": "silver", "early_access": true}', 3),
('Gastronomi Tutkunu', 600.01, 1000.00, '#E67E22', 'heart', 
 '{"daily_reviews": 25, "photo_uploads": 50, "invite_codes": 5, "badge": "gold", "early_access": true, "priority_support": true}', 4),
('Gurme Uzman', 1000.01, 2000.00, '#E74C3C', 'star', 
 '{"daily_reviews": 50, "photo_uploads": 100, "invite_codes": 10, "badge": "platinum", "early_access": true, "priority_support": true, "verified_reviewer": true}', 5),
('Master Gurme', 2000.01, NULL, '#F39C12', 'crown', 
 '{"daily_reviews": "unlimited", "photo_uploads": "unlimited", "invite_codes": 20, "badge": "diamond", "early_access": true, "priority_support": true, "verified_reviewer": true, "editorial_access": true}', 6);

-- ============================================================================
-- TRIGGERS & STORED PROCEDURES
-- ============================================================================

-- Trigger: PlaceRatings ekleme sonrası GourmetProfile güncelleme
DELIMITER //

CREATE TRIGGER after_rating_insert
AFTER INSERT ON PlaceRatings
FOR EACH ROW
BEGIN
    DECLARE v_gourmet_id BIGINT;
    
    -- GourmetProfile ID'sini al
    SELECT id INTO v_gourmet_id 
    FROM GourmetProfile 
    WHERE user_id = NEW.user_id;
    
    -- Eğer GourmetProfile yoksa oluştur
    IF v_gourmet_id IS NULL THEN
        INSERT INTO GourmetProfile (user_id, total_reviews)
        VALUES (NEW.user_id, 1);
    ELSE
        -- Mevcut profili güncelle
        UPDATE GourmetProfile
        SET total_reviews = total_reviews + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = v_gourmet_id;
    END IF;
    
    -- PlaceRatingSummary güncelleme (yoksa oluştur)
    INSERT INTO PlaceRatingSummary (place_id, avg_rating, total_ratings)
    VALUES (NEW.place_id, NEW.rating, 1)
    ON DUPLICATE KEY UPDATE
        avg_rating = (
            SELECT AVG(rating) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id
        ),
        total_ratings = total_ratings + 1,
        avg_taste = (
            SELECT AVG(taste_score) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id AND taste_score IS NOT NULL
        ),
        avg_service = (
            SELECT AVG(service_score) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id AND service_score IS NOT NULL
        ),
        avg_ambiance = (
            SELECT AVG(ambiance_score) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id AND ambiance_score IS NOT NULL
        ),
        avg_price = (
            SELECT AVG(price_score) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id AND price_score IS NOT NULL
        ),
        rating_5_count = (
            SELECT COUNT(*) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id AND rating >= 4.5
        ),
        rating_4_count = (
            SELECT COUNT(*) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id AND rating >= 3.5 AND rating < 4.5
        ),
        rating_3_count = (
            SELECT COUNT(*) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id AND rating >= 2.5 AND rating < 3.5
        ),
        rating_2_count = (
            SELECT COUNT(*) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id AND rating >= 1.5 AND rating < 2.5
        ),
        rating_1_count = (
            SELECT COUNT(*) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id AND rating < 1.5
        );
    
    -- Places tablosundaki denormalized verileri güncelle
    UPDATE Places
    SET avg_rating = (
            SELECT AVG(rating) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id
        ),
        total_ratings = (
            SELECT COUNT(*) 
            FROM PlaceRatings 
            WHERE place_id = NEW.place_id
        )
    WHERE id = NEW.place_id;
END//

-- Trigger: MenuItems fiyat değişikliği takibi
CREATE TRIGGER after_menuitem_price_update
AFTER UPDATE ON MenuItems
FOR EACH ROW
BEGIN
    IF OLD.price != NEW.price OR OLD.currency != NEW.currency THEN
        INSERT INTO PriceHistory (menu_item_id, price, currency)
        VALUES (NEW.id, NEW.price, NEW.currency);
    END IF;
END//

DELIMITER ;

-- ============================================================================
-- VIEWS (Optional - for convenience)
-- ============================================================================

-- View: Detaylı mekan listesi
CREATE VIEW v_places_detailed AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.city,
    p.district,
    p.category,
    p.price_range,
    p.is_verified,
    prs.avg_rating,
    prs.total_ratings,
    prs.avg_taste,
    prs.avg_service,
    prs.avg_ambiance,
    prs.avg_price,
    u.username as created_by_username,
    p.created_at
FROM Places p
LEFT JOIN PlaceRatingSummary prs ON prs.place_id = p.id
LEFT JOIN Users u ON u.id = p.created_by
WHERE p.is_active = TRUE;

-- View: Gurme liderlik tablosu
CREATE VIEW v_gourmet_leaderboard AS
SELECT 
    u.id,
    u.username,
    gp.total_score,
    gp.total_reviews,
    gr.name as rank_name,
    gr.color as rank_color,
    gr.icon as rank_icon,
    gp.avatar_url
FROM GourmetProfile gp
JOIN Users u ON u.id = gp.user_id
JOIN GourmetRanks gr ON gr.id = gp.current_rank_id
WHERE u.is_active = TRUE
ORDER BY gp.total_score DESC, gp.total_reviews DESC;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
