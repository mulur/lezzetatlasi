# Lezzet Atlası - Tasarım Özeti

Bu doküman, veritabanı tasarımının hızlı referansı için oluşturulmuştur.

## 🎯 Hızlı Referans

### Tablo Kategorileri

```
┌─────────────────────────────────────────────────────┐
│  USERS & AUTHENTICATION (2 tablo)                   │
├─────────────────────────────────────────────────────┤
│  • Users                  - Kullanıcı bilgileri     │
│  • InviteCodes           - Davet kodu sistemi       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  GOURMET SYSTEM (3 tablo)                           │
├─────────────────────────────────────────────────────┤
│  • GourmetProfile        - Gurme profilleri         │
│  • GourmetRanks          - Rütbe tanımları          │
│  • GourmetScoreSnapshots - Skor geçmişi             │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  PLACES & LOCATIONS (5 tablo)                       │
├─────────────────────────────────────────────────────┤
│  • Places                - Mekan bilgileri          │
│  • PlacePhotos           - Mekan fotoğrafları       │
│  • PlaceMenus            - Menü kategorileri        │
│  • MenuItems             - Menü öğeleri             │
│  • PriceHistory          - Fiyat geçmişi            │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  REVIEWS & INTERACTIONS (3 tablo)                   │
├─────────────────────────────────────────────────────┤
│  • PlaceRatings          - Değerlendirmeler         │
│  • PlaceComments         - Yorumlar                 │
│  • CommentReactions      - Yorum tepkileri          │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  AGGREGATION (1 tablo)                              │
├─────────────────────────────────────────────────────┤
│  • PlaceRatingSummary    - Değerlendirme özeti     │
└─────────────────────────────────────────────────────┘
```

## 📊 Veri Akışları

### 1. Kullanıcı Kayıt Akışı
```
User enters invite code
    ↓
InviteCodes validation
    ↓
Users record created
    ↓
GourmetProfile auto-created (trigger)
    ↓
Initial rank: "Yeni Keşifçi"
```

### 2. Mekan Ekleme Akışı
```
User creates Place
    ↓
Places record (with created_by)
    ↓
User can add:
    • PlacePhotos (multiple)
    • PlaceMenus → MenuItems
    • Initial PriceHistory
```

### 3. Değerlendirme Akışı
```
User submits rating
    ↓
PlaceRatings created (UNIQUE per user+place)
    ↓
Triggers fire:
    • GourmetProfile.total_reviews++
    • PlaceRatingSummary updated
    • Places.avg_rating updated
    ↓
Optional: PlaceComments added (1:1 with rating)
    ↓
Other users: CommentReactions
```

### 4. Gurme Skor Güncelleme Akışı
```
User activity (rating, comment, photo, etc.)
    ↓
Score calculation triggered
    ↓
    ├─ Review Score (40%)
    ├─ Quality Score (30%)
    ├─ Engagement Score (20%)
    └─ Contribution Score (10%)
    ↓
GourmetProfile.total_score updated
    ↓
Rank check (min_score <= score < max_score)
    ↓
GourmetProfile.current_rank_id updated
    ↓
Optional: GourmetScoreSnapshot created (daily job)
```

## 🔑 Anahtar İlişkiler

### One-to-One (1:1)
```
Users ←→ GourmetProfile
    ↳ Her kullanıcının bir profili

PlaceRatings ←→ PlaceComments
    ↳ Her değerlendirmenin opsiyonel bir yorumu

Places ←→ PlaceRatingSummary
    ↳ Her mekanın bir özet istatistiği
```

### One-to-Many (1:N)
```
Users → Places
    ↳ Kullanıcı birden fazla mekan ekleyebilir

Places → PlacePhotos
    ↳ Mekan birden fazla fotoğrafa sahip

Places → PlaceRatings
    ↳ Mekan birden fazla değerlendirme alır

PlaceMenus → MenuItems
    ↳ Menü birden fazla öğe içerir

MenuItems → PriceHistory
    ↳ Öğenin fiyat geçmişi takip edilir

PlaceComments → CommentReactions
    ↳ Yorum birden fazla tepki alır

GourmetProfile → GourmetScoreSnapshots
    ↳ Profilin skor geçmişi
```

