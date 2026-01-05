# Lezzet Atlası - Doküman Rehberi

Bu klasör, Lezzet Atlası uygulamasının veritabanı tasarım dokümanlarını içerir.

## 📚 Dokümanlar

### 1. [database-design.md](./database-design.md)
**Kapsamlı Veritabanı Tasarım Dokümanı** (1153 satır)

Bu doküman şunları içerir:
- ✅ Genel proje bakışı ve özellikler
- ✅ ASCII formatında ERD diyagramı
- ✅ 14 tablonun detaylı şemaları ve açıklamaları
- ✅ İndeksleme stratejileri ve performans optimizasyonları
- ✅ Gurme rütbe sistemi ve dinamik skor hesaplama
- ✅ Rating/Comment tablo yapısı analizi (avantaj/dezavantaj)
- ✅ İş kuralları ve veri bütünlüğü

**Ne zaman kullanmalı:**
- Projenin veritabanı mimarisini anlamak için
- Tasarım kararlarının gerekçelerini öğrenmek için
- Gurme skor sistemini incelemek için

### 2. [erd-diagram.md](./erd-diagram.md)
**Entity Relationship Diagram** (333 satır)

Bu doküman şunları içerir:
- ✅ Mermaid formatında interaktif ERD diyagramı
- ✅ Tüm tablo alanları ve veri tipleri
- ✅ İlişki kardinaliteleri tablosu (1:1, 1:N, N:1)
- ✅ Unique, Primary Key, Foreign Key kısıtlamaları
- ✅ Cascade davranışları (ON DELETE CASCADE/RESTRICT/SET NULL)
- ✅ İş kuralları ve denormalizasyon stratejisi

**Ne zaman kullanmalı:**
- Görsel tablo ilişkilerini görmek için
- GitHub'da otomatik render edilen diyagram için
- VS Code veya diğer Mermaid destekli editörlerde

**Nasıl görüntülenir:**
- GitHub üzerinde otomatik render edilir
- [Mermaid Live Editor](https://mermaid.live/) kullanabilirsiniz
- VS Code için Mermaid eklentisi kurabilirsiniz

### 3. [schema.sql](./schema.sql)
**Çalıştırılabilir SQL Şeması** (527 satır)

Bu dosya şunları içerir:
- ✅ Tüm tabloların CREATE TABLE komutları
- ✅ Primary Key, Foreign Key, Index tanımları
- ✅ Trigger tanımları (rating ekleme, fiyat güncellemesi)
- ✅ Stored Procedure örnekleri
- ✅ View tanımları (mekan listesi, liderlik tablosu)
- ✅ Initial data (GourmetRanks tablosu için)

**Ne zaman kullanmalı:**
- Veritabanını sıfırdan oluşturmak için
- MySQL/MariaDB sunucusunda test etmek için
- Trigger ve stored procedure'leri incelemek için

**Nasıl çalıştırılır:**
```bash
# MySQL'de
mysql -u root -p < schema.sql

# veya interaktif olarak
mysql -u root -p
source /path/to/schema.sql

# Docker ile
docker exec -i mysql-container mysql -u root -ppassword < schema.sql
```

## 🎯 Hızlı Başlangıç

### Veritabanını Oluşturmak İçin:
1. **schema.sql** dosyasını MySQL/MariaDB sunucunuzda çalıştırın
2. Otomatik olarak:
   - `lezzetatlasi` veritabanı oluşturulur
   - 14 tablo oluşturulur
   - İndeksler ve foreign key'ler tanımlanır
   - Trigger'lar aktif hale gelir
   - 6 gurme rütbesi eklenir

### Tasarımı Anlamak İçin:
1. **database-design.md** dosyasını okuyun (baştan sona)
2. **erd-diagram.md** dosyasındaki görsel diyagramı inceleyin
3. İhtiyaç duyduğunuzda **schema.sql** dosyasına bakın

## 📊 Veritabanı İstatistikleri

### Tablolar (14 adet)
- **Users & Auth**: Users, InviteCodes
- **Gourmet System**: GourmetProfile, GourmetRanks, GourmetScoreSnapshots
- **Places**: Places, PlacePhotos, PlaceMenus, MenuItems, PriceHistory
- **Reviews**: PlaceRatings, PlaceComments, CommentReactions
- **Aggregation**: PlaceRatingSummary

### Toplam
- **Alanlar**: ~120+ alan
- **İndeksler**: ~50+ indeks
- **Foreign Keys**: ~25+ FK ilişkisi
- **Triggers**: 2 adet (rating insert, price update)
- **Views**: 2 adet (places_detailed, gourmet_leaderboard)

## 🔑 Önemli Kararlar

### 1. Rating/Comment Ayrı Tablolar
**Karar:** PlaceRatings ve PlaceComments ayrı tablolar olarak tasarlandı

**Gerekçe:**
- ✅ Yorumsuz hızlı rating yapılabilir
- ✅ Yorumlar bağımsız modere edilebilir
- ✅ Performance (rating sorguları daha hafif)
- ✅ Ölçeklenebilirlik
- ✅ Gelecek özellikleri için esneklik

Detaylı analiz için `database-design.md` dosyasındaki "Rating/Comment Tablo Yapısı Analizi" bölümüne bakın.

### 2. Dinamik Gurme Skor Sistemi
**Formül:**
```
total_score = (review_score × 0.40) + 
              (quality_score × 0.30) + 
              (engagement_score × 0.20) + 
              (contribution_score × 0.10)
```

**İmplementasyon:** Trigger bazlı (gerçek zamanlı) veya Batch processing (günlük)

Detaylı açıklama için `database-design.md` dosyasındaki "Gurme Rütbe Sistemi" bölümüne bakın.

### 3. Denormalizasyon
**Tablolar:**
- `Places.avg_rating` ve `total_ratings`
- `PlaceRatingSummary` (tüm istatistikler)

**Gerekçe:** Sık sorgulanan verilerin performansı için

## 🛠️ Teknoloji Detayları

### Veritabanı
- MySQL 5.7+ veya MariaDB 10.2+
- InnoDB Storage Engine
- UTF-8 (utf8mb4) karakter seti
- JSON sütun desteği (benefits)

### Özellikler
- Auto-increment Primary Keys
- Referential Integrity (FK constraints)
- Cascade behaviors
- Check constraints (rating 1-5)
- Fulltext indexes (arama için)
- Composite indexes (performans için)
- Trigger automation

## 📈 Gelecek Geliştirmeler

### Planlanmış İyileştirmeler
- [ ] Elasticsearch entegrasyonu (gelişmiş arama)
- [ ] Redis cache layer (rating summary için)
- [ ] Time-series database (fiyat geçmişi için)
- [ ] Sharding stratejisi (horizontal scaling)
- [ ] Read replica setup (okuma yükü için)
- [ ] PostGIS (spatial queries için)

## 🤝 Katkıda Bulunma

Veritabanı tasarımı hakkında öneriniz varsa:
1. Issue açın
2. Tasarım değişikliği önerisi yapın
3. Performans iyileştirmesi paylaşın

## 📝 Lisans

Bu dokümanlar Lezzet Atlası projesi kapsamındadır.

---

**Son Güncelleme:** 2026-01-05  
**Versiyon:** 1.0  
**Hazırlayan:** Lezzet Atlası Geliştirme Ekibi
