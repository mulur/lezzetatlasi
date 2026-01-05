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
