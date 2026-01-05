# Lezzetatlası Yetkilendirme Matrisi

## Roller ve İzinler

### Rol Tanımları

#### 1. Guest (Misafir Kullanıcı)
- Kimlik doğrulaması yapılmamış kullanıcı
- Sadece genel içerikleri görüntüleyebilir
- İşlem yapamaz (yorum, puan, fotoğraf yükleyemez)

**Yetenekler:**
- Restoranları görüntüleme ve arama
- Yorumları okuma
- Fotoğrafları görüntüleme
- Kullanıcı profillerini görüntüleme (genel bilgiler)

#### 2. User (Kayıtlı Kullanıcı)
- Email ile kayıt olmuş standart kullanıcı
- Temel değerlendirme yapabilir
- Fotoğraf yükleyebilir

**Yetenekler:**
- Guest yeteneklerinin tümü
- Basit yorum ve puan verme (tek bir rating değeri)
- Fotoğraf yükleme
- Yorumları yararlı bulma
- Kendi profilini düzenleme
- Kendi yorumlarını/fotoğraflarını düzenleme/silme

**Kısıtlamalar:**
- Detaylı gurme değerlendirmesi yapamaz
- Restoran ekleyemez/düzenleyemez

#### 3. Gourmet (Gurme Kullanıcı)
- Özel gurme kodu ile kayıt olmuş uzman kullanıcı
- Profesyonel şef, gastronomi uzmanı veya sertifikalı gurme
- Detaylı ve çok boyutlu değerlendirme yapabilir

**Yetenekler:**
- User yeteneklerinin tümü
- Detaylı gurme değerlendirmesi (food, presentation, service, ambiance, value ayrı ayrı puanlanır)
- Uzun format değerlendirme yazısı
- Öneri ve iyileştirme önerileri
- "Verified Gourmet" badge'i ile gösterim
- Yorumlar daha yüksek görünürlüğe sahip

**Kısıtlamalar:**
- Restoran ekleyemez/düzenleyemez (Admin hakkı yok)

#### 4. Admin (Sistem Yöneticisi)
- Tam sistem erişimine sahip
- Tüm içerikleri yönetebilir
- Kullanıcı ve sistem yönetimi

**Yetenekler:**
- Tüm roller için tüm yetenekler
- Restoran CRUD işlemleri
- Kullanıcı yönetimi (rol değiştirme, askıya alma)
- İçerik moderasyonu
- Gurme kodu oluşturma
- Sistem istatistiklerini görüntüleme
- Audit log erişimi

## Detaylı Yetkilendirme Matrisi

### Kimlik Doğrulama ve Hesap Yönetimi

| İşlem | Endpoint | Guest | User | Gourmet | Admin | Notlar |
|-------|----------|-------|------|---------|-------|--------|
| Normal Kayıt | POST /auth/register | ✅ | ✅ | ✅ | ✅ | Herkes kayıt olabilir |
| Gurme Kayıt | POST /auth/register/gourmet | ✅ | ✅ | ✅ | ✅ | Geçerli kod gerekli |
| Giriş | POST /auth/login | ✅ | ✅ | ✅ | ✅ | - |
| Token Yenileme | POST /auth/refresh | ✅ | ✅ | ✅ | ✅ | Geçerli refresh token gerekli |
| Çıkış | POST /auth/logout | ❌ | ✅ | ✅ | ✅ | Token gerekli |
| Email Doğrulama | POST /auth/verify-email | ✅ | ✅ | ✅ | ✅ | - |
| Şifre Sıfırlama İsteği | POST /auth/forgot-password | ✅ | ✅ | ✅ | ✅ | - |
| Şifre Sıfırlama | POST /auth/reset-password | ✅ | ✅ | ✅ | ✅ | Reset token gerekli |

### Kullanıcı Profili

| İşlem | Endpoint | Guest | User | Gourmet | Admin | Notlar |
|-------|----------|-------|------|---------|-------|--------|
| Kendi Profilini Görüntüleme | GET /users/me | ❌ | ✅ | ✅ | ✅ | Tam detay |
| Kendi Profilini Güncelleme | PATCH /users/me | ❌ | ✅ | ✅ | ✅ | Kendi bilgileri |
| Kendi Hesabını Silme | DELETE /users/me | ❌ | ✅ | ✅ | ✅ | Şifre doğrulama gerekli |
| Başka Kullanıcı Profilini Görüntüleme | GET /users/{userId} | ✅ | ✅ | ✅ | ✅ | Genel bilgiler |
| Profil Fotoğrafı Yükleme | POST /users/me/photo | ❌ | ✅ | ✅ | ✅ | Pre-signed URL ile |

