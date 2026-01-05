# API Endpoint Özeti ve CRUD Dağılımı

## Toplam Endpoint Sayısı: 31

### Kategori Bazlı Dağılım

| Kategori | Endpoint Sayısı | Açıklama |
|----------|----------------|----------|
| Authentication | 5 | Kimlik doğrulama ve kullanıcı kaydı |
| User Management | 4 | Kullanıcı profil yönetimi |
| Restaurant CRUD | 5 | Restoran yönetimi |
| Reviews | 6 | Değerlendirme ve yorum sistemi |
| Photos | 4 | Fotoğraf yönetimi |
| Search | 2 | Arama ve keşfet |
| Admin | 5 | Admin yönetim işlemleri |

### HTTP Method Dağılımı

| Method | Sayı | Oran |
|--------|------|------|
| GET | 12 | 38.7% |
| POST | 12 | 38.7% |
| PATCH | 5 | 16.1% |
| DELETE | 4 | 12.9% |

## CRUD İşlem Dağılımı

### Restaurant (Restoran)
- **Create**: POST /restaurants (Admin only)
- **Read**: 
  - GET /restaurants (Liste, filtreleme)
  - GET /restaurants/{restaurantId} (Detay)
  - GET /restaurants/nearby (Konum bazlı)
- **Update**: PATCH /restaurants/{restaurantId} (Admin only)
- **Delete**: DELETE /restaurants/{restaurantId} (Admin only, soft delete)

### User (Kullanıcı)
- **Create**: 
  - POST /auth/register (Normal kullanıcı)
  - POST /auth/register/gourmet (Gurme kullanıcı)
- **Read**: 
  - GET /users/me (Kendi profili)
  - GET /users/{userId} (Genel profil)
- **Update**: PATCH /users/me (Kendi profili)
- **Delete**: DELETE /users/me (Kendi hesabı)

### Review (Değerlendirme)
- **Create**: 
  - POST /restaurants/{restaurantId}/reviews (Basit yorum)
  - POST /restaurants/{restaurantId}/reviews/gourmet (Gurme değerlendirmesi)
- **Read**: GET /restaurants/{restaurantId}/reviews (Liste)
- **Update**: PATCH /reviews/{reviewId} (Kendi yorumu)
- **Delete**: DELETE /reviews/{reviewId} (Kendi yorumu veya Admin)

### Photo (Fotoğraf)
- **Create**: 
  - POST /photos/upload-url (Upload URL alma)
  - POST /photos/{photoId}/confirm (Yükleme onayı)
- **Read**: GET /restaurants/{restaurantId}/photos (Liste)
- **Update**: N/A (Desteklenmez, silip yeniden yükleme gerekir)
- **Delete**: DELETE /photos/{photoId} (Kendi fotoğrafı veya Admin)

## Özel Özellikler

### 1. İki Seviyeli Değerlendirme Sistemi

#### Basit Değerlendirme (User)
```
POST /restaurants/{restaurantId}/reviews
- Tek rating (1-5)
- Basit yorum metni
- Ziyaret tarihi
- Tavsiye durumu
```

#### Gurme Değerlendirmesi (Gourmet)
```
POST /restaurants/{restaurantId}/reviews/gourmet
- Çoklu rating kategorileri (food, presentation, service, ambiance, value)
- Detaylı inceleme bölümleri
- Öneriler ve iyileştirme notları
- Verified Gourmet badge
```

### 2. Pre-signed URL Fotoğraf Yükleme Akışı

```
1. POST /photos/upload-url
   ↓ (upload URL + photoId döner)
2. PUT {uploadUrl} (direkt S3'e yükleme)
   ↓
3. POST /photos/{photoId}/confirm
   ↓ (thumbnail oluşturma, CDN dağıtımı)
4. Fotoğraf hazır
```

