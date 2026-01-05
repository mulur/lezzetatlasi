# Lezzetatlası - Taste Atlas API

Lezzetatlası, restoran değerlendirme ve gurme inceleme platformu için tasarlanmış kapsamlı REST API dokümantasyonudur.

## 📚 Dokümantasyon

Bu proje aşağıdaki dokümantasyonları içerir:

### 1. [API Tasarımı](./API_DESIGN.md)
Tüm REST API endpoint'lerinin detaylı dokümantasyonu:
- ✅ 31 endpoint ile tam CRUD operasyonları
- ✅ Kimlik doğrulama ve yetkilendirme
- ✅ Normal kullanıcı ve gurme kaydı (özel kod sistemi ile)
- ✅ Restoran CRUD işlemleri
- ✅ İki seviyeli değerlendirme sistemi (basit ve gurme)
- ✅ Pre-signed URL ile fotoğraf yükleme sistemi
- ✅ Pagination, sorting ve filtering stratejileri
- ✅ Rate limiting ve güvenlik
- ✅ Hata kodları ve örnek request/response'lar

### 2. [Yetkilendirme Matrisi](./AUTHORIZATION_MATRIX.md)
Rol bazlı yetkilendirme detayları:
- 👥 4 rol tanımı (Guest, User, Gourmet, Admin)
- 📊 Detaylı izin tabloları (31+ endpoint için)
- 🔐 Özel senaryolar (gurme değerlendirmesi, fotoğraf yükleme)
- 🛡️ Güvenlik best practices
- 📝 İş kuralları ve validasyonlar

### 3. [OpenAPI Specification](./openapi.yaml)
Swagger/OpenAPI 3.0 formatında API spesifikasyonu:
- 🔧 Swagger UI ile test edilebilir
- 📖 Otomatik client kod üretimi için kullanılabilir
- 🎯 Tüm endpoint'ler için şema tanımları

### 4. [API Özeti ve CRUD Dağılımı](./API_SUMMARY.md)
Hızlı referans dokümantasyonu:
- 📈 Endpoint kategorileri ve HTTP method dağılımı
- 🔄 Her kaynak için CRUD işlem detayları
- ⚡ Özel özellikler (pre-signed URL, gurme kod sistemi)
- 📊 Rate limiting stratejileri
- 🎯 Performans optimizasyonları

### 5. [Sistem Mimarisi](./ARCHITECTURE.md)
Detaylı mimari tasarım ve akış diyagramları:
- 🏗️ Sistem bileşenleri ve katmanları
- 🔄 İstek akış diyagramları
- 🔐 Rol bazlı erişim kontrolü görselleştirmesi
- 📊 Puan hesaplama algoritması
- 🚀 Production deployment mimarisi
- 🛡️ Güvenlik katmanları

## 🎯 Özellikler

### Kullanıcı Rolleri
- **Guest**: Kayıtsız kullanıcı (sadece okuma)
- **User**: Kayıtlı kullanıcı (basit yorum/puan verebilir)
- **Gourmet**: Özel kod ile kayıtlı gurme (detaylı değerlendirme yapabilir)
- **Admin**: Sistem yöneticisi (tam yetki)

### İki Seviyeli Değerlendirme Sistemi

#### Normal Kullanıcı Yorumu
- Tek bir rating değeri (1-5)
- Basit yorum metni
- Tavsiye durumu

#### Gurme Değerlendirmesi
- Çoklu rating kategorileri:
  - Food Quality (Yemek Kalitesi)
  - Presentation (Sunum)
  - Service (Hizmet)
  - Ambiance (Atmosfer)
  - Value for Money (Fiyat/Performans)
- Detaylı inceleme yazısı
- Öneri ve iyileştirme önerileri
- "Verified Gourmet" badge'i

### Pre-signed URL Fotoğraf Yükleme
1. Backend'den upload URL iste
2. Dosyayı direkt S3'e yükle
3. Yükleme onayını backend'e bildir
4. Otomatik thumbnail oluşturma ve CDN dağıtımı

### Gurme Kod Sistemi
- Admin tarafından oluşturulan özel kodlar
- Geçerlilik süresi kontrolü
- Tek kullanımlık kodlar
- Gurme kullanıcı doğrulama mekanizması

## 🚀 API Endpoint Özeti

### Kimlik Doğrulama (5 endpoint)
- `POST /auth/register` - Normal kayıt
- `POST /auth/register/gourmet` - Gurme kaydı
- `POST /auth/login` - Giriş
- `POST /auth/refresh` - Token yenileme
- `POST /auth/logout` - Çıkış

### Kullanıcı Yönetimi (3 endpoint)
- `GET /users/me` - Profil görüntüleme
- `PATCH /users/me` - Profil güncelleme
- `DELETE /users/me` - Hesap silme
- `GET /users/{userId}` - Başka kullanıcı profili

### Restoran CRUD (5 endpoint)
- `GET /restaurants` - Liste (filtreleme, sıralama)
- `GET /restaurants/{id}` - Detay
- `POST /restaurants` - Oluşturma (Admin)
- `PATCH /restaurants/{id}` - Güncelleme (Admin)
- `DELETE /restaurants/{id}` - Silme (Admin)