### Many-to-One (N:1)
```
GourmetProfile → GourmetRanks
    ↳ Birden fazla profil aynı rütbede
```

## 💡 Önemli Tasarım Kararları

### ✅ Ayrı Rating/Comment Tabloları

**Seçim:** PlaceRatings ve PlaceComments ayrı

**Neden:**
- Yorumsuz hızlı rating (%30-40 yorumsuz bekleniyor)
- Bağımsız moderasyon (yorumlar onay bekleyebilir)
- Performance (rating sorguları daha hafif)
- Ölçeklenebilirlik (TEXT alanlar ayrı)

### ✅ Denormalizasyon

**Neredeyse:**
- `Places.avg_rating`, `Places.total_ratings`
- `PlaceRatingSummary` (tüm istatistikler)
- `GourmetProfile.total_reviews`, `total_score`

**Neden:**
- Sık sorgulanan veriler
- JOIN maliyetini azaltmak
- Read-heavy workload için optimize

### ✅ Trigger vs Batch Processing

**Trigger Kullanımı:**
- PlaceRatingSummary güncellemeleri
- GourmetProfile.total_reviews

**Batch Processing (öneri):**
- Gurme skor hesaplama (günlük 03:00)
- GourmetScoreSnapshots oluşturma

**Neden:**
- Trigger = gerçek zamanlı ama overhead
- Batch = esnek, performanslı, snapshot için uygun

## 🔒 Veri Bütünlüğü

### Unique Constraints
```sql
Users.email                           -- Tek e-posta
Users.username                        -- Tek kullanıcı adı
GourmetProfile.user_id                -- Tek profil
InviteCodes.code                      -- Benzersiz kod
Places.slug                           -- URL friendly ID
(user_id, place_id) in PlaceRatings  -- Tek değerlendirme
rating_id in PlaceComments            -- Tek yorum
```

### Check Constraints
```sql
PlaceRatings.rating         BETWEEN 1.0 AND 5.0
PlaceRatings.taste_score    BETWEEN 1.0 AND 5.0 (nullable)
PlaceRatings.service_score  BETWEEN 1.0 AND 5.0 (nullable)
PlaceRatings.ambiance_score BETWEEN 1.0 AND 5.0 (nullable)
PlaceRatings.price_score    BETWEEN 1.0 AND 5.0 (nullable)
```

### Cascade Behaviors
```
DELETE User
    ├─ CASCADE → GourmetProfile
    ├─ CASCADE → InviteCodes (created)
    ├─ RESTRICT → Places (must reassign)
    ├─ RESTRICT → PlacePhotos (must reassign)
    ├─ CASCADE → PlaceRatings
    └─ CASCADE → PlaceComments

DELETE Place
    ├─ CASCADE → PlacePhotos
    ├─ CASCADE → PlaceMenus → MenuItems → PriceHistory
    ├─ CASCADE → PlaceRatings → PlaceComments → CommentReactions
    └─ CASCADE → PlaceRatingSummary

DELETE PlaceRating
    └─ CASCADE → PlaceComments → CommentReactions
```

## 📈 Performans İpuçları

### İndeksleme Stratejisi
```sql
-- Primary lookups
Users(email), Users(username), Places(slug)

-- Foreign key indeksler (otomatik)
Tüm FK sütunları otomatik indekslenir

-- Sıralama ve filtreleme
Places(city, category, avg_rating DESC)
GourmetProfile(total_score DESC)
PlaceRatings(place_id, created_at DESC)

-- Fulltext search
Places(name, description)
MenuItems(name, description)
PlaceComments(comment_text)

-- Composite indeksler
Places(is_active, is_verified)
PlaceComments(place_id, is_hidden, created_at DESC)
```

### Sorgu Örnekleri

**En popüler mekanlar:**
```sql
SELECT * FROM v_places_detailed
WHERE city = 'İstanbul' 
  AND category = 'restaurant'
ORDER BY avg_rating DESC, total_ratings DESC
LIMIT 20;
```

**Gurme liderlik tablosu:**
```sql
SELECT * FROM v_gourmet_leaderboard
LIMIT 100;
```

