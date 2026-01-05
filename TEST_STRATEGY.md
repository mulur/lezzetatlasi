# Test Stratejisi / Test Strategy

## 1. Genel Bakış / Overview

Bu doküman, Lezzet Atlası projesi için test stratejisini ve kapsamını tanımlar. Proje, kullanıcıların restoranları değerlendirmesine ve GurmeScore algoritması ile puanlamasına olanak tanıyan bir platformdur.

This document defines the test strategy and scope for the Lezzet Atlası project. The project is a platform that allows users to review restaurants and rate them using the GurmeScore algorithm.

## 2. Test Kapsamı / Test Scope

### 2.1 Kapsam İçinde / In Scope

- **GurmeScore Algoritmaları**: Puanlama hesaplamaları, ağırlıklandırma, normalizasyon
- **Rütbe Eşlemesi**: Kullanıcı rütbelerinin hesaplanması ve güncellenmesi
- **API Fonksiyonları**: REST API endpoint'leri, veri doğrulama, hata işleme
- **Invite/Rol Akışı**: Davet sistemi, rol yönetimi, yetkilendirme
- **Abuse Engelleme**: Spam önleme, rate limiting, kötüye kullanım tespiti

### 2.2 Kapsam Dışında / Out of Scope

- UI/UX testleri (bu strateji kapsamında)
- Performans testleri (ayrı bir strateji gerektirir)
- Güvenlik penetrasyon testleri (ayrı bir strateji gerektirir)

## 3. Test Seviyeleri / Test Levels

### 3.1 Unit Tests (Birim Testler)

**Amaç / Purpose**: Her bileşeni izole bir şekilde test etmek.

**Kapsama Hedefi / Coverage Goal**: Minimum %80

**Araçlar / Tools**:
- Jest (JavaScript/TypeScript için)
- pytest (Python için)
- JUnit (Java için)

**Sorumlu / Responsible**: Backend geliştiriciler

### 3.2 Integration Tests (Entegrasyon Testleri)

**Amaç / Purpose**: Bileşenler arası etkileşimleri test etmek.

**Kapsama Hedefi / Coverage Goal**: Tüm kritik akışlar

**Araçlar / Tools**:
- Supertest (API testleri için)
- TestContainers (veritabanı testleri için)

**Sorumlu / Responsible**: Backend ve QA ekipleri

### 3.3 End-to-End Tests (Uçtan Uca Testler)

**Amaç / Purpose**: Tam kullanıcı senaryolarını test etmek.

**Kapsama Hedefi / Coverage Goal**: Ana kullanıcı akışları

**Araçlar / Tools**:
- Cypress veya Playwright

**Sorumlu / Responsible**: QA ekibi

## 4. Test Ortamları / Test Environments

### 4.1 Geliştirme (Development)
- Geliştiricilerin lokal ortamları
- Mock servisler ve test veritabanları

### 4.2 Test (Testing)
- CI/CD pipeline'da otomatik testler
- Gerçek servislere yakın ortam

### 4.3 Staging
- Prodüksiyon öncesi doğrulama
- Prodüksiyonla aynı konfigürasyon

## 5. Test Verileri / Test Data

### 5.1 Test Verisi Stratejisi

- **Gerçek Veri**: Anonimleştirilmiş prodüksiyon verisi (sadece staging)
- **Sentetik Veri**: Özel oluşturulmuş test senaryoları için
- **Mock Veri**: Unit testler için

### 5.2 Veri Yönetimi

- Test verileri versiyon kontrolünde saklanır
- Her test kendi verilerini oluşturmalı (izolasyon)
- Testler sonrası temizlik yapılmalı

## 6. CI/CD Entegrasyonu / CI/CD Integration

### 6.1 Otomatik Test Çalıştırma

```yaml
Pipeline Aşamaları:
1. Kod Push → Unit Testler
2. PR Oluşturma → Unit + Integration Testler
3. Merge → Tüm Testler + E2E
4. Deploy → Smoke Testler
```

### 6.2 Test Başarısızlık Politikası

- Unit test başarısızlığı → Build fail
- Integration test başarısızlığı → Build fail
- E2E test başarısızlığı → Deploy engellenir

## 7. Metrikler ve Raporlama / Metrics and Reporting

### 7.1 Takip Edilecek Metrikler

- **Code Coverage**: %80+ hedefi
- **Test Başarı Oranı**: %95+ hedefi
- **Test Çalışma Süresi**: Maksimum 15 dakika (tüm testler)
- **Flaky Test Oranı**: %5'in altında

### 7.2 Raporlama

- Her PR için test raporu
- Haftalık test metrikleri raporu
- Aylık kalite raporu