### Değerlendirme (6 endpoint)
- `GET /restaurants/{id}/reviews` - Yorum listesi
- `POST /restaurants/{id}/reviews` - Basit yorum
- `POST /restaurants/{id}/reviews/gourmet` - Gurme değerlendirmesi
- `PATCH /reviews/{id}` - Güncelleme
- `DELETE /reviews/{id}` - Silme
- `POST /reviews/{id}/helpful` - Yararlı bulma

### Fotoğraf Yönetimi (4 endpoint)
- `POST /photos/upload-url` - Upload URL alma
- `POST /photos/{id}/confirm` - Yükleme onayı
- `GET /restaurants/{id}/photos` - Fotoğraf listesi
- `DELETE /photos/{id}` - Silme

### Arama (2 endpoint)
- `GET /search` - Genel arama
- `GET /restaurants/nearby` - Yakındaki restoranlar

### Admin İşlemleri (5 endpoint)
- `GET /admin/users` - Kullanıcı listesi
- `PATCH /admin/users/{id}/role` - Rol değiştirme
- `PATCH /admin/users/{id}/status` - Durum güncelleme
- `POST /admin/gourmet-codes` - Gurme kodu oluşturma
- `GET /admin/statistics` - İstatistikler

## 📊 Pagination & Filtering

### Pagination
```
GET /restaurants?page=1&limit=20
```

### Sorting
```
GET /restaurants?sort=rating&order=desc
```

### Filtering
```
GET /restaurants?city=Istanbul&cuisine=Turkish&minRating=4.0
```

### Arama
```
GET /restaurants?search=kebap&searchFields=name,description
```

## 🔒 Güvenlik

- JWT token tabanlı authentication
- Role-based authorization
- Rate limiting (rol bazlı)
- Input validation
- Pre-signed URL ile güvenli dosya yükleme
- HTTPS only
- CORS whitelist
- SQL injection koruması
- XSS koruması

## 🛠️ Rate Limits

| Rol | İstek/Saat |
|-----|-----------|
| Guest | 100 |
| User | 1,000 |
| Gourmet | 2,000 |
| Admin | 10,000 |

## 📝 Örnek Kullanım

### 1. Kayıt ve Giriş
```bash
# Normal kayıt
curl -X POST https://api.lezzetatlasi.com/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "Ahmet",
    "lastName": "Yılmaz"
  }'

# Giriş
curl -X POST https://api.lezzetatlasi.com/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### 2. Restoran Arama
```bash
curl -X GET "https://api.lezzetatlasi.com/v1/restaurants?city=Istanbul&minRating=4.0&sort=rating&order=desc"
```

### 3. Yorum Yapma
```bash
# Basit yorum (User)
curl -X POST https://api.lezzetatlasi.com/v1/restaurants/rst_123/reviews \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "rating": 4.5,
    "comment": "Harika bir deneyimdi!",
    "visitDate": "2026-01-05",
    "wouldRecommend": true
  }'

# Gurme değerlendirmesi (Gourmet)
curl -X POST https://api.lezzetatlasi.com/v1/restaurants/rst_123/reviews/gourmet \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "ratings": {
      "food": 4.8,
      "presentation": 4.9,
      "service": 4.7,
      "ambiance": 4.6,
      "value": 4.5,
      "overall": 4.7
    },
    "detailedReview": {
      "summary": "Modern Türk mutfağının en iyi örneklerinden biri",
      "foodQuality": "Malzemeler son derece taze...",
      "recommendations": ["Izgara Levrek", "Közlenmiş Patlıcan"]
    }
  }'
```

### 4. Fotoğraf Yükleme
```bash
# 1. Upload URL alma
curl -X POST https://api.lezzetatlasi.com/v1/photos/upload-url \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": "rst_123",
    "fileName": "food.jpg",
    "fileType": "image/jpeg",
    "fileSize": 2048576
  }'

# 2. S3'e yükleme (response'dan alınan URL ile)
curl -X PUT "{uploadUrl}" \
  -H "Content-Type: image/jpeg" \
  --data-binary @food.jpg

# 3. Onaylama
curl -X POST https://api.lezzetatlasi.com/v1/photos/{photoId}/confirm \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "Signature dish",
    "tags": ["main course", "seafood"]
  }'
```

## 🧪 Test Araçları

### Swagger UI
OpenAPI spesifikasyonunu Swagger UI ile görüntüleyebilirsiniz:
```bash
# Swagger Editor ile aç
https://editor.swagger.io/
# openapi.yaml dosyasını yükle
```

### Postman Collection
API dokümantasyonundan Postman collection oluşturabilirsiniz.

## 📖 Daha Fazla Bilgi

Detaylı bilgi için ilgili dokümantasyon dosyalarına bakınız:
- [API_DESIGN.md](./API_DESIGN.md) - Tüm endpoint detayları ve örnek request/response
- [AUTHORIZATION_MATRIX.md](./AUTHORIZATION_MATRIX.md) - Yetkilendirme ve güvenlik matrisi
- [openapi.yaml](./openapi.yaml) - OpenAPI 3.0 spesifikasyonu
- [API_SUMMARY.md](./API_SUMMARY.md) - Hızlı referans ve CRUD dağılımı
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Sistem mimarisi ve akış diyagramları

## 📄 Lisans

MIT License

## 👥 Katkıda Bulunma

Katkılarınızı bekliyoruz! Pull request göndermekten çekinmeyin.

## 📞 İletişim

Sorularınız için: api@lezzetatlasi.com