**Kullanıcının değerlendirmeleri:**
```sql
SELECT pr.*, p.name, p.city, pc.comment_text
FROM PlaceRatings pr
JOIN Places p ON p.id = pr.place_id
LEFT JOIN PlaceComments pc ON pc.rating_id = pr.id
WHERE pr.user_id = ?
ORDER BY pr.created_at DESC;
```

**Mekan detayları (yorumlarla):**
```sql
SELECT pr.rating, u.username, gp.current_rank_id, 
       pc.comment_text, pc.created_at
FROM PlaceRatings pr
JOIN Users u ON u.id = pr.user_id
JOIN GourmetProfile gp ON gp.user_id = u.id
LEFT JOIN PlaceComments pc ON pc.rating_id = pr.id
WHERE pr.place_id = ?
  AND (pc.is_hidden = FALSE OR pc.is_hidden IS NULL)
ORDER BY pr.created_at DESC
LIMIT 20;
```

## 🎨 Gurme Rütbeleri

| Rütbe | Skor Aralığı | Renk | İkon | Özellikler |
|-------|--------------|------|------|------------|
| 🧭 Yeni Keşifçi | 0 - 100 | #95A5A6 | compass | 5 review/gün, 10 fotoğraf |
| 🍴 Meraklı Damak | 100 - 300 | #3498DB | utensils | 10 review/gün, 20 fotoğraf, 1 davet |
| 🔍 Lezzet Avcısı | 300 - 600 | #9B59B6 | search | 15 review/gün, 30 fotoğraf, 3 davet, erken erişim |
| ❤️ Gastronomi Tutkunu | 600 - 1000 | #E67E22 | heart | 25 review/gün, 50 fotoğraf, 5 davet, öncelikli destek |
| ⭐ Gurme Uzman | 1000 - 2000 | #E74C3C | star | 50 review/gün, 100 fotoğraf, 10 davet, doğrulanmış |
| 👑 Master Gurme | 2000+ | #F39C12 | crown | Sınırsız, 20 davet, editör erişimi |

## 📝 SQL Snippet'ler

### Yeni kullanıcı oluşturma
```sql
START TRANSACTION;

INSERT INTO Users (email, username, password_hash, email_verified)
VALUES ('user@example.com', 'username', 'hash...', TRUE);

SET @user_id = LAST_INSERT_ID();

INSERT INTO GourmetProfile (user_id, current_rank_id)
VALUES (@user_id, 1); -- Yeni Keşifçi

COMMIT;
```

### Değerlendirme ekleme
```sql
START TRANSACTION;

-- Rating ekle
INSERT INTO PlaceRatings (place_id, user_id, rating, taste_score, service_score)
VALUES (123, @user_id, 4.5, 5.0, 4.0);

SET @rating_id = LAST_INSERT_ID();

-- Yorum ekle (opsiyonel)
INSERT INTO PlaceComments (place_id, user_id, rating_id, comment_text)
VALUES (123, @user_id, @rating_id, 'Harika bir deneyimdi!');

COMMIT;

-- Trigger otomatik olarak:
-- - GourmetProfile.total_reviews++
-- - PlaceRatingSummary güncellenecek
-- - Places.avg_rating güncellenecek
```

### Fiyat güncelleme (geçmiş tutma)
```sql
UPDATE MenuItems
SET price = 150.00, currency = 'TRY'
WHERE id = 456;

-- Trigger otomatik olarak PriceHistory'ye kaydedecek
```

## 🚀 Deployment Checklist

- [ ] MySQL 5.7+ veya MariaDB 10.2+ kurulu
- [ ] UTF-8 (utf8mb4) karakter seti aktif
- [ ] JSON sütun desteği var
- [ ] schema.sql çalıştırıldı
- [ ] GourmetRanks tablosu dolu (6 rütbe)
- [ ] Trigger'lar aktif
- [ ] View'lar oluşturuldu
- [ ] İndeksler optimize edildi
- [ ] Backup stratejisi hazır

---

**Not:** Bu doküman hızlı referans içindir. Detaylı bilgi için `database-design.md` dosyasına bakın.