### Restoran Yönetimi

| İşlem | Endpoint | Guest | User | Gourmet | Admin | Notlar |
|-------|----------|-------|------|---------|-------|--------|
| Restoran Listesi | GET /restaurants | ✅ | ✅ | ✅ | ✅ | Herkese açık |
| Restoran Detayı | GET /restaurants/{restaurantId} | ✅ | ✅ | ✅ | ✅ | Herkese açık |
| Restoran Arama | GET /restaurants?search=... | ✅ | ✅ | ✅ | ✅ | - |
| Yakındaki Restoranlar | GET /restaurants/nearby | ✅ | ✅ | ✅ | ✅ | - |
| Restoran Oluşturma | POST /restaurants | ❌ | ❌ | ❌ | ✅ | Admin only |
| Restoran Güncelleme | PATCH /restaurants/{restaurantId} | ❌ | ❌ | ❌ | ✅ | Admin only |
| Restoran Silme | DELETE /restaurants/{restaurantId} | ❌ | ❌ | ❌ | ✅ | Soft delete |

### Değerlendirme ve Yorum

| İşlem | Endpoint | Guest | User | Gourmet | Admin | Notlar |
|-------|----------|-------|------|---------|-------|--------|
| Yorum Listesi | GET /restaurants/{restaurantId}/reviews | ✅ | ✅ | ✅ | ✅ | Herkese açık |
| Yorum Detayı | GET /reviews/{reviewId} | ✅ | ✅ | ✅ | ✅ | Herkese açık |
| Basit Yorum Ekleme | POST /restaurants/{restaurantId}/reviews | ❌ | ✅ | ✅ | ✅ | Tek rating |
| Gurme Değerlendirmesi | POST /restaurants/{restaurantId}/reviews/gourmet | ❌ | ❌ | ✅ | ✅ | Detaylı rating |
| Kendi Yorumunu Güncelleme | PATCH /reviews/{reviewId} | ❌ | ✅ | ✅ | ✅ | Sadece kendi |
| Kendi Yorumunu Silme | DELETE /reviews/{reviewId} | ❌ | ✅ | ✅ | ✅ | Sadece kendi |
| Başkasının Yorumunu Silme | DELETE /reviews/{reviewId} | ❌ | ❌ | ❌ | ✅ | Admin only |
| Yorumu Yararlı Bulma | POST /reviews/{reviewId}/helpful | ❌ | ✅ | ✅ | ✅ | - |
| Yararlı İşaretini Kaldırma | DELETE /reviews/{reviewId}/helpful | ❌ | ✅ | ✅ | ✅ | - |
| Yoruma Yorum Yapma | POST /reviews/{reviewId}/comments | ❌ | ✅ | ✅ | ✅ | - |

### Fotoğraf Yönetimi

| İşlem | Endpoint | Guest | User | Gourmet | Admin | Notlar |
|-------|----------|-------|------|---------|-------|--------|
| Fotoğraf Listesi | GET /restaurants/{restaurantId}/photos | ✅ | ✅ | ✅ | ✅ | Herkese açık |
| Fotoğraf Detayı | GET /photos/{photoId} | ✅ | ✅ | ✅ | ✅ | Herkese açık |
| Upload URL İsteme | POST /photos/upload-url | ❌ | ✅ | ✅ | ✅ | Pre-signed URL |
| Yükleme Onaylama | POST /photos/{photoId}/confirm | ❌ | ✅ | ✅ | ✅ | Sadece kendi |
| Kendi Fotoğrafını Silme | DELETE /photos/{photoId} | ❌ | ✅ | ✅ | ✅ | Sadece kendi |
| Başkasının Fotoğrafını Silme | DELETE /photos/{photoId} | ❌ | ❌ | ❌ | ✅ | Admin only |
| Fotoğraf Beğenme | POST /photos/{photoId}/like | ❌ | ✅ | ✅ | ✅ | - |
| Beğeni Geri Alma | DELETE /photos/{photoId}/like | ❌ | ✅ | ✅ | ✅ | - |

