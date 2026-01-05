# Lezzet Atlası - .NET MAUI Mobile Application

## 📱 Proje Hakkında

Lezzet Atlası, kullanıcıların restoran ve kafeleri keşfetmesini, değerlendirmesini ve paylaşmasını sağlayan bir mobil uygulamadır. MVVM (Model-View-ViewModel) mimarisi ile geliştirilmiş, modern bir .NET MAUI uygulamasıdır.

## 🏗️ Mimari

### MVVM Pattern
Proje, MVVM (Model-View-ViewModel) tasarım desenini kullanmaktadır:

- **Models (DTO'lar)**: Veri transfer nesneleri (`Models/` klasörü)
- **Views**: XAML sayfa tanımlamaları (`Views/` klasörü)
- **ViewModels**: İş mantığı ve veri bağlama (`ViewModels/` klasörü)
- **Services**: API ve iş servisleri (`Services/` klasörü)

### Dependency Injection
Tüm servisler ve ViewModel'lar `MauiProgram.cs` içinde dependency injection container'a kaydedilmiştir.

## 📂 Proje Yapısı

```
LezzetAtlasi/
├── Models/                  # DTO'lar (Data Transfer Objects)
│   ├── UserDto.cs          # Kullanıcı modelleri
│   ├── PlaceDto.cs         # Mekan modelleri
│   ├── ReviewDto.cs        # Yorum modelleri
│   └── GourmetDto.cs       # Gurme modelleri
│
├── ViewModels/             # ViewModel sınıfları
│   ├── BaseViewModel.cs    # Temel ViewModel sınıfı
│   ├── OnboardingViewModel.cs
│   ├── LoginViewModel.cs
│   ├── RegisterViewModel.cs
│   ├── GourmetActivationViewModel.cs
│   ├── ExploreViewModel.cs
│   ├── MapViewModel.cs
│   ├── PlaceDetailViewModel.cs
│   ├── ReviewModalViewModel.cs
│   ├── GourmetPanelViewModel.cs
│   ├── ProfileViewModel.cs
│   └── SettingsViewModel.cs
│
├── Views/                  # XAML View tanımları
│   ├── OnboardingPage.xaml
│   ├── LoginPage.xaml
│   ├── RegisterPage.xaml
│   ├── GourmetActivationPage.xaml
│   ├── ExplorePage.xaml
│   ├── MapPage.xaml
│   ├── PlaceDetailPage.xaml
│   ├── ReviewModalPage.xaml
│   ├── GourmetPanelPage.xaml
│   ├── ProfilePage.xaml
│   └── SettingsPage.xaml
│
├── Services/               # Servis katmanı
│   ├── NavigationService.cs
│   ├── AuthService.cs
│   ├── PlaceService.cs
│   ├── ReviewService.cs
│   ├── GourmetService.cs
│   └── UserService.cs
│
├── Resources/             # Uygulama kaynakları
│   ├── Styles/           # Stil tanımlamaları
│   │   ├── Colors.xaml   # Renk paleti
│   │   └── Styles.xaml   # UI stilleri
│   ├── Fonts/            # Font dosyaları
│   ├── Images/           # Görseller
│   ├── AppIcon/          # Uygulama ikonu
│   └── Splash/           # Splash screen
│
├── App.xaml              # Uygulama tanımı
├── App.xaml.cs
├── AppShell.xaml         # Shell navigasyon yapısı
├── AppShell.xaml.cs
├── MauiProgram.cs        # Uygulama başlangıcı ve DI
└── GlobalUsings.cs       # Global using direktifleri
```

## 🎯 Özellikler

### 1. Onboarding
- İlk kullanım tanıtım ekranları
- 3 sayfalık kullanıcı rehberi
- Atla ve devam et seçenekleri

### 2. Kimlik Doğrulama (Authentication)
- **Login**: E-posta ve şifre ile giriş
- **Register**: Yeni kullanıcı kaydı
- Şifremi unuttum özelliği
- Beni hatırla seçeneği

### 3. Gurme Aktivasyonu
- Gurme kullanıcı başvurusu
- Uzmanlık alanı seçimi
- Doğrulama tipi belirleme
- Deneyim açıklaması

### 4. Ana Keşfet Ekranı (Explore)
- Mekan listesi ve arama
- Kategori filtreleme
- Öne çıkan mekanlar
- Öne çıkan gurmeler
- Pull-to-refresh

### 5. Harita Görünümü (Map)
- Yakındaki mekanlar
- Harita üzerinde işaretleyiciler
- Zoom kontrolleri
- Konum merkezleme

### 6. Mekan Detayı
- Detaylı mekan bilgileri
- Fotoğraf galerisi
- Yorumlar listesi
- Yol tarifi, arama, paylaşma
- Favori ekleme/çıkarma

### 7. Yorum/Puan Verme
- Genel puan verme (1-5 yıldız)
- Detaylı değerlendirme:
  - Yemek kalitesi
  - Servis kalitesi
  - Atmosfer
  - Fiyat/performans
  - Temizlik
- Fotoğraf ekleme
- Ziyaret tarihi seçimi

### 8. Gurme Paneli
- Gurme profil bilgileri
- İstatistikler (yorum, takipçi, mekan sayısı)
- Yorumlarım listesi
- Profil düzenleme

### 9. Profil
- Kullanıcı profil bilgileri
- Yorumlarım
- Favori mekanlarım
- Profil fotoğrafı değiştirme
- Çıkış yapma

### 10. Ayarlar
- Bildirim ayarları
- Konum servisleri
- Dil seçimi
- Favori mutfaklar
- Önbellek temizleme
- Hakkında, Gizlilik, Kullanım Koşulları

## 📋 DTO'lar (Data Transfer Objects)

### UserDto
- Kullanıcı kimlik bilgileri
- Profil bilgileri
- Tercihler
- Gurme durumu

### PlaceDto
- Mekan temel bilgileri
- Konum (latitude, longitude)
- Değerlendirme puanları
- Mutfak tipleri
- Çalışma saatleri
- Özellikler (WiFi, park, vb.)

### ReviewDto
- Kullanıcı yorumları
- Detaylı puanlamalar
- Fotoğraflar
- Beğeni sayısı
- Cevaplar

### GourmetDto
- Gurme profil bilgileri
- Uzmanlık alanları
- İstatistikler
- Doğrulama durumu

## 🔧 Servisler

### INavigationService
- Sayfa navigasyonu
- Parametre ile navigasyon
- Geri gitme
- Root'a gitme

### IAuthService
- Login işlemleri
- Register işlemleri
- Token yönetimi
- Oturum kontrolü

### IPlaceService
- Mekan listeleme
- Mekan detayı
- Yakındaki mekanlar
- Arama
- Favori işlemleri

### IReviewService
- Yorum listeleme
- Yorum oluşturma
- Yorum güncelleme
- Yorum silme
- Beğeni işlemleri

### IGourmetService
- Gurme profil yönetimi
- Gurme aktivasyonu
- Gurme arama
- Takip işlemleri

### IUserService
- Kullanıcı profil yönetimi
- Tercih güncellemeleri
- Profil fotoğrafı yükleme

## 🎨 Tasarım Sistemi

### Renk Paleti
- **Primary**: #E74C3C (Kırmızı - Ana renk)
- **Secondary**: #3498DB (Mavi)
- **Accent**: #F39C12 (Turuncu)
- **Success**: #27AE60 (Yeşil)
- **Warning**: #F39C12 (Sarı)
- **Danger**: #E74C3C (Kırmızı)

### Tipografi
- **OpenSans Regular**: Normal metin
- **OpenSans Semibold**: Vurgulu metin
- Font boyutları: 12, 14, 16, 18, 24, 28, 32

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler
- .NET 10 SDK
- Visual Studio 2022 veya VS Code
- MAUI Workload
- Android/iOS/Windows geliştirme araçları

### Kurulum Adımları

1. **Projeyi klonlayın:**
```bash
git clone https://github.com/mulur/lezzetatlasi.git
cd lezzetatlasi
```

2. **MAUI workload'u yükleyin:**
```bash
dotnet workload install maui
```

3. **Bağımlılıkları yükleyin:**
```bash
dotnet restore
```

4. **Projeyi derleyin:**
```bash
dotnet build
```

5. **Uygulamayı çalıştırın:**
```bash
# Android
dotnet build -t:Run -f net10.0-android

# iOS
dotnet build -t:Run -f net10.0-ios

# Windows
dotnet build -t:Run -f net10.0-windows10.0.19041.0
```

## 📦 Kullanılan Paketler

- **Microsoft.Maui.Controls**: MAUI framework
- **CommunityToolkit.Mvvm**: MVVM helpers ve attribute'lar
- **CommunityToolkit.Maui**: Ek MAUI kontrolleri
- **CommunityToolkit.Maui.Maps**: Harita desteği

## 🔄 Navigasyon Akışı

```
Uygulama Başlangıcı
    ↓
Onboarding (İlk kez) / Login
    ↓
Ana Shell (TabBar)
    ├── Keşfet → Mekan Detay → Yorum Yaz
    ├── Harita → Mekan Detay
    ├── Gurme Paneli → Gurme Aktivasyon
    └── Profil → Ayarlar
```

## 🔐 Güvenlik

- Şifreler hash'lenerek saklanmalıdır
- API token'ları güvenli şekilde saklanmalıdır
- HTTPS kullanılmalıdır
- Kullanıcı verileri şifrelenmeli

## 🌐 Çok Dilli Destek

Uygulama şu anda Türkçe desteklemektedir. Gelecekte eklenebilecek diller:
- İngilizce (en)
- Almanca (de)

## 📝 Geliştirme Notları

### Mock Servisler
Şu anda tüm servisler mock (sahte) veri ile çalışmaktadır. Gerçek backend entegrasyonu için:

1. API endpoint'lerini yapılandırın
2. HttpClient kullanarak API çağrıları yapın
3. Authentication token yönetimini implement edin
4. Hata yönetimini güçlendirin

### TODO
- [ ] Backend API entegrasyonu
- [ ] Gerçek harita kontrolü entegrasyonu
- [ ] Push notification desteği
- [ ] Sosyal medya entegrasyonu
- [ ] Offline mod desteği
- [ ] Unit ve integration testler
- [ ] Performans optimizasyonları
- [ ] Accessibility iyileştirmeleri

## 👥 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje [MIT lisansı](LICENSE) altında lisanslanmıştır.

## 📞 İletişim

Proje Link: [https://github.com/mulur/lezzetatlasi](https://github.com/mulur/lezzetatlasi)

## 🙏 Teşekkürler

- .NET MAUI Team
- CommunityToolkit contributors
- Tüm açık kaynak katkıda bulunanlar
# Lezzetatlası Sistem Mimarisi

## Sistem Bileşenleri

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Web App    │  │  Mobile App  │  │  3rd Party   │         │
│  │  (React/Vue) │  │ (iOS/Android)│  │  Integrations│         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┴──────────────────┘                  │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                             │ HTTPS / JWT
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                    API GATEWAY LAYER                             │
├────────────────────────────┼─────────────────────────────────────┤
│                            │                                     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │           API Gateway / Load Balancer                  │     │
│  │  - Rate Limiting                                       │     │
│  │  - CORS Handling                                       │     │
│  │  - SSL Termination                                     │     │
│  │  - Request Logging                                     │     │
│  └────────────────────┬───────────────────────────────────┘     │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
                        │
┌───────────────────────┼──────────────────────────────────────────┐
│                  APPLICATION LAYER                               │
├───────────────────────┼──────────────────────────────────────────┤
│                       │                                          │
│  ┌────────────────────▼────────────────────────────────┐        │
│  │     Authentication Middleware                       │        │
│  │     - JWT Token Validation                          │        │
│  │     - User Session Management                       │        │
│  └────────────────────┬────────────────────────────────┘        │
│                       │                                          │
│  ┌────────────────────▼────────────────────────────────┐        │
│  │     Authorization Middleware                        │        │
│  │     - Role-based Access Control (RBAC)              │        │
│  │     - Resource Ownership Check                      │        │
│  └────────────────────┬────────────────────────────────┘        │
│                       │                                          │
│  ┌────────────────────▼────────────────────────────────┐        │
│  │           REST API Endpoints                        │        │
│  │  ┌─────────────────────────────────────────┐        │        │
│  │  │  /auth/*         (Authentication)       │        │        │
│  │  │  /users/*        (User Management)      │        │        │
│  │  │  /restaurants/*  (Restaurant CRUD)      │        │        │
│  │  │  /reviews/*      (Review System)        │        │        │
│  │  │  /photos/*       (Photo Management)     │        │        │
│  │  │  /search/*       (Search & Discovery)   │        │        │
│  │  │  /admin/*        (Admin Operations)     │        │        │
│  │  └─────────────────────────────────────────┘        │        │
│  └────────────────────┬────────────────────────────────┘        │
│                       │                                          │
└───────────────────────┼──────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌───────────────┐ ┌────────────┐ ┌──────────────┐
│   Database    │ │   Cache    │ │  File Storage│
│   (PostgreSQL)│ │   (Redis)  │ │    (S3/CDN)  │
├───────────────┤ ├────────────┤ ├──────────────┤
│ - Users       │ │ - Sessions │ │ - Photos     │
│ - Restaurants │ │ - Rate     │ │ - Thumbnails │
│ - Reviews     │ │   Limits   │ │ - Assets     │
│ - Photos      │ │ - Cache    │ │              │
│ - Gourmet     │ │   Data     │ │              │
│   Codes       │ │            │ │              │
└───────────────┘ └────────────┘ └──────────────┘
```

## İstek Akış Diyagramı

### 1. Basit Yorum Ekleme (User)

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. POST /restaurants/{id}/reviews
     │    Authorization: Bearer {token}
     │    Body: { rating, comment }
     ▼
┌─────────────────────┐
│   API Gateway       │
│  - Rate Limit Check │ ◄── 100 req/hour (User)
└────┬────────────────┘
     │ 2. Forward request
     ▼
┌─────────────────────┐
│  Auth Middleware    │
│  - Validate JWT     │ ◄── Token geçerli mi?
│  - Extract User     │     User kimliği?
└────┬────────────────┘
     │ 3. User identified
     ▼
┌─────────────────────┐
│  Authz Middleware   │
│  - Check Role       │ ◄── User role = "user" ✓
│  - Check Permission │     review:create ✓
└────┬────────────────┘
     │ 4. Authorized
     ▼
┌─────────────────────┐
│  Business Logic     │
│  - Validate Input   │ ◄── Rating 1-5? ✓
│  - Check Duplicate  │     Daha önce yorum var mı? ✗
│  - Create Review    │
└────┬────────────────┘
     │ 5. Save to DB
     ▼
┌─────────────────────┐
│    Database         │ ◄── INSERT review
│  - reviews table    │     UPDATE restaurant rating
└────┬────────────────┘
     │ 6. Success
     ▼
┌─────────────────────┐
│     Response        │
│  201 Created        │
│  { reviewId, ... }  │
└─────────────────────┘
```

### 2. Gurme Değerlendirmesi (Gourmet)

```
┌─────────┐
│ Gourmet │
└────┬────┘
     │
     │ 1. POST /restaurants/{id}/reviews/gourmet
     │    Authorization: Bearer {token}
     │    Body: { ratings: {food, service, ...}, detailedReview: {...} }
     ▼
┌─────────────────────┐
│   API Gateway       │
│  - Rate Limit Check │ ◄── 2000 req/hour (Gourmet)
└────┬────────────────┘
     │ 2. Forward request
     ▼
┌─────────────────────┐
│  Auth Middleware    │
│  - Validate JWT     │ ◄── Token geçerli mi?
│  - Extract User     │     User kimliği?
└────┬────────────────┘
     │ 3. User identified
     ▼
┌─────────────────────┐
│  Authz Middleware   │
│  - Check Role       │ ◄── User role = "gourmet" ✓
│  - Check Permission │     review:gourmet ✓
└────┬────────────────┘
     │ 4. Authorized
     ▼
┌─────────────────────┐
│  Business Logic     │
│  - Validate Input   │ ◄── All ratings present? ✓
│  - Verify Gourmet   │     Gourmet verified? ✓
│  - Create Review    │
└────┬────────────────┘
     │ 5. Save to DB
     ▼
┌─────────────────────┐
│    Database         │ ◄── INSERT gourmet_review
│  - gourmet_reviews  │     UPDATE restaurant ratings
│    table            │     (weighted with gourmet bonus)
└────┬────────────────┘
     │ 6. Success
     ▼
┌─────────────────────┐
│     Response        │
│  201 Created        │
│  { reviewId,        │
│    verifiedGourmet  │
│    ...}             │
└─────────────────────┘
```

### 3. Fotoğraf Yükleme Akışı (Pre-signed URL)

```
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 1. POST /photos/upload-url
     │    Body: { restaurantId, fileName, fileType, fileSize }
     ▼
┌─────────────────────┐
│  API Server         │
│  - Validate Request │ ◄── File size < 10MB? ✓
│  - Generate photoId │     File type valid? ✓
│  - Create S3 URL    │
└────┬────────────────┘
     │ 2. Return pre-signed URL
     ▼
┌─────────────────────┐
│     Response        │
│  { uploadUrl,       │
│    photoId,         │
│    expiresIn: 300 } │ ◄── 5 dakika geçerli
└────┬────────────────┘
     │
     │ 3. PUT {uploadUrl}
     │    Body: [binary file]
     ▼
┌─────────────────────┐
│   AWS S3            │
│  - Store File       │ ◄── Direkt yükleme (backend bypass)
│  - Generate ETag    │
└────┬────────────────┘
     │ 4. Upload complete
     ▼
┌─────────┐
│  User   │
└────┬────┘
     │
     │ 5. POST /photos/{photoId}/confirm
     │    Body: { caption, tags }
     ▼
┌─────────────────────┐
│  API Server         │
│  - Verify Upload    │ ◄── S3'te dosya var mı? ✓
│  - Create Thumbnail │
│  - Process Metadata │
│  - Save to DB       │
└────┬────────────────┘
     │ 6. Success
     ▼
┌─────────────────────┐
│     Response        │
│  { photoId,         │
│    url,             │
│    thumbnail }      │
└─────────────────────┘
```

## Rol Bazlı Erişim Kontrolü

```
┌──────────────────────────────────────────────────────────────┐
│                     REQUEST                                   │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Extract User   │
                    │ from JWT       │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ User Role?     │
                    └────┬───────────┘
                         │
        ┌────────────────┼────────────────┬────────────┐
        │                │                │            │
        ▼                ▼                ▼            ▼
   ┌────────┐      ┌────────┐      ┌─────────┐  ┌────────┐
   │ Guest  │      │  User  │      │ Gourmet │  │ Admin  │
   └───┬────┘      └───┬────┘      └────┬────┘  └───┬────┘
       │               │                 │           │
       │ Permissions:  │ Permissions:    │ Perms:    │ Perms:
       │ - Read only   │ - Guest +       │ - User +  │ - All
       │               │ - Create review │ - Gourmet │
       │               │ - Upload photo  │   review  │
       │               │ - Edit own      │ - Verified│
       │               │   content       │   badge   │
       │               │                 │           │
       └───────────────┴─────────────────┴───────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Permission     │
                    │ Check          │
                    └────┬───────────┘
                         │
                    ┌────┴────┐
                    │         │
                    ▼         ▼
              ┌─────────┐  ┌──────┐
              │ ALLOW   │  │ DENY │
              │ 200/201 │  │ 403  │
              └─────────┘  └──────┘
```

## Puan Hesaplama Sistemi

```
┌─────────────────────────────────────────────────────────────┐
│              Restaurant Rating Calculation                   │
└─────────────────────────────────────────────────────────────┘

User Reviews:                    Gourmet Reviews:
┌──────────────┐                ┌──────────────────────────┐
│ Review 1: 4.0│                │ Review 1:                │
│ Review 2: 4.5│                │  - Food: 4.8             │
│ Review 3: 5.0│                │  - Service: 4.7          │
│ Review 4: 4.0│                │  - Ambiance: 4.6         │
│ ...          │                │  - Overall: 4.7          │
└──────┬───────┘                │                          │
       │                        │ Review 2:                │
       │                        │  - Food: 4.9             │
       ▼                        │  - Service: 4.8          │
  Average: 4.375                │  - Ambiance: 4.7         │
  (40% weight)                  │  - Overall: 4.8          │
                                └──────┬───────────────────┘
                                       │
                                       ▼
                                  Average: 4.75
                                  (60% weight)
                                  
       │                               │
       └───────────┬───────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Overall Rating     │
         │  = 4.375 * 0.4 +    │
         │    4.75 * 0.6       │
         │  = 1.75 + 2.85      │
         │  = 4.60             │
         └─────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Bayesian Average   │
         │  (for new places)   │
         │                     │
         │  BA = (C*m + R*v)   │
         │       / (C + v)     │
         │                     │
         │  C = 10 (min revs)  │
         │  m = 4.0 (avg)      │
         │  R = 4.60 (rating)  │
         │  v = 6 (count)      │
         │                     │
         │  BA = (10*4.0 +     │
         │       4.60*6) /     │
         │       (10+6)        │
         │     = 4.23          │
         └─────────────────────┘
```

## Rate Limiting Mekanizması

```
┌─────────────────────────────────────────────────────────────┐
│                    Rate Limiting Flow                        │
└─────────────────────────────────────────────────────────────┘

    Request from Client
            │
            ▼
    ┌───────────────┐
    │ Extract User  │
    │ or IP         │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │ Get Rate Limit│ ◄── Redis: GET ratelimit:{userId}:{hour}
    │ Counter       │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │ Check Limit   │
    │               │
    │ Guest: 100    │
    │ User: 1000    │
    │ Gourmet: 2000 │
    │ Admin: 10000  │
    └───────┬───────┘
            │
       ┌────┴────┐
       │         │
       ▼         ▼
  ┌─────────┐  ┌──────────────┐
  │ < Limit │  │ >= Limit     │
  └────┬────┘  └──────┬───────┘
       │              │
       │              ▼
       │         ┌─────────────┐
       │         │ Return 429  │
       │         │ Too Many    │
       │         │ Requests    │
       │         └─────────────┘
       │
       ▼
  ┌─────────────┐
  │ Increment   │ ◄── Redis: INCR ratelimit:{userId}:{hour}
  │ Counter     │     EXPIRE 3600
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │ Add Headers │
  │             │
  │ X-RateLimit-Limit: 1000       │
  │ X-RateLimit-Remaining: 956    │
  │ X-RateLimit-Reset: 1704477598 │
  └─────┬───────┘
        │
        ▼
  ┌─────────────┐
  │ Process     │
  │ Request     │
  └─────────────┘
```

## Deployment Mimarisi

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                     │
└─────────────────────────────────────────────────────────────┘

                      ┌──────────────────┐
                      │  DNS / Route53   │
                      │  lezzetatlasi.com│
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │  CloudFlare CDN  │
                      │  - DDoS Protection
                      │  - SSL/TLS       │
                      │  - Static Assets │
                      └────────┬─────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  Load Balancer      │
                    │  (ALB/nginx)        │
                    └───────┬─────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │ API Server 1 │ │ API Server 2 │ │ API Server 3 │
    │ (Container)  │ │ (Container)  │ │ (Container)  │
    └──────┬───────┘ └──────┬───────┘ └──────┬───────┘
           │                │                │
           └────────────────┼────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │  PostgreSQL  │ │    Redis     │ │   AWS S3     │
    │  (Primary)   │ │   Cluster    │ │  + CloudFront│
    │              │ │              │ │              │
    │  ┌────────┐  │ │  - Sessions  │ │  - Photos    │
    │  │Replica │  │ │  - Cache     │ │  - Static    │
    │  └────────┘  │ │  - RateLimit │ │              │
    └──────────────┘ └──────────────┘ └──────────────┘

           │                │                │
           └────────────────┼────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Monitoring     │
                   │  - Prometheus   │
                   │  - Grafana      │
                   │  - ELK Stack    │
                   └─────────────────┘
```

## Güvenlik Katmanları

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
└─────────────────────────────────────────────────────────────┘

Layer 1: Network Security
┌─────────────────────────────────────┐
│ - HTTPS Only (TLS 1.3)              │
│ - DDoS Protection (CloudFlare)      │
│ - WAF (Web Application Firewall)    │
│ - IP Whitelisting (Admin endpoints) │
└─────────────────────────────────────┘
                 │
                 ▼
Layer 2: API Gateway Security
┌─────────────────────────────────────┐
│ - Rate Limiting                     │
│ - CORS Policy                       │
│ - Request Size Limits               │
│ - Header Validation                 │
└─────────────────────────────────────┘
                 │
                 ▼
Layer 3: Authentication
┌─────────────────────────────────────┐
│ - JWT Token Validation              │
│ - Token Expiry Check                │
│ - Blacklist Check (Redis)           │
│ - Multi-factor Auth (Optional)      │
└─────────────────────────────────────┘
                 │
                 ▼
Layer 4: Authorization
┌─────────────────────────────────────┐
│ - Role-Based Access Control (RBAC)  │
│ - Resource Ownership Verification   │
│ - Permission Matrix Check           │
└─────────────────────────────────────┘
                 │
                 ▼
Layer 5: Input Validation
┌─────────────────────────────────────┐
│ - Schema Validation (Joi/Yup)       │
│ - SQL Injection Prevention          │
│ - XSS Prevention                    │
│ - CSRF Token (State-changing ops)   │
└─────────────────────────────────────┘
                 │
                 ▼
Layer 6: Data Security
┌─────────────────────────────────────┐
│ - Password Hashing (bcrypt)         │
│ - Sensitive Data Encryption         │
│ - PII Masking in Logs               │
│ - Secure File Storage (S3 private)  │
└─────────────────────────────────────┘
                 │
                 ▼
Layer 7: Monitoring & Audit
┌─────────────────────────────────────┐
│ - Audit Logging                     │
│ - Intrusion Detection               │
│ - Anomaly Detection                 │
│ - Security Alerts                   │
└─────────────────────────────────────┘
```

## Özet

Bu mimari tasarım:
- ✅ **Scalable**: Horizontal scaling ile yüksek trafik destegi
- ✅ **Secure**: Çok katmanlı güvenlik yapısı
- ✅ **Performant**: Caching, CDN, optimized queries
- ✅ **Maintainable**: Clean architecture, separation of concerns
- ✅ **Monitorable**: Comprehensive logging and metrics
- ✅ **Resilient**: Load balancing, database replicas, fault tolerance

Production-ready bir API sistemi için gerekli tüm bileşenleri içermektedir.