## 8. Test Otomasyon Stratejisi / Test Automation Strategy

### 8.1 Otomasyon Önceliği

1. **Yüksek Öncelik**:
   - Kritik iş akışları (GurmeScore hesaplama, abuse engelleme)
   - Regresyon riski yüksek alanlar
   - Sık kullanılan API'ler

2. **Orta Öncelik**:
   - İkincil özellikler
   - Admin işlemleri

3. **Düşük Öncelik**:
   - Nadiren değişen fonksiyonlar
   - Edge case'ler

### 8.2 Manuel Test Gereksinimleri

- Yeni özellikler için keşifsel test
- UI/UX kullanılabilirlik testleri
- Kompleks kullanıcı senaryoları

## 9. Teknik Yapı / Technical Structure

### 9.1 Dizin Yapısı

```
tests/
├── unit/
│   ├── algorithms/
│   │   ├── gurmescore.test.js
│   │   └── ranking.test.js
│   ├── api/
│   │   ├── validation.test.js
│   │   └── error-handling.test.js
│   ├── auth/
│   │   ├── invite.test.js
│   │   └── roles.test.js
│   └── security/
│       ├── rate-limiter.test.js
│       └── abuse-detection.test.js
├── integration/
│   ├── api/
│   │   ├── restaurants.test.js
│   │   ├── reviews.test.js
│   │   └── users.test.js
│   ├── workflows/
│   │   ├── invite-flow.test.js
│   │   └── review-submission.test.js
│   └── security/
│       └── abuse-prevention.test.js
├── e2e/
│   ├── user-journeys/
│   └── critical-paths/
├── fixtures/
│   ├── users.json
│   ├── restaurants.json
│   └── reviews.json
└── helpers/
    ├── test-setup.js
    ├── mock-data.js
    └── assertions.js
```

## 10. Test Yazma Kuralları / Test Writing Guidelines

### 10.1 Genel Kurallar

- Her test bağımsız ve izole olmalı
- Test isimleri açıklayıcı olmalı (Given-When-Then formatı)
- Arrange-Act-Assert (AAA) pattern'i kullanılmalı
- Magic number'lar kullanılmamalı, sabitler tanımlanmalı
- Test kodu production kodu kadar temiz olmalı

### 10.2 Test İsimlendirme

```javascript
// İyi örnek
describe('GurmeScore Calculation', () => {
  it('should calculate score as 85 when all criteria are met perfectly', () => {
    // test implementation
  });
  
  it('should return 0 when restaurant has no reviews', () => {
    // test implementation
  });
});

// Kötü örnek
describe('GurmeScore', () => {
  it('test1', () => {
    // test implementation
  });
});
```

### 10.3 Assertion Best Practices

```javascript
// İyi: Spesifik assertion
expect(score).toBe(85.5);
expect(rank).toBe('Master Chef');

// Kötü: Genel assertion
expect(score).toBeTruthy();
expect(rank).toBeDefined();
```

## 11. Test Bakımı / Test Maintenance

### 11.1 Test Refactoring

- Her sprint'te en az 1 saat test refactoring zamanı ayrılmalı
- Duplicate test kodları ortak helper'lara taşınmalı
- Eski testler düzenli olarak gözden geçirilmeli

### 11.2 Flaky Test Yönetimi

- Flaky test tespit edildiğinde hemen rapor edilmeli
- Skip edilmek yerine düzeltilmeli
- Root cause analizi yapılmalı

## 12. Sorumluluğlar / Responsibilities

### 12.1 Geliştiriciler
- Unit test yazımı
- Integration test yazımı (kendi modülleri için)
- Test coverage'ın korunması

### 12.2 QA Ekibi
- E2E test yazımı
- Test stratejisinin gözden geçirilmesi
- Test metriklerinin takibi

### 12.3 Tech Lead
- Test stratejisinin onaylanması
- Teknik kararların verilmesi
- Code review (testler dahil)

## 13. Başarı Kriterleri / Success Criteria

Proje test stratejisi başarılı sayılır eğer:

1. Code coverage %80'in üzerindeyse
2. CI/CD pipeline'da tüm testler başarılıysa
3. Prodüksiyonda kritik bug sayısı sprint başına 2'den azsa
4. Test çalışma süresi 15 dakikayı geçmiyorsa
5. Flaky test oranı %5'in altındaysa

## 14. Güncellemeler / Updates

Bu doküman düzenli olarak gözden geçirilmeli ve güncellenmelidir:
- Her major release öncesi
- Teknoloji stack değişikliklerinde
- Test metriklerinde önemli değişiklikler olduğunda

---

**Son Güncelleme / Last Updated**: 2026-01-05
**Versiyon / Version**: 1.0