### Arama ve Keşfet

| İşlem | Endpoint | Guest | User | Gourmet | Admin | Notlar |
|-------|----------|-------|------|---------|-------|--------|
| Genel Arama | GET /search | ✅ | ✅ | ✅ | ✅ | - |
| Kullanıcı Arama | GET /search/users | ✅ | ✅ | ✅ | ✅ | - |
| Favori Restoranlarım | GET /users/me/favorites | ❌ | ✅ | ✅ | ✅ | - |
| Favorilere Ekleme | POST /restaurants/{restaurantId}/favorite | ❌ | ✅ | ✅ | ✅ | - |
| Favorilerden Çıkarma | DELETE /restaurants/{restaurantId}/favorite | ❌ | ✅ | ✅ | ✅ | - |

### Sosyal Özellikler

| İşlem | Endpoint | Guest | User | Gourmet | Admin | Notlar |
|-------|----------|-------|------|---------|-------|--------|
| Kullanıcı Takip Etme | POST /users/{userId}/follow | ❌ | ✅ | ✅ | ✅ | - |
| Takibi Bırakma | DELETE /users/{userId}/follow | ❌ | ✅ | ✅ | ✅ | - |
| Takipçi Listesi | GET /users/{userId}/followers | ✅ | ✅ | ✅ | ✅ | - |
| Takip Edilen Listesi | GET /users/{userId}/following | ✅ | ✅ | ✅ | ✅ | - |
| Feed (Takip Edilenlerin İçerikleri) | GET /feed | ❌ | ✅ | ✅ | ✅ | - |

### Admin İşlemleri

| İşlem | Endpoint | Guest | User | Gourmet | Admin | Notlar |
|-------|----------|-------|------|---------|-------|--------|
| Kullanıcı Listesi | GET /admin/users | ❌ | ❌ | ❌ | ✅ | Admin only |
| Kullanıcı Detayı (Tam) | GET /admin/users/{userId} | ❌ | ❌ | ❌ | ✅ | Tüm detaylar |
| Rol Değiştirme | PATCH /admin/users/{userId}/role | ❌ | ❌ | ❌ | ✅ | Admin only |
| Kullanıcı Askıya Alma | PATCH /admin/users/{userId}/suspend | ❌ | ❌ | ❌ | ✅ | Admin only |
| Kullanıcı Aktifleştirme | PATCH /admin/users/{userId}/activate | ❌ | ❌ | ❌ | ✅ | Admin only |
| Kullanıcı Silme (Hard Delete) | DELETE /admin/users/{userId} | ❌ | ❌ | ❌ | ✅ | Kalıcı silme |
| Gurme Kodu Oluşturma | POST /admin/gourmet-codes | ❌ | ❌ | ❌ | ✅ | Admin only |
| Gurme Kodu Listesi | GET /admin/gourmet-codes | ❌ | ❌ | ❌ | ✅ | Admin only |
| Gurme Kodu İptal Etme | DELETE /admin/gourmet-codes/{code} | ❌ | ❌ | ❌ | ✅ | Admin only |
| İstatistikler | GET /admin/statistics | ❌ | ❌ | ❌ | ✅ | Dashboard |
| Audit Log | GET /admin/audit-logs | ❌ | ❌ | ❌ | ✅ | Sistem logları |
| İçerik Moderasyonu | GET /admin/moderation/queue | ❌ | ❌ | ❌ | ✅ | Onay bekleyen |
| İçerik Onaylama | POST /admin/moderation/{contentId}/approve | ❌ | ❌ | ❌ | ✅ | Admin only |
| İçerik Reddetme | POST /admin/moderation/{contentId}/reject | ❌ | ❌ | ❌ | ✅ | Admin only |

## Özel Senaryolar ve İş Kuralları

### 1. Yorum Yapma Kuralları

**User (Normal Kullanıcı):**
- Bir restorana sadece bir kez basit yorum yapabilir
- Yorumunu 24 saat içinde sınırsız düzenleyebilir
- 24 saat sonra sadece 1 kez düzenleyebilir
- Yorum için sadece tek bir rating veriri (1-5 arası)

