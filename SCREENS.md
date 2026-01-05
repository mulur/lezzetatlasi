# Lezzet Atlası - Ekran Akış Diagramı ve UI/UX Dokümanı

## 📱 Ekran Listesi ve Navigasyon Akışı

### Başlangıç Akışı
```
App Launch
    ↓
[İlk açılış mı?]
    ├─ Evet → OnboardingPage → LoginPage
    └─ Hayır → [Oturum var mı?]
                    ├─ Evet → AppShell (Ana Uygulama)
                    └─ Hayır → LoginPage
```

## 1️⃣ Onboarding Ekranı

**Sayfa**: `OnboardingPage.xaml`  
**ViewModel**: `OnboardingViewModel.cs`

### Sorumluluklar
- Uygulamanın özelliklerini tanıtma (3 sayfa)
- Kullanıcı onayı alma
- İlk kullanım deneyimi sağlama

### UI Bileşenleri
- CarouselView (3 slide)
- Başlık ve açıklama metinleri
- İleri/Atla butonları
- Sayfa göstergeleri (dots)

### Navigasyon
- **İleri** → Sonraki slide veya LoginPage
- **Atla** → LoginPage

---

## 2️⃣ Authentication (Kimlik Doğrulama) Ekranları

### 2.1 Login Ekranı

**Sayfa**: `LoginPage.xaml`  
**ViewModel**: `LoginViewModel.cs`

#### Sorumluluklar
- Kullanıcı girişi
- Form validasyonu
- Token yönetimi

#### DTO'lar
- `LoginDto`: Email, Password, RememberMe

#### UI Bileşenleri
- Email Entry
- Password Entry (masked)
- RememberMe CheckBox
- Giriş Yap Button
- Kayıt Ol linki
- Şifremi Unuttum linki

#### Navigasyon
- **Giriş Başarılı** → AppShell (Ana ekran)
- **Kayıt Ol** → RegisterPage
- **Şifremi Unuttum** → (Şifre sıfırlama - gelecek özellik)

---

### 2.2 Register Ekranı

**Sayfa**: `RegisterPage.xaml`  
**ViewModel**: `RegisterViewModel.cs`

#### Sorumluluklar
- Yeni kullanıcı kaydı
- Form validasyonu
- Kullanım koşulları onayı

#### DTO'lar
- `RegisterDto`: Email, Password, FirstName, LastName, PhoneNumber

#### UI Bileşenleri
- Ad Entry
- Soyad Entry
- Email Entry
- Telefon Entry
- Şifre Entry
- Şifre Tekrar Entry
- Kullanım Koşulları CheckBox
- Kayıt Ol Button

#### Navigasyon
- **Kayıt Başarılı** → LoginPage
- **Geri** → LoginPage

---

## 3️⃣ Ana Uygulama (AppShell)

**Sayfa**: `AppShell.xaml`

### TabBar Yapısı
```
TabBar (Alt Navigasyon)
├── Keşfet (ExplorePage) - Default
├── Harita (MapPage)
├── Gurme (GourmetPanelPage)
└── Profil (ProfilePage)
```

---

## 4️⃣ Keşfet Ekranı (Explore)

**Sayfa**: `ExplorePage.xaml`  
**ViewModel**: `ExploreViewModel.cs`

### Sorumluluklar
- Mekanları listeleme
- Arama ve filtreleme
- Öne çıkan içerik gösterimi

### DTO'lar
- `PlaceDto`: Mekan bilgileri
- `GourmetListItemDto`: Gurme listesi
- `PlaceSearchFilterDto`: Filtreleme kriterleri

### UI Bileşenleri
- SearchBar (üst)
- Kategori filtreleri (horizontal scroll)
- Öne çıkan mekanlar carousel
- Mekan listesi (CollectionView)
- Öne çıkan gurmeler section
- Pull-to-refresh

### Navigasyon
- **Mekan Seçimi** → PlaceDetailPage (PlaceId parametresi ile)
- **Gurme Seçimi** → Gurme profil sayfası (gelecek)

---

## 5️⃣ Harita Ekranı (Map)

**Sayfa**: `MapPage.xaml`  
**ViewModel**: `MapViewModel.cs`

### Sorumluluklar
- Mekanları harita üzerinde gösterme
- Konum bazlı arama
- Harita kontrolü

### DTO'lar
- `PlaceDto`: Mekan bilgileri
- `LocationDto`: Konum (lat, lng)

### UI Bileşenleri
- Harita kontrolü (Map view)
- Konum işaretleyicileri (pins)
- Alt sheet (mekan listesi)
- Zoom kontrolleri (+/-)
- Konumumu bul butonu
- Mekan listesi toggle

### Navigasyon
- **Mekan Seçimi** → PlaceDetailPage

---

## 6️⃣ Mekan Detay Ekranı