**Avantajları:**
- Backend yükü azalır (dosya transferi S3'e direkt)
- Daha hızlı yükleme
- Ölçeklenebilir
- Güvenli (geçici URL, 5 dakika geçerli)

### 3. Gurme Kod Sistemi

```
Admin: POST /admin/gourmet-codes
  ↓ (Kodlar oluşturulur: GURME2026ABC, GURME2026DEF...)
  
User: POST /auth/register/gourmet
  + gourmetCode: "GURME2026ABC"
  ↓ (Kod validasyonu: geçerli mi? kullanılmış mı? süresi dolmuş mu?)
  
Başarılı: Gourmet rolü ile kullanıcı oluşur
```

### 4. Pagination, Sorting, Filtering

**Cursor-based Pagination (Önerilen):**
```
GET /restaurants?cursor={base64_encoded}&limit=20

Avantajları:
- Consistent results (yeni eklenen/silinen kayıtlar sonucu etkilemez)
- Daha performanslı (özellikle büyük dataset'lerde)
```

**Offset-based Pagination (Alternatif):**
```
GET /restaurants?page=1&limit=20

Avantajları:
- Basit implementasyon
- Sayfa numarası ile doğrudan erişim
```

**Sorting:**
```
GET /restaurants?sort=rating&order=desc
GET /restaurants?sort=-rating (kısa syntax)
```

**Filtering:**
```
GET /restaurants?city=Istanbul&cuisine=Turkish&minRating=4.0
GET /restaurants?rating[gte]=4.0&rating[lte]=5.0 (operatör bazlı)
```

### 5. Rate Limiting Stratejisi

| Rol | Global (req/hour) | Review (req/hour) | Photo (req/hour) | Upload (per/day) |
|-----|-------------------|-------------------|------------------|------------------|
| Guest | 100 | - | - | - |
| User | 1,000 | 10 | 20 | 50 |
| Gourmet | 2,000 | 20 | 50 | 100 |
| Admin | 10,000 | Unlimited | Unlimited | Unlimited |

**Endpoint Bazlı Özel Limitler:**
- `POST /auth/login`: 5 başarısız deneme/15 dakika (IP bazlı)
- `POST /auth/register`: 3 kayıt/saat (IP bazlı)

## Rol Bazlı Endpoint Erişimi

### Guest (Kimlik Doğrulaması Yok)
✅ **İzin Verilen (11 endpoint):**
- Tüm GET endpoint'leri (okuma)
- Kayıt ve giriş endpoint'leri

❌ **İzin Verilmeyen:**
- Tüm POST/PATCH/DELETE işlemleri (okuma hariç)

### User (Kayıtlı Kullanıcı)
✅ **Guest + Ek İzinler:**
- Basit yorum yapma
- Fotoğraf yükleme
- Kendi içeriğini düzenleme/silme
- Yorumları yararlı bulma

❌ **İzin Verilmeyen:**
- Gurme değerlendirmesi yapamaz
- Restoran ekleyemez/düzenleyemez
- Admin işlemleri yapamaz

### Gourmet (Gurme Kullanıcı)
✅ **User + Ek İzinler:**
- Detaylı gurme değerlendirmesi
- Çoklu rating kategorileri
- Verified badge ile gösterim
- Daha fazla rate limit

❌ **İzin Verilmeyen:**
- Restoran ekleyemez/düzenleyemez
- Admin işlemleri yapamaz

### Admin (Sistem Yöneticisi)
✅ **Tüm İzinler:**
- Restoran CRUD
- Kullanıcı yönetimi
- İçerik moderasyonu
- Gurme kodu oluşturma
- Sistem istatistikleri
- Tüm içerikleri düzenleme/silme

## Güvenlik Katmanları

### 1. Authentication Layer
```
JWT Token → Token Validation → User Identity
```

### 2. Authorization Layer
```
User Role → Permission Check → Resource Access
```

### 3. Resource Ownership Check
```
User ID → Resource Owner → Allow/Deny
```

### 4. Rate Limiting Layer
```
Request Count → Role Limits → Allow/Throttle/Block
```

### 5. Input Validation Layer
```
Request Data → Schema Validation → Sanitization
```

## Hata Yönetimi

### HTTP Status Codes
- **2xx Success**: 200, 201, 204
- **4xx Client Error**: 400, 401, 403, 404, 409, 422, 429
- **5xx Server Error**: 500, 503

### Standardize Hata Formatı
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Kullanıcı dostu mesaj",
    "details": "Teknik detay",
    "field": "hatanın olduğu alan (validasyon için)",
    "timestamp": "2026-01-05T17:39:58Z",
    "requestId": "req_abc123"
  }
}
```

### Yaygın Hata Kodları
- `INVALID_CREDENTIALS`: Geçersiz email/şifre
- `TOKEN_EXPIRED`: Token süresi doldu
- `INSUFFICIENT_PERMISSIONS`: Yetki yetersiz
- `RESOURCE_NOT_FOUND`: Kaynak bulunamadı
- `DUPLICATE_REVIEW`: Aynı restoran için zaten yorum var
- `INVALID_GOURMET_CODE`: Geçersiz gurme kodu
- `RATE_LIMIT_EXCEEDED`: İstek limiti aşıldı

## Puan Hesaplama Algoritması

### Overall Rating
```
Overall Rating = (User Average * 0.4) + (Gourmet Average * 0.6)

