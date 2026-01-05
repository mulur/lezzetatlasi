# Security Implementation Guide

## Güvenlik, Invite Kod Yaşam Döngüsü ve Abuse Engelleme

Bu doküman, Lezzet Atlası platformunun güvenlik altyapısını, davet kodu yaşam döngüsünü ve kötüye kullanım önleme mekanizmalarını detaylı olarak açıklar.

## 1. Invite Kod Üretimi ve Kullanımı

### 1.1 Kod Üretimi
- **Kriptografik Güvenlik**: `crypto.randomBytes()` kullanılarak güvenli rastgele kodlar üretilir
- **Format**: XXXX-XXXX-XXXX formatında 12 karakterli kodlar
- **Karakter Seti**: Karışıklığı önlemek için belirsiz karakterler (0, O, 1, I) hariç tutulmuştur
- **Yetkilendirme**: Sadece Gurme ve Admin rolleri kod üretebilir

### 1.2 Kod Özellikleri
- **Kullanım Limiti**: Varsayılan olarak tek kullanımlık (yapılandırılabilir)
- **Son Kullanma Tarihi**: Varsayılan 30 gün (yapılandırılabilir)
- **Metadata**: Amaç ve hedef rol bilgisi eklenebilir
- **İzleme**: Kodu kim oluşturdu, kim kullandı takip edilir

### 1.3 Kod Validasyonu
Bir kod kullanılmadan önce:
1. Kodun veritabanında var olup olmadığı kontrol edilir
2. Aktif olup olmadığı kontrol edilir
3. Son kullanma tarihinin geçmediği kontrol edilir
4. Kullanım limitine ulaşılmadığı kontrol edilir
5. Kullanıcının daha önce bu kodu kullanmadığı kontrol edilir

## 2. Invite Yaşam Döngüsü

### Aşama 1: Oluşturma (Creation)
```
Gurme/Admin → API isteği → Kod üretimi → Veritabanına kayıt
```
- İstek eden kullanıcı kimliği kaydedilir
- Oluşturma zamanı timestamp'i eklenir
- Yapılandırma parametreleri uygulanır

### Aşama 2: Dağıtım (Distribution)
- Kod oluşturan kişi tarafından hedef kullanıcıya iletilir
- Sistemin dışında gerçekleşir (e-posta, mesaj, vb.)

### Aşama 3: Kullanım (Redemption)
```
Yeni Kullanıcı → Kayıt formu → Kod validasyonu → Hesap oluşturma → Kod kullanımı işaretlenir
```
- Tüm validasyon kontrolleri yapılır
- Başarılı kayıt sonrası kod kullanım sayısı artırılır
- Kullanıcı ID'si kod kaydına eklenir

### Aşama 4: Süre Sonu / Devre Dışı Bırakma
- **Otomatik**: Son kullanma tarihine ulaşıldığında
- **Otomatik**: Maksimum kullanım limitine ulaşıldığında
- **Manuel**: Kod oluşturan veya admin tarafından devre dışı bırakılabilir

### Aşama 5: Denetim (Audit)
- Tüm kod işlemleri audit log'larına kaydedilir
- Kimin, ne zaman, nasıl kullandığı takip edilir

## 3. Gurme/Rol Yükseltme ve İndirme

### 3.1 Rol Hiyerarşisi
```
Basic (Temel) → Gurme (Gurme) → Admin (Yönetici)
```

### 3.2 Rol İzinleri

#### Basic (Temel Kullanıcı)
- Platform içeriklerini görüntüleme
- Kendi profilini yönetme
- Temel platform özelliklerini kullanma

#### Gurme (Gelişmiş Kullanıcı)
- Basic tüm izinleri +
- Invite kodu oluşturma
- Kendi invite kodlarını yönetme
- Gelişmiş içerik özellikleri

#### Admin (Yönetici)
- Tüm izinler +
- Kullanıcı rol yönetimi (yükseltme/indirme)
- Kötü aktör yönetimi
- Sistem audit loglarına erişim
- Güvenlik olaylarını izleme

### 3.3 Rol Değişikliği Süreci

