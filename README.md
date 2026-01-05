# 🍽️ Lezzet Atlası - .NET MAUI Mobile Application

**Lezzet Atlası** (Taste Atlas), kullanıcıların en iyi restoran ve kafeleri keşfetmesini, değerlendirmesini ve paylaşmasını sağlayan modern bir mobil uygulamadır.

## 📱 Özellikler

- ✅ **Onboarding**: İlk kullanım tanıtım ekranları
- ✅ **Authentication**: Kullanıcı girişi ve kaydı
- ✅ **Mekan Keşfi**: Restoran ve kafeleri keşfetme
- ✅ **Harita Görünümü**: Yakındaki mekanları harita üzerinde görüntüleme
- ✅ **Detaylı Bilgiler**: Mekan detayları, fotoğraflar, yorumlar
- ✅ **Yorum Sistemi**: Detaylı puanlama ve yorum yazma
- ✅ **Gurme Paneli**: Gurme kullanıcılar için özel özellikler
- ✅ **Profil Yönetimi**: Kullanıcı profili ve ayarlar

## 🏗️ Mimari

Proje **MVVM (Model-View-ViewModel)** tasarım deseni ile geliştirilmiştir:

- **Models**: DTOs (Data Transfer Objects) - Veri modelleri
- **Views**: XAML sayfaları - Kullanıcı arayüzü
- **ViewModels**: İş mantığı ve veri bağlama
- **Services**: API ve iş servisleri

## 📂 Ekranlar

### 1. Onboarding (Tanıtım)
Yeni kullanıcılara uygulamayı tanıtan 3 sayfalık rehber.

### 2. Authentication (Kimlik Doğrulama)
- **Login**: Giriş ekranı
- **Register**: Kayıt ekranı

### 3. Gourmet Activation (Gurme Aktivasyonu)
Kullanıcıların gurme hesabı açması için başvuru formu.

### 4. Main Explore (Ana Keşfet)
Mekanları keşfetme, arama ve filtreleme ekranı.

### 5. Map (Harita)
Mekanları harita üzerinde görüntüleme.

### 6. Place Detail (Mekan Detayı)
Seçilen mekanın detaylı bilgileri, fotoğrafları ve yorumları.

### 7. Review Modal (Yorum/Puan)
Mekanlara yorum yazma ve detaylı puanlama.

### 8. Gourmet Panel (Gurme Paneli)
Gurme kullanıcılar için özel panel.

### 9. Profile (Profil)
Kullanıcı profili, yorumlar ve favori mekanlar.

### 10. Settings (Ayarlar)
Uygulama ayarları, bildirimler, tercihler.

## 🚀 Kurulum

### Gereksinimler
- .NET 10 SDK
- Visual Studio 2022 veya VS Code
- MAUI Workload

### Kurulum Adımları

```bash
# 1. Projeyi klonlayın
git clone https://github.com/mulur/lezzetatlasi.git
cd lezzetatlasi

# 2. MAUI workload'u yükleyin
dotnet workload install maui

# 3. Bağımlılıkları yükleyin
dotnet restore

# 4. Projeyi derleyin
dotnet build

# 5. Uygulamayı çalıştırın
dotnet build -t:Run -f net10.0-android
```

## 📦 Kullanılan Teknolojiler

- **.NET 10**: Framework
- **MAUI**: Cross-platform UI framework
- **CommunityToolkit.Mvvm**: MVVM helpers
- **CommunityToolkit.Maui**: Ek MAUI kontrolleri
- **CommunityToolkit.Maui.Maps**: Harita desteği

## 📖 Dokümantasyon

Detaylı mimari ve geliştirme dokümantasyonu için [ARCHITECTURE.md](ARCHITECTURE.md) dosyasına bakın.

## 🎨 Ekran Görüntüleri

_(Ekran görüntüleri eklenecek)_

## 🔄 Navigasyon Akışı

```
Başlangıç → Onboarding (ilk kez) → Login → Ana Shell
                                              ├── Keşfet
                                              ├── Harita
                                              ├── Gurme
                                              └── Profil
```

## 📝 TODO

- [ ] Backend API entegrasyonu
- [ ] Gerçek harita kontrolü
- [ ] Push notifications
- [ ] Offline mode
- [ ] Unit testler
- [ ] Sosyal medya paylaşımı

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'feat: Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.

## 📞 İletişim

Proje Link: [https://github.com/mulur/lezzetatlasi](https://github.com/mulur/lezzetatlasi)