**Sayfa**: `PlaceDetailPage.xaml`  
**ViewModel**: `PlaceDetailViewModel.cs`

### Sorumluluklar
- Mekan detaylarını gösterme
- Yorumları listeleme
- Favori işlemleri
- Sosyal etkileşimler

### DTO'lar
- `PlaceDto`: Tam mekan bilgileri
- `ReviewDto`: Yorumlar listesi
- `WorkingHoursDto`: Çalışma saatleri

### UI Bileşenleri
- Fotoğraf galerisi (carousel)
- Mekan bilgileri:
  - İsim ve değerlendirme
  - Adres, telefon
  - Fiyat aralığı
  - Mutfak tipleri
  - Özellikler (WiFi, park, vb.)
- Aksiyon butonları:
  - ❤️ Favori
  - 📞 Ara
  - 🗺️ Yol Tarifi
  - 📤 Paylaş
- Tab görünüm:
  - Bilgi
  - Yorumlar
  - Fotoğraflar
  - Konum
- Yorum Yaz butonu

### Navigasyon
- **Yorum Yaz** → ReviewModalPage (PlaceId parametresi)
- **Yorum Seçimi** → Yorum detayı (gelecek)
- **Geri** → Önceki sayfa

---

## 7️⃣ Yorum/Puan Modal Ekranı

**Sayfa**: `ReviewModalPage.xaml`  
**ViewModel**: `ReviewModalViewModel.cs`

### Sorumluluklar
- Yorum yazma
- Detaylı puanlama
- Fotoğraf ekleme
- Ziyaret tarihi belirleme

### DTO'lar
- `CreateReviewDto`: Yorum oluşturma
- `ReviewRatingsDto`: Detaylı puanlar

### UI Bileşenleri
- Mekan adı gösterimi
- Genel puan slider (1-5)
- Detaylı puanlama:
  - 🍽️ Yemek Kalitesi
  - 👨‍🍳 Servis Kalitesi
  - 🏠 Atmosfer
  - 💰 Fiyat/Performans
  - 🧼 Temizlik
- Yorum editörü (multiline)
- Ziyaret tarihi seçici
- Fotoğraf ekleme butonu
- Fotoğraf önizleme grid
- Gönder butonu
- İptal butonu

### Navigasyon
- **Gönder** → PlaceDetailPage (geri dön)
- **İptal** → Onay dialogu → PlaceDetailPage

---

## 8️⃣ Gurme Aktivasyon Ekranı

**Sayfa**: `GourmetActivationPage.xaml`  
**ViewModel**: `GourmetActivationViewModel.cs`

### Sorumluluklar
- Gurme başvurusu alma
- Uzmanlık alanı seçimi
- Doğrulama bilgileri toplama

### DTO'lar
- `GourmetActivationRequestDto`: Başvuru bilgileri

### UI Bileşenleri
- Görünen ad Entry
- Biyografi Editor
- Uzmanlık alanları (çoklu seçim):
  - Türk Mutfağı
  - İtalyan Mutfağı
  - Fransız Mutfağı
  - Japon Mutfağı
  - Çin Mutfağı
  - vb...
- Doğrulama tipi Picker:
  - Chef
  - Food Critic
  - Food Blogger
  - Culinary Expert
  - Restaurant Owner
- Deneyim açıklaması Editor
- Belge/sertifika yükleme (gelecek)
- Başvuruyu Gönder butonu
- İptal butonu

### Navigasyon
- **Gönder** → Başarı mesajı → Önceki sayfa
- **İptal** → Önceki sayfa

---

## 9️⃣ Gurme Paneli Ekranı

**Sayfa**: `GourmetPanelPage.xaml`  
**ViewModel**: `GourmetPanelViewModel.cs`

### Sorumluluklar
- Gurme profil bilgilerini gösterme
- İstatistikleri sunma
- Yorumları yönetme

### DTO'lar
- `GourmetDto`: Gurme profil bilgileri
- `GourmetStatsDto`: İstatistikler
- `ReviewDto`: Gurme yorumları

### UI Bileşenleri

#### Gurme Değilse:
- "Gurme Olun!" başlığı
- Açıklama metni
- Başvuru Yap butonu

#### Gurme İse:
- Profil kartı:
  - Profil fotoğrafı
  - Görünen ad
  - Biyografi
  - Doğrulama rozetı
- İstatistikler:
  - 📝 Toplam yorum sayısı
  - 👥 Takipçi sayısı
  - 📍 Ziyaret edilen mekan
  - ⭐ Ortalama puan
- Profili Düzenle butonu
- Yorumlarım listesi
- Takip ettiklerim (gelecek)

### Navigasyon
- **Başvuru Yap** → GourmetActivationPage
- **Yorum Seçimi** → PlaceDetailPage

---

## 🔟 Profil Ekranı

**Sayfa**: `ProfilePage.xaml`  
**ViewModel**: `ProfileViewModel.cs`

