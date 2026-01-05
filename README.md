# Lezzet Atlası

Sosyal gurme platformu - Türkiye'nin yeme-içme mekanlarını keşfet, değerlendir ve paylaş.

## 🎯 Proje Hakkında

Lezzet Atlası, kullanıcıların restoranları, kafeleri ve diğer yeme-içme mekanlarını keşfetmelerine, değerlendirmelerine ve paylaşmalarına olanak tanıyan sosyal bir platformdur.

### Temel Özellikler
- 🔐 Davet kodu bazlı üyelik sistemi
- 🏆 Gurme profilleri ve dinamik rütbe sistemi
- 🍽️ Mekan yönetimi (restoranlar, kafeler, barlar)
- 📸 Fotoğraf ve menü paylaşımı
- ⭐ Detaylı değerlendirme ve yorum sistemi
- 💰 Fiyat geçmişi takibi
- 💬 Sosyal etkileşimler (yorumlara tepkiler)

## 📚 Dokümantasyon

### Veritabanı Tasarımı
Kapsamlı veritabanı tasarım dokümanlarına [docs/](./docs/) klasöründen ulaşabilirsiniz:

- **[Database Design](./docs/database-design.md)** - Detaylı veritabanı tasarımı ve analiz (1153 satır)
- **[ERD Diagram](./docs/erd-diagram.md)** - Entity Relationship Diagram (Mermaid formatında)
- **[SQL Schema](./docs/schema.sql)** - Çalıştırılabilir SQL şeması (triggers ve initial data ile)
- **[Docs README](./docs/README.md)** - Doküman rehberi ve hızlı başlangıç

## 🏗️ Mimari

### Veritabanı
- MySQL 5.7+ / MariaDB 10.2+
- 14 normalize edilmiş tablo
- Trigger bazlı otomasyon
- Denormalizasyon stratejisi (performans için)

### Tablolar
- Users, GourmetProfile, InviteCodes
- Places, PlacePhotos, PlaceMenus, MenuItems, PriceHistory
- PlaceRatings, PlaceComments, CommentReactions
- GourmetRanks, GourmetScoreSnapshots, PlaceRatingSummary

## 🚀 Başlarken

### Veritabanı Kurulumu

```bash
# MySQL'de şemayı oluştur
mysql -u root -p < docs/schema.sql

# Docker ile
docker exec -i mysql-container mysql -u root -ppassword < docs/schema.sql
```

## 📊 Gurme Rütbe Sistemi

Kullanıcılar aktivitelerine göre dinamik olarak skor kazanır:

```
Total Score = Review Score (40%) + Quality Score (30%) + 
              Engagement Score (20%) + Contribution Score (10%)
```

### Rütbeler
1. 🧭 **Yeni Keşifçi** (0-100 puan)
2. 🍴 **Meraklı Damak** (100-300 puan)
3. 🔍 **Lezzet Avcısı** (300-600 puan)
4. ❤️ **Gastronomi Tutkunu** (600-1000 puan)
5. ⭐ **Gurme Uzman** (1000-2000 puan)
6. 👑 **Master Gurme** (2000+ puan)

## 🤝 Katkıda Bulunma

Projeye katkıda bulunmak için:
1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

Bu proje [MIT lisansı](LICENSE) altında lisanslanmıştır.

## 📧 İletişim

Proje Sahibi - [@mulur](https://github.com/mulur)

Proje Linki: [https://github.com/mulur/lezzetatlasi](https://github.com/mulur/lezzetatlasi)