#### Yükseltme (Promotion)
```typescript
POST /api/users/:userId/promote
Authorization: Bearer <admin-token>
```
- Sadece Admin rollü kullanıcılar yapabilir
- Basic → Gurme veya Gurme → Admin
- İşlem audit log'a kaydedilir

#### İndirme (Demotion)
```typescript
POST /api/users/:userId/demote
Authorization: Bearer <admin-token>
```
- Sadece Admin rollü kullanıcılar yapabilir
- Admin → Gurme veya Gurme → Basic
- İşlem audit log'a kaydedilir

## 4. Abuse ve Rate Limiting

### 4.1 Rate Limiting Stratejisi

#### Endpoint Bazlı Limitler
- **Varsayılan**: 15 dakikada 100 istek
- Her endpoint için ayrı sayaç
- IP adresi bazlı takip

#### Özel Limitler
- `/api/users/register`: Daha kısıtlayıcı (hesap oluşturma)
- `/api/users/login`: Brute force koruması
- `/api/invites/generate`: Invite spam önleme

#### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 75
X-RateLimit-Reset: 2026-01-05T18:00:00.000Z
```

### 4.2 Kötü Aktör Tespiti

#### Otomatik Tespit Kriterleri
1. **IP Bazlı**:
   - Aynı IP'den çok sayıda hesap oluşturma
   - Hızlı ardışık hesap oluşturma (24 saatte 3+)
   - Maksimum hesap limitini aşma (varsayılan: 3)

2. **Email Bazlı**:
   - Tek kullanımlık email servisleri
   - Plus addressing abuse (email+1, email+2, ...)
   - Aşırı nokta kullanımı (Gmail dot trick)
   - Sayı ağırlıklı email pattern'leri

3. **Davranış Bazlı**:
   - Aşırı başarısız giriş denemeleri
   - Anormal istek pattern'leri
   - Rate limit aşımları

#### Risk Skorlama
```typescript
Risk Score = 0-100
- 0-30: Düşük risk (izin verilir)
- 31-49: Orta risk (uyarı, izin verilir)
- 50-79: Yüksek risk (ekstra doğrulama)
- 80-100: Kritik risk (engellenir)
```

### 4.3 Kötü Aktör Yönetimi

#### Bloke Türleri
1. **Geçici Bloke**: Belirli süre için (örn: 24 saat)
2. **Kalıcı Bloke**: Manuel kaldırma gerektirir

#### Severity Seviyeleri
- **Low**: Şüpheli ama zararsız
- **Medium**: Belirgin kötüye kullanım
- **High**: Ciddi güvenlik tehdidi
- **Critical**: Acil müdahale gerektiren

## 5. Spam ve Duplicate Hesap Önleme

### 5.1 Duplicate Detection

#### Benzerlik Algoritması
Levenshtein distance kullanılarak:
- Username benzerliği hesaplanır
- Email benzerliği (@ işaretinden önceki kısım) hesaplanır
- Threshold: %85 benzerlik şüpheli kabul edilir

#### Kontrol Edilen Alanlar
- Email adresleri
- Kullanıcı adları
- IP adresleri
- Hesap oluşturma zamanları

### 5.2 Spam Önleme Mekanizmaları

#### Hesap Oluşturma
1. **Invite Kodu Zorunluluğu**: Her kayıt için geçerli kod gerekli
2. **IP Limitleri**: IP başına maksimum hesap sayısı
3. **Email Validasyonu**: Şüpheli email pattern'leri reddedilir
4. **Rate Limiting**: Hızlı ardışık kayıt engellenir

#### Giriş Koruması
1. **Hesap Kilitleme**: 5 başarısız denemeden sonra 30 dakika kilit
2. **Rate Limiting**: Brute force saldırılarını önler
3. **IP Takibi**: Şüpheli IP'lerden gelen istekler engellenir

### 5.3 Kötüye Kullanım Savunması

#### Proaktif Önlemler
- Invite kodu sistemi (kontrolsüz kayda izin verilmez)
- Email pattern analizi
- IP reputation kontrolü
- Benzerlik tespiti

#### Reaktif Önlemler
- Kötü aktör otomatik engelleme
- Manuel bloke mekanizması
- Hesap devre dışı bırakma
- Audit log incelemesi

## 6. Audit ve Monitoring

### 6.1 Audit Logging

#### Kaydedilen Bilgiler
- Kullanıcı ID (varsa)
- İşlem türü (action)
- Kaynak (resource)
- Detaylar (JSON)
- IP adresi
- User agent
- Zaman damgası
- Başarı/başarısızlık durumu

#### Önemli İşlemler
- Kullanıcı kaydı ve girişi
- Invite kodu oluşturma ve kullanma
- Rol değişiklikleri
- Kötü aktör işlemleri
- Rate limit aşımları
- Güvenlik olayları

### 6.2 Security Monitoring

#### İzlenen Metrikler
- Başarısız giriş denemeleri
- Rate limit aşımları
- Kötü aktör engelleme sayısı
- Şüpheli hesap oluşturma denemeleri
- Anormal kullanım pattern'leri

#### Alert Kriterleri
- Çok sayıda başarısız giriş
- Ani kayıt artışı
- Bilinen kötü aktörden gelen istek
- Kritik API hatası

## 7. Güvenlik Best Practices

### 7.1 Deployment
1. **JWT Secret**: Güçlü, rastgele secret kullanın
2. **HTTPS**: Sadece HTTPS üzerinden çalıştırın
3. **Environment Variables**: Hassas bilgileri .env'de tutun
4. **Database**: Production'da gerçek veritabanı kullanın
5. **Monitoring**: Log ve metric takibi kurun

### 7.2 Maintenance
1. **Regular Updates**: Dependency'leri güncel tutun
2. **Audit Review**: Logları düzenli inceleyin
3. **Bad Actor Cleanup**: Expired block'ları temizleyin
4. **Performance**: Rate limit cache'lerini optimize edin

### 7.3 Incident Response
1. **Detection**: Güvenlik olayını tespit edin
2. **Analysis**: Audit loglarını inceleyin
3. **Containment**: Kötü aktörü bloke edin
4. **Recovery**: Etkilenen hesapları düzeltin
5. **Documentation**: Olayı dokümante edin

## 8. API Endpoints Güvenlik Matrisi

| Endpoint | Auth Required | Role Required | Rate Limited | Bad Actor Check |
|----------|---------------|---------------|--------------|-----------------|
| POST /api/users/register | No | - | Yes | Yes |
| POST /api/users/login | No | - | Yes | Yes |
| GET /api/users/me | Yes | Any | No | No |
| POST /api/invites/generate | Yes | Gurme/Admin | Yes | No |
| POST /api/invites/redeem | Yes | Any | Yes | No |
| GET /api/invites/:code | Yes | Any | Yes | No |
| POST /api/users/:id/promote | Yes | Admin | Yes | No |
| POST /api/users/:id/demote | Yes | Admin | Yes | No |
| GET /api/admin/bad-actors | Yes | Admin | Yes | No |
| POST /api/admin/bad-actors | Yes | Admin | Yes | No |

## 9. Yapılandırma Parametreleri

### Güvenlik Parametreleri
```env
# JWT
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d

# Password
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 dakika
RATE_LIMIT_MAX_REQUESTS=100

# Invite Codes
INVITE_CODE_LENGTH=12
INVITE_CODE_EXPIRY_DAYS=30
INVITE_CODE_MAX_USES=1

# Abuse Prevention
MAX_ACCOUNTS_PER_IP=3
DUPLICATE_DETECTION_THRESHOLD=0.85
```

## 10. Sonuç

Bu sistem, çok katmanlı güvenlik yaklaşımıyla:
- ✅ Kontrolsüz kayıt önlenir (invite-only)
- ✅ Spam ve bot saldırıları engellenir
- ✅ Duplicate hesaplar tespit edilir
- ✅ Kötü aktörler otomatik bloke edilir
- ✅ Tüm işlemler audit edilir
- ✅ Role-based access control sağlanır
- ✅ Rate limiting ile DoS korunması yapılır

Sistem, production ortamında güvenli bir şekilde kullanılabilir ve ihtiyaçlara göre kolayca genişletilebilir.
