# Lezzet Atlası - Veritabanı Tasarım Dokümanı

## İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Entity-Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
3. [Tablo Şemaları](#tablo-şemaları)
4. [İndeksler](#indeksler)
5. [Gurme Rütbe Sistemi](#gurme-rütbe-sistemi)
6. [Rating/Comment Tablo Yapısı Analizi](#ratingcomment-tablo-yapısı-analizi)

---

## Genel Bakış

Lezzet Atlası uygulaması, kullanıcıların restoranları, kafeleri ve diğer yeme-içme mekanlarını keşfetmelerine, değerlendirmelerine ve paylaşmalarına olanak tanıyan sosyal bir platform tasarımıdır. Sistem, davet kodu bazlı üyelik, gurme profilleri, mekan değerlendirmeleri ve dinamik rütbe sistemi gibi özellikleri içermektedir.

### Temel Özellikler
- Davet kodu ile üyelik sistemi
- Gurme profilleri ve rütbe sistemi
- Mekan yönetimi (restoranlar, kafeler, vb.)
- Fotoğraf ve menü paylaşımı
- Değerlendirme ve yorum sistemi
- Fiyat geçmişi takibi
- Sosyal etkileşimler (reaksiyonlar)

---

## Entity-Relationship Diagram (ERD)

```
┌─────────────────┐         ┌──────────────────┐
│     Users       │1       1│  GourmetProfile  │
│─────────────────│─────────│──────────────────│
│ id (PK)         │         │ id (PK)          │
│ email           │         │ user_id (FK)     │
│ username        │         │ bio              │
│ password_hash   │         │ avatar_url       │
│ created_at      │         │ total_reviews    │
│ updated_at      │         │ current_rank_id  │
│ is_active       │         │ total_score      │
│ last_login      │         │ created_at       │
└─────────────────┘         └──────────────────┘
        │                            │
        │1                          │1
        │                            │
        │*                          │*
┌─────────────────┐         ┌──────────────────┐
│  InviteCodes    │         │ GourmetScoreSnap │
│─────────────────│         │──────────────────│
│ id (PK)         │         │ id (PK)          │
│ code (UNIQUE)   │         │ gourmet_id (FK)  │
│ created_by (FK) │         │ score            │
│ used_by (FK)    │         │ rank_id (FK)     │
│ created_at      │         │ review_count     │
│ used_at         │         │ snapshot_date    │
│ is_active       │         │ created_at       │
│ expires_at      │         └──────────────────┘
└─────────────────┘                  │
                                     │*
                                     │
                                     │1
                            ┌──────────────────┐
                            │  GourmetRanks    │
                            │──────────────────│
                            │ id (PK)          │
                            │ name             │
                            │ min_score        │
                            │ max_score        │
                            │ color            │
                            │ icon             │
                            │ benefits         │
                            └──────────────────┘

┌─────────────────┐
│     Places      │
│─────────────────│
│ id (PK)         │
│ name            │
│ slug (UNIQUE)   │
│ description     │
│ address         │
│ latitude        │
│ longitude       │
│ city            │
│ district        │
│ category        │
│ phone           │
│ website         │
│ avg_rating      │
│ total_ratings   │
│ price_range     │
│ created_by (FK) │
│ created_at      │
│ updated_at      │
│ is_verified     │
└─────────────────┘
        │
        │1
        │
        ├──────────────────┐
        │                  │
        │*                 │*
┌─────────────────┐  ┌──────────────────┐
│  PlacePhotos    │  │   PlaceMenus     │
│─────────────────│  │──────────────────│
│ id (PK)         │  │ id (PK)          │
│ place_id (FK)   │  │ place_id (FK)    │
│ user_id (FK)    │  │ name             │
│ photo_url       │  │ description      │
│ caption         │  │ display_order    │
│ display_order   │  │ created_at       │
│ is_cover        │  │ updated_at       │
│ created_at      │  │ is_active        │
└─────────────────┘  └──────────────────┘
                              │
                              │1
                              │
                              │*
                     ┌──────────────────┐
                     │   MenuItems      │
                     │──────────────────│
                     │ id (PK)          │
                     │ menu_id (FK)     │
                     │ name             │
                     │ description      │
                     │ price            │
                     │ currency         │
                     │ display_order    │
                     │ is_available     │
                     │ created_at       │
                     │ updated_at       │
                     └──────────────────┘
                              │
                              │1
                              │
                              │*
                     ┌──────────────────┐
                     │  PriceHistory    │
                     │──────────────────│
                     │ id (PK)          │
                     │ menu_item_id(FK) │
                     │ price            │
                     │ currency         │
                     │ recorded_at      │
                     │ recorded_by (FK) │
                     └──────────────────┘

        │
        │1
        │
        ├──────────────────────────────┐
        │                              │
        │*                             │*
┌─────────────────┐         ┌──────────────────┐
│  PlaceRatings   │         │  PlaceComments   │
│─────────────────│         │──────────────────│
│ id (PK)         │         │ id (PK)          │
│ place_id (FK)   │         │ place_id (FK)    │
│ user_id (FK)    │         │ user_id (FK)     │
│ rating (1-5)    │         │ rating_id (FK)   │
│ taste_score     │         │ comment_text     │
│ service_score   │         │ visit_date       │
│ ambiance_score  │         │ is_edited        │
│ price_score     │         │ created_at       │
│ visit_date      │         │ updated_at       │
│ created_at      │         │ is_hidden        │
│ updated_at      │         │ moderated_at     │
└─────────────────┘         └──────────────────┘
                                     │
                                     │1
                                     │
                                     │*
                            ┌──────────────────┐
                            │CommentReactions  │
                            │──────────────────│
                            │ id (PK)          │
                            │ comment_id (FK)  │
                            │ user_id (FK)     │
                            │ reaction_type    │
                            │ created_at       │
                            └──────────────────┘

        │
        │1
        │
        │1
┌─────────────────┐
│PlaceRatingSumm. │
│─────────────────│
│ place_id (PK,FK)│
│ avg_rating      │
│ total_ratings   │
│ avg_taste       │
│ avg_service     │
│ avg_ambiance    │
│ avg_price       │
│ rating_5_count  │
│ rating_4_count  │
│ rating_3_count  │
│ rating_2_count  │
│ rating_1_count  │
│ last_updated    │
└─────────────────┘
```

---

## Tablo Şemaları

### 1. Users (Kullanıcılar)
Sistemdeki tüm kullanıcıların temel bilgilerini tutar.

```sql
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
);
```

**Açıklama:**
- **id**: Benzersiz kullanıcı tanımlayıcısı
- **email**: Kullanıcının e-posta adresi (giriş için)
- **username**: Kullanıcı adı (profilde görünür)
- **password_hash**: Şifrelenmiş parola
- **is_active**: Hesap aktiflik durumu
- **email_verified**: E-posta doğrulama durumu

---

### 2. GourmetProfile (Gurme Profilleri)
Kullanıcıların gurme profil bilgilerini ve skorlarını tutar.

```sql
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
);
```

**Açıklama:**
- **user_id**: Users tablosuna referans (1-1 ilişki)
- **total_reviews**: Toplam yorum sayısı
- **current_rank_id**: Mevcut gurme rütbesi
- **total_score**: Toplam gurme skoru (dinamik hesaplanır)

---

### 3. InviteCodes (Davet Kodları)
Davet bazlı üyelik sistemi için kullanılan kodları tutar.

```sql
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
);
```

**Açıklama:**
- **code**: Benzersiz davet kodu
- **created_by**: Kodu oluşturan kullanıcı
- **used_by**: Kodu kullanan kullanıcı
- **max_uses**: Kodun maksimum kullanım sayısı
- **current_uses**: Şu ana kadar kullanım sayısı

---

### 4. Places (Mekanlar)
Restoranlar, kafeler ve diğer yeme-içme mekanlarını tutar.

```sql
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
    FULLTEXT INDEX ft_name_description (name, description)
);
```

**Açıklama:**
- **slug**: URL dostu benzersiz tanımlayıcı
- **latitude/longitude**: Konum koordinatları
- **category**: Mekan kategorisi (restaurant, cafe, bar, vb.)
- **avg_rating**: Ortalama değerlendirme (denormalize edilmiş)
- **price_range**: Fiyat aralığı göstergesi

---

### 5. PlacePhotos (Mekan Fotoğrafları)
Mekanlara ait fotoğrafları tutar.

```sql
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
);
```

**Açıklama:**
- **display_order**: Fotoğrafların gösterim sırası
- **is_cover**: Kapak fotoğrafı olup olmadığı
- Her mekan için bir kapak fotoğrafı olabilir

---

### 6. PlaceMenus (Mekan Menüleri)
Mekanların menü kategorilerini tutar (örn: Ana Yemekler, Tatlılar, İçecekler).

```sql
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
);
```

**Açıklama:**
- Menüleri kategorilere ayırmak için kullanılır
- Her mekanın birden fazla menü kategorisi olabilir

---

### 7. MenuItems (Menü Öğeleri)
Menülerdeki tek tek yemek/içecek öğelerini tutar.

```sql
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
);
```

**Açıklama:**
- **price**: Opsiyonel fiyat bilgisi
- **currency**: Para birimi (TRY, USD, EUR, vb.)
- **is_available**: Öğenin mevcut olup olmadığı

---

### 8. PriceHistory (Fiyat Geçmişi)
Menü öğelerinin fiyat değişikliklerini takip eder.

```sql
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
);
```

**Açıklama:**
- Her fiyat değişikliği otomatik olarak kaydedilir
- Fiyat trendlerini analiz etmek için kullanılır

---

### 9. PlaceRatings (Mekan Değerlendirmeleri)
Kullanıcıların mekanlara verdiği değerlendirmeleri tutar.

```sql
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
    INDEX idx_created_at (created_at DESC)
);
```

**Açıklama:**
- **rating**: Genel değerlendirme (1-5 arası, zorunlu)
- **taste_score**: Lezzet skoru (opsiyonel detaylı değerlendirme)
- **service_score**: Servis skoru
- **ambiance_score**: Ambiyans skoru
- **price_score**: Fiyat/performans skoru
- Her kullanıcı bir mekana sadece bir değerlendirme yapabilir (UNIQUE constraint)

---

### 10. PlaceComments (Mekan Yorumları)
Değerlendirmelere ait metin yorumlarını tutar.

```sql
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
    FULLTEXT INDEX ft_comment_text (comment_text)
);
```

**Açıklama:**
- **rating_id**: İlişkili değerlendirme (1-1 ilişki)
- **is_edited**: Yorumun düzenlenip düzenlenmediği
- **is_hidden**: Moderasyon için gizlenme durumu
- Her değerlendirme için bir yorum olabilir

---

### 11. CommentReactions (Yorum Tepkileri)
Yorumlara verilen tepkileri tutar (beğeni, yardımcı oldu, vb.).

```sql
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
);
```

**Açıklama:**
- Kullanıcılar bir yoruma farklı tipte tepkiler verebilir
- Aynı kullanıcı aynı yoruma aynı tipte sadece bir tepki verebilir

---

### 12. GourmetRanks (Gurme Rütbeleri)
Sistemdeki gurme rütbe tanımlarını tutar.

```sql
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
);
```

**Örnek Veriler:**
```sql
INSERT INTO GourmetRanks (name, min_score, max_score, color, icon, display_order) VALUES
('Yeni Keşifçi', 0, 100, '#95A5A6', 'compass', 1),
('Meraklı Damak', 100, 300, '#3498DB', 'utensils', 2),
('Lezzet Avcısı', 300, 600, '#9B59B6', 'search', 3),
('Gastronomi Tutkunu', 600, 1000, '#E67E22', 'heart', 4),
('Gurme Uzman', 1000, 2000, '#E74C3C', 'star', 5),
('Master Gurme', 2000, NULL, '#F39C12', 'crown', 6);
```

**Açıklama:**
- **min_score/max_score**: Rütbe için gerekli skor aralığı
- **benefits**: Rütbe avantajları (JSON formatında)
- En yüksek rütbede max_score NULL olabilir (üst limit yok)

---

### 13. GourmetScoreSnapshots (Gurme Skor Anlık Görüntüleri)
Gurme skorlarının zaman içindeki değişimini takip eder.

```sql
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
);
```

**Açıklama:**
- Günlük/haftalık/aylık skor anlık görüntüleri
- Skor gelişimini grafiklerle göstermek için kullanılır
- İstatistik ve analiz için önemli veri kaynağı

---

### 14. PlaceRatingSummary (Mekan Değerlendirme Özeti)
Mekanların değerlendirme istatistiklerini denormalize ederek tutar (performans optimizasyonu).

```sql
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
);
```

**Açıklama:**
- Her mekan için bir satır
- Değerlendirme ekleme/güncelleme/silme işlemlerinde trigger ile güncellenir
- Sıralama ve filtreleme sorgularının performansını artırır
- Değerlendirme dağılımını (5 yıldız, 4 yıldız, vb.) gösterir

---

## İndeksler

### Performans Optimizasyonu için Önerilen Ek İndeksler

```sql
-- Kompozit indeksler (çoklu sütun sorguları için)
CREATE INDEX idx_place_active_verified ON Places(is_active, is_verified);
CREATE INDEX idx_place_city_category ON Places(city, category, avg_rating DESC);
CREATE INDEX idx_rating_place_user ON PlaceRatings(place_id, user_id);
CREATE INDEX idx_comment_place_active ON PlaceComments(place_id, is_hidden, created_at DESC);

-- Covering indeksler (sorgu tüm verileri indeksten alabilir)
CREATE INDEX idx_user_active_login ON Users(is_active, last_login, username);
CREATE INDEX idx_gourmet_leaderboard ON GourmetProfile(total_score DESC, total_reviews, user_id);

-- Spatial indeksler (konum bazlı sorgular için)
-- MySQL 5.7+ ve MariaDB 10.2.2+ için:
ALTER TABLE Places ADD SPATIAL INDEX idx_location_spatial (location);
-- location sütunu POINT tipinde olmalı

-- Partitioning (büyük tablolar için)
-- PriceHistory tablosu için yıllık partitioning örneği:
ALTER TABLE PriceHistory PARTITION BY RANGE (YEAR(recorded_at)) (
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p2024 VALUES LESS THAN (2025),
    PARTITION p2025 VALUES LESS THAN (2026),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

### İndeks Stratejisi

1. **Primary Keys (PK)**: Tüm tablolarda AUTO_INCREMENT BIGINT
2. **Foreign Keys (FK)**: Tüm foreign key'ler otomatik indekslenir
3. **Unique Constraints**: email, username, code, slug gibi alanlar
4. **Sık Sorgulanan Alanlar**: is_active, created_at, avg_rating, vb.
5. **Fulltext İndeksler**: Arama sorguları için (name, description, comment_text)
6. **Composite İndeksler**: Çoklu sütun WHERE koşulları için
7. **Covering İndeksler**: SELECT sorgularının tamamını indeksten karşılamak için

---

## Gurme Rütbe Sistemi

### Skor Hesaplama Formülü

Gurme skoru, kullanıcının platform üzerindeki aktivitelerini değerlendirir ve dinamik olarak hesaplanır.

```
total_score = (review_score × 0.40) + 
              (quality_score × 0.30) + 
              (engagement_score × 0.20) + 
              (contribution_score × 0.10)
```

#### 1. Review Score (Değerlendirme Skoru) - 40%
```
review_score = (total_reviews × 10) + 
               (detailed_reviews × 5) + 
               (photo_reviews × 3)

Detaylar:
- Her değerlendirme: 10 puan
- Detaylı değerlendirme (taste/service/ambiance/price skorları): +5 puan
- Fotoğraflı değerlendirme: +3 puan
- Üst limit: 5000 puan
```

#### 2. Quality Score (Kalite Skoru) - 30%
```
quality_score = (helpful_reactions × 5) + 
                (thanks_reactions × 3) + 
                (verified_places_reviewed × 20)

Detaylar:
- Her "helpful" reaksiyonu: 5 puan
- Her "thanks" reaksiyonu: 3 puan
- Doğrulanmış mekan değerlendirmesi: 20 puan
- Üst limit: 3000 puan
```

#### 3. Engagement Score (Etkileşim Skoru) - 20%
```
engagement_score = (comments_received × 2) + 
                   (followers × 1) + 
                   (active_days × 0.5)

Detaylar:
- Değerlendirmelerine gelen yorumlar: 2 puan
- Takipçi sayısı: 1 puan
- Aktif gün sayısı: 0.5 puan
- Üst limit: 2000 puan
```

#### 4. Contribution Score (Katkı Skoru) - 10%
```
contribution_score = (places_added × 50) + 
                     (menus_added × 20) + 
                     (photos_added × 5) + 
                     (invites_used × 30)

Detaylar:
- Yeni mekan ekleme: 50 puan
- Menü ekleme/güncelleme: 20 puan
- Fotoğraf ekleme: 5 puan
- Davet kodunun kullanılması: 30 puan
- Üst limit: 1000 puan
```

### Dinamik Hesaplama Stratejisi

#### Trigger Bazlı Güncelleme
```sql
-- Değerlendirme eklendiğinde
DELIMITER //
CREATE TRIGGER after_rating_insert
AFTER INSERT ON PlaceRatings
FOR EACH ROW
BEGIN
    UPDATE GourmetProfile gp
    SET 
        total_reviews = total_reviews + 1,
        total_score = calculate_gourmet_score(gp.user_id),
        current_rank_id = (
            SELECT id FROM GourmetRanks 
            WHERE min_score <= calculate_gourmet_score(gp.user_id)
            AND (max_score IS NULL OR max_score >= calculate_gourmet_score(gp.user_id))
            ORDER BY min_score DESC LIMIT 1
        )
    WHERE user_id = NEW.user_id;
END//
DELIMITER ;

-- Stored Function: Skor hesaplama
DELIMITER //
CREATE FUNCTION calculate_gourmet_score(p_user_id BIGINT) 
RETURNS DECIMAL(10,2)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE review_score DECIMAL(10,2) DEFAULT 0;
    DECLARE quality_score DECIMAL(10,2) DEFAULT 0;
    DECLARE engagement_score DECIMAL(10,2) DEFAULT 0;
    DECLARE contribution_score DECIMAL(10,2) DEFAULT 0;
    
    -- Review Score hesaplama
    SELECT 
        LEAST(
            (COUNT(*) * 10) + 
            (SUM(CASE WHEN taste_score IS NOT NULL THEN 1 ELSE 0 END) * 5) +
            (COUNT(DISTINCT pp.id) * 3),
            5000
        ) INTO review_score
    FROM PlaceRatings pr
    LEFT JOIN PlacePhotos pp ON pp.user_id = pr.user_id AND pp.place_id = pr.place_id
    WHERE pr.user_id = p_user_id;
    
    -- Quality Score hesaplama
    SELECT 
        LEAST(
            (SUM(CASE WHEN cr.reaction_type = 'helpful' THEN 5 ELSE 0 END)) +
            (SUM(CASE WHEN cr.reaction_type = 'thanks' THEN 3 ELSE 0 END)) +
            (COUNT(DISTINCT CASE WHEN p.is_verified = TRUE THEN pr.id END) * 20),
            3000
        ) INTO quality_score
    FROM PlaceRatings pr
    LEFT JOIN PlaceComments pc ON pc.rating_id = pr.id
    LEFT JOIN CommentReactions cr ON cr.comment_id = pc.id
    LEFT JOIN Places p ON p.id = pr.place_id
    WHERE pr.user_id = p_user_id;
    
    -- Engagement ve Contribution skorları benzer şekilde hesaplanır...
    
    RETURN (review_score * 0.40) + 
           (quality_score * 0.30) + 
           (engagement_score * 0.20) + 
           (contribution_score * 0.10);
END//
DELIMITER ;
```

#### Batch Processing Alternatifi
Trigger yerine zamanlanmış iş (scheduled job) ile güncellemek:
- Performans avantajı (gerçek zamanlı trigger yükü olmaz)
- Daha esnek skor algoritması güncellemeleri
- Snapshot tablosuna kayıt atmak için uygun
- Her gece 03:00'te çalışan job ile toplu güncelleme

```python
# Pseudocode - Python ile batch processing
def update_gourmet_scores_batch():
    users = get_all_active_users()
    for user in users:
        score = calculate_gourmet_score(user.id)
        rank = get_rank_by_score(score)
        
        update_gourmet_profile(
            user_id=user.id,
            total_score=score,
            current_rank_id=rank.id
        )
        
        create_score_snapshot(
            gourmet_id=user.gourmet_profile_id,
            score=score,
            rank_id=rank.id,
            snapshot_date=today()
        )
```

### Rütbe Avantajları

Her rütbenin özel avantajları JSON formatında saklanır:

```json
{
  "Yeni Keşifçi": {
    "daily_reviews": 5,
    "photo_uploads": 10,
    "invite_codes": 0
  },
  "Meraklı Damak": {
    "daily_reviews": 10,
    "photo_uploads": 20,
    "invite_codes": 1,
    "badge": "bronze"
  },
  "Lezzet Avcısı": {
    "daily_reviews": 15,
    "photo_uploads": 30,
    "invite_codes": 3,
    "badge": "silver",
    "early_access": true
  },
  "Gastronomi Tutkunu": {
    "daily_reviews": 25,
    "photo_uploads": 50,
    "invite_codes": 5,
    "badge": "gold",
    "early_access": true,
    "priority_support": true
  },
  "Gurme Uzman": {
    "daily_reviews": 50,
    "photo_uploads": 100,
    "invite_codes": 10,
    "badge": "platinum",
    "early_access": true,
    "priority_support": true,
    "verified_reviewer": true
  },
  "Master Gurme": {
    "daily_reviews": "unlimited",
    "photo_uploads": "unlimited",
    "invite_codes": 20,
    "badge": "diamond",
    "early_access": true,
    "priority_support": true,
    "verified_reviewer": true,
    "editorial_access": true
  }
}
```

---

## Rating/Comment Tablo Yapısı Analizi

Bu bölümde, değerlendirme (rating) ve yorum (comment) verilerini tek tabloda mı yoksa ayrı tablolarda mı tutmanın daha uygun olacağı analiz edilmektedir.

### Seçenek 1: Tek Tablo (PlaceReviews)

```sql
CREATE TABLE PlaceReviews (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    place_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    taste_score DECIMAL(2,1) NULL,
    service_score DECIMAL(2,1) NULL,
    ambiance_score DECIMAL(2,1) NULL,
    price_score DECIMAL(2,1) NULL,
    comment_text TEXT NULL,
    visit_date DATE NULL,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    
    UNIQUE KEY uk_user_place (user_id, place_id)
);
```

#### Avantajlar ✅
1. **Basitlik**: Tek tablo, daha az JOIN, daha basit sorgular
2. **Performans**: Değerlendirme + yorum birlikte getirilirken daha hızlı
3. **Atomiklik**: Rating ve comment her zaman tutarlı (birlikte oluşturulur/güncellenir)
4. **Daha Az Karmaşıklık**: Foreign key ilişkisi yok, referential integrity otomatik
5. **Disk Kullanımı**: İndeks ve FK overhead'i daha az

#### Dezavantajlar ❌
1. **NULL Değerler**: Yorum olmayan değerlendirmelerde comment_text NULL olur (disk israfı)
2. **Esneklik**: Yorumsuz değerlendirme veya değerlendirmesiz yorum senaryosu zor
3. **Ölçeklenebilirlik**: Yorumlar çok uzunsa, büyük TEXT alanları performansı etkileyebilir
4. **Moderasyon**: Yorumları ayrı modere etmek daha zor (is_comment_hidden gibi alanlar gerekir)
5. **İş Mantığı**: Rating ve comment farklı iş kurallarına sahipse yönetimi zorlaşır

### Seçenek 2: Ayrı Tablolar (PlaceRatings + PlaceComments)

```sql
CREATE TABLE PlaceRatings (
    id BIGINT PRIMARY KEY,
    place_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    rating DECIMAL(2,1) NOT NULL,
    -- diğer alanlar...
    UNIQUE KEY uk_user_place (user_id, place_id)
);

CREATE TABLE PlaceComments (
    id BIGINT PRIMARY KEY,
    rating_id BIGINT NOT NULL UNIQUE,
    comment_text TEXT NOT NULL,
    -- diğer alanlar...
    FOREIGN KEY (rating_id) REFERENCES PlaceRatings(id)
);
```

#### Avantajlar ✅
1. **Esneklik**: Rating ve comment bağımsız yönetilebilir
2. **Normalizasyon**: NULL değer problemi yok, daha temiz veri modeli
3. **Moderasyon**: Yorumları bağımsız modere edebilme
4. **Performans (Okuma)**: Rating sorguları daha hafif (TEXT alanı yok)
5. **Ölçeklenebilirlik**: Yorumları ayrı cache'leyebilme, farklı indeksleme stratejileri
6. **Güvenlik**: Yorumları ayrı yetkilendirme/validasyon
7. **Analitik**: Rating ve comment metriklerini ayrı analiz edebilme

#### Dezavantajlar ❌
1. **Karmaşıklık**: İki tablo, daha fazla JOIN gerekli
2. **Performans (Yazma)**: İki tabloya yazma, transaction yönetimi
3. **Tutarlılık Riski**: Rating varken comment silinebilir/yoksa referential integrity kuralları gerekir
4. **Daha Fazla Kod**: İki entity, iki repository, daha fazla maintanence

---

### Öneri ve Karar 🎯

**Seçilen Yaklaşım: Ayrı Tablolar (PlaceRatings + PlaceComments)**

#### Karar Gerekçeleri:

1. **İş Gereksinimlerine Uygunluk**
   - Kullanıcılar yorum yazmadan da değerlendirme yapabilmeli (hızlı rating)
   - Yorumlar moderasyona tabi olmalı (spam, küfür, vb.)
   - Rating'ler anında yayınlanırken yorumlar beklemede olabilmeli

2. **Ölçeklenebilirlik**
   - Sistem büyüdükçe yorumlar büyük veri haline gelecek
   - Rating sorguları (mekan listesi, ortalama hesaplama) çok sık yapılacak
   - TEXT alanlarını ayrı tutmak performans avantajı sağlayacak

3. **Gelecek Özellikleri**
   - Yorum güncelleme geçmişi (comment edit history)
   - Yorum tepkileri (reactions)
   - Yorum raporlama sistemi
   - Bu özellikler ayrı tablo ile daha kolay implement edilir

4. **Veri Modeli Temizliği**
   - %30-40 oranında yorumsuz değerlendirme bekleniyor
   - NULL değerler yerine optional ilişki daha temiz
   - Her entity'nin kendi sorumluluğu olmalı (Single Responsibility)

#### İmplementasyon Detayları:

```sql
-- 1-1 ilişki ama optional (comment olmayabilir)
-- rating_id UNIQUE constraint ile garanti edilir
-- ON DELETE CASCADE ile rating silindiğinde comment da silinir

-- Rating sorgusu (hafif, hızlı)
SELECT p.name, AVG(pr.rating) as avg_rating
FROM Places p
LEFT JOIN PlaceRatings pr ON pr.place_id = p.id
GROUP BY p.id;

-- Rating + Comment sorgusu (gerektiğinde)
SELECT pr.*, pc.comment_text, pc.is_hidden
FROM PlaceRatings pr
LEFT JOIN PlaceComments pc ON pc.rating_id = pr.id
WHERE pr.place_id = ?
ORDER BY pr.created_at DESC;

-- Sadece yorumlu değerlendirmeler
SELECT pr.*, pc.comment_text
FROM PlaceRatings pr
INNER JOIN PlaceComments pc ON pc.rating_id = pr.id
WHERE pr.place_id = ?;
```

### Alternatif Senaryolar

#### Senaryo A: Hızlı Rating (Yorum Yok)
```
1. Kullanıcı mekanı görür, sadece yıldız verir
2. PlaceRatings'e INSERT
3. PlaceComments'e hiç dokunulmaz
4. Performans maksimum, tek transaction
```

#### Senaryo B: Detaylı Review (Rating + Comment)
```
1. Kullanıcı form doldurur (rating + yorum)
2. Transaction başla
3. PlaceRatings'e INSERT (id döner)
4. PlaceComments'e INSERT (rating_id ile)
5. Transaction commit
6. Yorum moderasyona gider (is_hidden = true)
```

#### Senaryo C: Mevcut Rating'e Yorum Ekleme
```
1. Kullanıcı önce rating vermiş, sonra yorum eklemek istiyor
2. rating_id biliniyor
3. PlaceComments'e INSERT (rating_id ile)
4. PlaceRatings.updated_at güncellenir (trigger veya application layer)
```

---

## Özet ve Sonuç

Bu dokümanda, Lezzet Atlası uygulaması için kapsamlı bir veritabanı tasarımı sunulmuştur:

### Temel Bileşenler
- **14 Ana Tablo**: Users, GourmetProfile, InviteCodes, Places, PlacePhotos, PlaceMenus, MenuItems, PriceHistory, PlaceRatings, PlaceComments, CommentReactions, GourmetRanks, GourmetScoreSnapshots, PlaceRatingSummary

- **İlişkiler**: 1-1, 1-N ve N-N ilişkiler ile normalize edilmiş şema

- **İndeksleme Stratejisi**: Primary key, foreign key, unique, fulltext ve composite indeksler

- **Gurme Rütbe Sistemi**: 4 bileşenli (review, quality, engagement, contribution) dinamik skor hesaplama

- **Rating/Comment Yaklaşımı**: Ayrı tablolar (esneklik, ölçeklenebilirlik, moderasyon için optimal)

### Teknik Özellikler
- MySQL/MariaDB uyumlu
- Referential integrity (FK constraints)
- Soft delete yerine is_active/is_hidden pattern
- Denormalization (PlaceRatingSummary) ile performans optimizasyonu
- Trigger ve stored function desteği
- Partitioning hazır (PriceHistory için)

### Gelecek Geliştirmeler
- Elasticsearch entegrasyonu (arama için)
- Redis cache layer (rating summary için)
- Time-series database (price history için)
- Sharding stratejisi (horizontal scaling için)
- Read replica setup (okuma yükü için)

---

**Versiyon**: 1.0  
**Son Güncelleme**: 2026-01-05  
**Hazırlayan**: Lezzet Atlası Geliştirme Ekibi