**Gourmet (Gurme Kullanıcı):**
- Bir restorana hem basit yorum hem de detaylı gurme değerlendirmesi yapabilir
- Gurme değerlendirmesi ayrı ayrı rating kategorileri içerir:
  - Food Quality (Yemek Kalitesi)
  - Presentation (Sunum)
  - Service (Hizmet)
  - Ambiance (Atmosfer)
  - Value for Money (Fiyat/Performans)
- Gurme değerlendirmesi "Verified Gourmet" badge'i ile gösterilir
- Yorumları listede daha üst sıralarda gösterilir

### 2. Fotoğraf Yükleme İş Akışı

**Pre-signed URL Sistemi:**

1. **İstemci → Backend**: Upload URL isteği
   ```
   POST /photos/upload-url
   Body: { restaurantId, fileName, fileType, fileSize }
   ```

2. **Backend → İstemci**: Pre-signed URL
   ```
   Response: { uploadUrl, photoId, expiresIn: 300 }
   ```

3. **İstemci → S3**: Dosya yükleme (direkt S3'e)
   ```
   PUT {uploadUrl}
   Headers: { Content-Type: image/jpeg }
   Body: [binary file data]
   ```

4. **İstemci → Backend**: Yükleme onayı
   ```
   POST /photos/{photoId}/confirm
   Body: { caption, tags }
   ```

5. **Backend**: Fotoğraf işleme
   - Thumbnail oluşturma
   - Metadata çıkarma
   - CDN'e dağıtım
   - Veritabanına kayıt

**Güvenlik Kontrolleri:**
- Dosya tipi kontrolü (sadece image/jpeg, image/png, image/webp)
- Dosya boyutu kontrolü (max 10MB)
- Pre-signed URL geçerlilik süresi (5 dakika)
- EXIF data temizleme
- Virus/malware tarama

### 3. Gurme Kod Sistemi

**Kod Oluşturma (Admin):**
```
POST /admin/gourmet-codes
Body: {
  quantity: 10,
  expiresAt: "2026-12-31T23:59:59Z",
  note: "2026 yılı için"
}
```

**Kod Kullanımı:**
```
POST /auth/register/gourmet
Body: {
  ...standart kayıt bilgileri,
  gourmetCode: "GURME2026XYZ",
  expertise: ["Turkish Cuisine"],
  certification: "..."
}
```

**Validasyon:**
- Kod geçerli mi?
- Kullanılmış mı?
- Süresi dolmuş mu?
- Format doğru mu? (GURME + YIL + 3 karakter alfanumerik)

### 4. Rate Limiting Stratejisi

**Role-based Limits:**

| Rol | İstek/Saat | Özel İstek/Saat | Yükleme/Gün |
|-----|-----------|-----------------|-------------|
| Guest | 100 | - | - |
| User | 1,000 | Review: 10, Photo: 20 | Photo: 50 |
| Gourmet | 2,000 | Review: 20, Photo: 50 | Photo: 100 |
| Admin | 10,000 | Unlimited | Unlimited |

**Endpoint Bazlı Limitler:**
- POST /auth/login: 5 başarısız deneme/15 dakika (IP bazlı)
- POST /auth/register: 3 kayıt/saat (IP bazlı)
- POST /restaurants/*/reviews: Role bazlı
- POST /photos/upload-url: Role bazlı

### 5. Puan Hesaplama Algoritması

**Overall Rating Hesaplaması:**

```
Overall Rating = (User Ratings * 0.4) + (Gourmet Ratings * 0.6)

User Average Rating = SUM(User Ratings) / COUNT(User Reviews)
Gourmet Average Rating = SUM(Gourmet Overall Ratings) / COUNT(Gourmet Reviews)
```

**Weighted Rating (Popülerlik bazlı):**

```
Bayesian Average = (C * m + R * v) / (C + v)

C = Minimum review sayısı (örn: 10)
m = Ortalama puan (tüm restoranların ortalaması)
R = Restoranın kendi ortalaması
v = Restoranın aldığı review sayısı
```

### 6. İçerik Moderasyonu

**Auto-moderation Kuralları:**
- Argo/küfür tespiti (Türkçe NLP)
- Spam tespiti (tekrarlayan içerik)
- Link spam kontrolü
- Sahte review tespiti (aynı IP, aynı pattern)

**Manuel Moderation:**
- Şüpheli içerik kuyruğa alınır
- Admin onayı bekler
- Onaylanana kadar gösterilmez (gourmet reviewlar hariç)

### 7. Notification Stratejisi

**Bildirim Tetikleyicileri:**
- Yorumuna yanıt geldi (push, email)
- Fotoğrafın beğenildi (push)
- Takip ettiğin biri yorum yaptı (push)
- Favori restorana yeni review (push)
- Gurme biri favorin hakkında yorum yaptı (push, email)

**Notification Preferences:**
```
PATCH /users/me/notification-preferences
Body: {
  push: { reviews: true, likes: true, follows: true },
  email: { weekly_digest: true, review_replies: true }
}
```

## Yetkilendirme Implementasyonu

### JWT Token Yapısı

```json
{
  "sub": "usr_1a2b3c4d5e",
  "email": "kullanici@example.com",
  "role": "gourmet",
  "permissions": [
    "review:create",
    "review:gourmet",
    "photo:upload",
    "user:update:own"
  ],
  "iat": 1704473998,
  "exp": 1704477598
}
```

### Middleware Kontrolü

**Request Flow:**
```
Client Request
  → Authentication Middleware (Token validation)
  → Authorization Middleware (Permission check)
  → Rate Limiting Middleware
  → Input Validation
  → Business Logic
  → Response
```

**Permission Format:**
```
resource:action:scope

Örnekler:
- review:create:any (Herhangi bir review oluşturabilir)
- review:delete:own (Sadece kendi review'unu silebilir)
- restaurant:create:any (Admin - restoran oluşturabilir)
```

### Örnek Authorization Kodu (Pseudo-code)

```javascript
// Middleware
function authorize(requiredPermissions) {
  return async (req, res, next) => {
    const user = req.user; // JWT'den çıkarılan
    
    // Role-based check
    if (!hasRequiredRole(user.role, requiredPermissions)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'Bu işlem için yetkiniz yok'
        }
      });
    }
    
    // Resource ownership check
    if (requiredPermissions.scope === 'own') {
      const resourceOwnerId = await getResourceOwner(req.params.id);
      if (resourceOwnerId !== user.id && user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Bu içeriği düzenleme yetkiniz yok'
          }
        });
      }
    }
    
    next();
  };
}

// Usage
router.delete(
  '/reviews/:reviewId',
  authenticate,
  authorize({ resource: 'review', action: 'delete', scope: 'own' }),
  deleteReview
);
```

## Güvenlik Best Practices

### 1. Authentication
- JWT ile stateless authentication
- Access token: 1 saat
- Refresh token: 30 gün (HttpOnly cookie)
- Token rotation on refresh
- Logout: Token blacklist (Redis)

### 2. Password Security
- Minimum 8 karakter
- En az 1 büyük harf, 1 küçük harf, 1 rakam
- Bcrypt ile hash (10+ rounds)
- Password reset token: 1 saat geçerli
- Başarısız login denemeleri: 5 deneme → 15 dk ban

### 3. API Security
- Rate limiting (role-based)
- CORS whitelist
- Input validation ve sanitization
- SQL injection koruması (prepared statements)
- XSS koruması (output encoding)
- CSRF token (state-changing operations)

### 4. Data Privacy
- Hassas bilgileri loglamama (password, token)
- GDPR compliance (data export, deletion)
- PII masking in logs
- Secure file storage (S3 private bucket + pre-signed URLs)

### 5. Audit Trail
- Tüm kritik işlemleri loglama
- User actions tracking
- Admin actions detailed logging
- IP address ve user agent logging
- Suspicious activity alerting

## Özet

Bu yetkilendirme matrisi:

1. **4 farklı rol** tanımlar (Guest, User, Gourmet, Admin)
2. **Detaylı izin tabloları** sağlar (31 endpoint için)
3. **Özel senaryolar** içerir (gurme değerlendirmesi, fotoğraf yükleme, kod sistemi)
4. **Güvenlik önlemleri** belirtir (rate limiting, authentication, audit)
5. **İş kuralları** açıklar (puan hesaplama, moderasyon)

Her endpoint için net yetki tanımları yapılmıştır ve sistem güvenli, ölçeklenebilir bir şekilde tasarlanmıştır.