### Sorumluluklar
- Kullanıcı profili gösterme
- Yorumları listeleme
- Favori mekanları gösterme

### DTO'lar
- `UserDto`: Kullanıcı bilgileri
- `ReviewDto`: Kullanıcı yorumları
- `PlaceDto`: Favori mekanlar

### UI Bileşenleri
- Profil kartı:
  - Profil fotoğrafı (değiştirilebilir)
  - Ad Soyad
  - Email
- İstatistikler:
  - 📝 Yorum sayısı
  - ❤️ Favori mekan sayısı
- Profili Düzenle butonu
- Ayarlar butonu
- Yorumlarım section:
  - Yorum kartları (liste)
  - Her kart: mekan adı, puan, tarih
- Favori Mekanlarım section:
  - Mekan kartları (liste)
  - Her kart: fotoğraf, ad, puan
- Çıkış Yap butonu

### Navigasyon
- **Ayarlar** → SettingsPage
- **Yorum Seçimi** → PlaceDetailPage
- **Favori Mekan Seçimi** → PlaceDetailPage
- **Çıkış Yap** → Onay dialogu → LoginPage

---

## 1️⃣1️⃣ Ayarlar Ekranı

**Sayfa**: `SettingsPage.xaml`  
**ViewModel**: `SettingsViewModel.cs`

### Sorumluluklar
- Uygulama ayarlarını yönetme
- Kullanıcı tercihlerini kaydetme
- Bildirim ayarları

### DTO'lar
- `UserPreferencesDto`: Kullanıcı tercihleri

### UI Bileşenleri

#### Bildirimler:
- Bildirimleri Etkinleştir (Switch)

#### Konum:
- Konum Servislerini Etkinleştir (Switch)

#### Dil:
- Dil seçici (Picker):
  - Türkçe
  - English
  - Deutsch

#### Favori Mutfaklar:
- Çoklu seçim listesi:
  - Türk
  - İtalyan
  - Fransız
  - Japon
  - Çin
  - vb...

#### Uygulama:
- Önbelleği Temizle
- Hakkında
- Gizlilik Politikası
- Kullanım Koşulları
- Destek

#### Ayarları Kaydet Butonu

### Navigasyon
- **Geri** → ProfilePage
- **Destek** → Email composer

---

## 📊 ViewModel Sorumlulukları Özeti

### BaseViewModel
- IsBusy state yönetimi
- Title property
- IsRefreshing state
- Hata yönetimi (HandleErrorAsync)
- Güvenli async execution (ExecuteSafelyAsync)
- OnAppearing/OnDisappearing lifecycle

### Tüm ViewModel'lar
- CommunityToolkit.Mvvm kullanımı
- ObservableProperty'ler
- RelayCommand'lar
- Dependency Injection ile servis kullanımı
- Navigasyon işlemleri

---

## 🔄 Veri Akışı

```
View (XAML)
    ↕ Data Binding
ViewModel
    ↕ Service çağrıları
Service Layer (Mock)
    ↕ (Gelecekte: API çağrıları)
Backend API
    ↕
Database
```

---

## 🎨 UI/UX Tasarım Prensipleri

### Renk Paleti
- **Primary**: #E74C3C (Kırmızı - Yemek teması)
- **Secondary**: #3498DB (Mavi)
- **Accent**: #F39C12 (Turuncu)
- **Success**: #27AE60 (Yeşil)

### Typography
- **Başlık**: 24-32pt, Bold
- **Alt Başlık**: 18pt, Bold
- **Gövde**: 14pt, Regular
- **Caption**: 12pt, Regular

### Spacing
- Padding: 20px (dış), 15px (iç)
- Margin: 10px (elemanlar arası)
- CornerRadius: 8-12px (kartlar)

### Animasyonlar
- Sayfa geçişleri: Fade + Slide
- Liste elemanları: Fade in
- Buton basma: Scale + Opacity

### Accessibility
- Minimum dokunma alanı: 44x44pt
- Yeterli kontrast oranı
- Ekran okuyucu desteği
- Font ölçeklendirme

---

## 📱 Platform-Specific Notlar

### Android
- Material Design uyumluluğu
- Back button yönetimi
- Status bar renklendirme

### iOS
- Safe Area uyumluluğu
- Navigation bar customization
- Swipe gestures

### Windows
- Keyboard shortcuts
- Window resizing
- Title bar customization

---

## 🚀 Gelecek Özellikler

- [ ] Sosyal medya entegrasyonu
- [ ] Push notifications
- [ ] Offline mode
- [ ] Mekan öneri algoritması
- [ ] Mesajlaşma sistemi
- [ ] Rezervasyon sistemi
- [ ] Ödeme entegrasyonu
- [ ] QR kod tarama
- [ ] Gamification (rozetler, seviyeler)
- [ ] AR menü görüntüleme