Gourmet yorumlarına daha fazla ağırlık verilir (%60)
```

### Weighted Rating (Bayesian Average)
```
Weighted = (C * m + R * v) / (C + v)

C = Minimum review threshold (örn: 10)
m = Genel ortalama (tüm restoranlar)
R = Restoranın kendi ortalaması
v = Review sayısı

Yeni restoranlar için daha adil sıralama sağlar
```

## Performans Optimizasyonları

### 1. Pagination
- Cursor-based pagination (consistent results)
- Limit max 100 sonuç

### 2. Caching
- Restaurant list → 5 dakika cache
- Restaurant detail → 1 dakika cache
- Reviews → 30 saniye cache
- User profile → 5 dakika cache

### 3. Database Indexing
```sql
-- Gerekli indexler
CREATE INDEX idx_restaurants_city ON restaurants(city);
CREATE INDEX idx_restaurants_rating ON restaurants(rating);
CREATE INDEX idx_reviews_restaurant_id ON reviews(restaurant_id);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);
CREATE INDEX idx_photos_restaurant_id ON photos(restaurant_id);
```

### 4. CDN Usage
- Fotoğraflar CDN üzerinden servis edilir
- Thumbnail'ler otomatik oluşturulur
- Lazy loading

## Monitoring ve Analytics

### Metrics to Track
- API response time (p50, p95, p99)
- Error rate by endpoint
- Rate limit hits
- Review count (user vs gourmet)
- Photo upload success rate
- Most searched terms
- Popular restaurants
- User retention

### Alerts
- Error rate > 1%
- Response time > 1000ms
- Rate limit hits > 10% of requests
- Failed authentication > 5 attempts/min
- S3 upload failures

## Versioning Strategy

**URL Path Versioning:**
```
/v1/restaurants
/v2/restaurants
```

**Header Versioning (Alternative):**
```
Accept: application/vnd.lezzetatlasi.v1+json
```

**Deprecation Policy:**
- Yeni major version → Breaking changes için
- Old version → Minimum 6 ay support
- Deprecation warning → 3 ay önce
- Documentation → Deprecated endpoints işaretlenir

## Özet İstatistikler

- ✅ **31 endpoint** (tam CRUD coverage)
- ✅ **4 rol** (Guest, User, Gourmet, Admin)
- ✅ **2 seviyeli değerlendirme** (basit + gurme)
- ✅ **Pre-signed URL** sistemi (güvenli fotoğraf yükleme)
- ✅ **Gurme kod** sistemi (özel kayıt)
- ✅ **Pagination/Sorting/Filtering** (esnek sorgulama)
- ✅ **Rate limiting** (rol bazlı)
- ✅ **Security best practices** (JWT, HTTPS, validasyon)
- ✅ **OpenAPI spec** (Swagger UI ile test edilebilir)

Tüm dokümantasyon Türkçe olarak hazırlanmıştır ve production-ready bir API tasarımını temsil etmektedir.
