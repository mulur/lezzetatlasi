# GurmeScore: İş Kuralları ve Algoritma Dokümantasyonu

## İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [İş Kuralları](#iş-kuralları)
3. [GurmeScore Hesaplama Algoritması](#gurmescore-hesaplama-algoritması)
4. [Ağırlıklandırma Mekanizması](#ağırlıklandırma-mekanizması)
5. [Benzerlik ve Pencere Analizi](#benzerlik-ve-pencere-analizi)
6. [Manipülasyona Dirençli Stratejiler](#manipülasyona-dirençli-stratejiler)
7. [Soğuk Başlangıç Yönetimi](#soğuk-başlangıç-yönetimi)
8. [Minimum Oy Koşulları](#minimum-oy-koşulları)
9. [Rütbe Belirleme Mantığı](#rütbe-belirleme-mantığı)
10. [Gurme Puanları Üstte Algoritması](#gurme-puanları-üstte-algoritması)
11. [Formüller ve Örnekler](#formüller-ve-örnekler)

---

## Genel Bakış

**GurmeScore**, lezzet atlası platformunda restoran ve yemek kalitesini değerlendirmek için kullanılan gelişmiş bir puanlama sistemidir. Bu sistem, basit ortalama puanlamanın ötesine geçerek, kullanıcı güvenilirliği, oy çeşitliliği ve manipülasyon direnci gibi faktörleri dikkate alır.

### Temel Hedefler
- **Adil Puanlama**: Tüm işletmelere eşit değerlendirme fırsatı
- **Kalite Odaklılık**: Gerçek gurme deneyimini yansıtma
- **Manipülasyon Direnci**: Sahte oylar ve kötü niyetli davranışlara karşı koruma
- **Uzman Görüşü Önceliği**: Deneyimli gurmelerin görüşlerine daha fazla ağırlık verme

---

## İş Kuralları

### 1. Kullanıcı Kategorileri

Kullanıcılar, aktivite seviyelerine ve güvenilirliklerine göre kategorize edilir:

- **Gurme Kullanıcı**: 50+ değerlendirme, yüksek tutarlılık, çeşitli mekanlar
- **Aktif Kullanıcı**: 20-49 değerlendirme, orta düzey deneyim
- **Normal Kullanıcı**: 5-19 değerlendirme
- **Yeni Kullanıcı**: 0-4 değerlendirme

### 2. Değerlendirme Kriterleri

Her değerlendirme aşağıdaki boyutları içerir:
- **Lezzet Puanı** (0-10): Yemeğin tat kalitesi
- **Sunum Puanı** (0-10): Görsel sunum
- **Servis Puanı** (0-10): Hizmet kalitesi
- **Fiyat/Performans** (0-10): Değer algısı
- **Ambiyans** (0-10): Mekan atmosferi

### 3. Veri Bütünlüğü Kuralları

- Her kullanıcı bir işletmeye sadece bir değerlendirme yapabilir
- Değerlendirmeler geri alınamaz ancak düzenlenebilir
- Düzenleme geçmişi sistem tarafından tutulur
- Şüpheli aktiviteler otomatik olarak işaretlenir

---

## GurmeScore Hesaplama Algoritması

GurmeScore, çoklu faktörlü bir ağırlıklandırma sistemi kullanır. Temel formül:

```
GurmeScore = (ΣW × Bayesian_Weighted_Average) × Quality_Multiplier × Confidence_Factor
```

### Adım Adım Hesaplama

#### 1. Ham Ortalama Hesaplama
```
Raw_Average = Σ(Puan_i) / n
```
Burada:
- `Puan_i`: i'inci kullanıcının verdiği puan
- `n`: Toplam oy sayısı

#### 2. Bayesian Ağırlıklı Ortalama
```
Bayesian_Score = (C × m + Σ(Puan_i)) / (C + n)
```
Burada:
- `C`: Güven katsayısı (varsayılan: 25 oy)
- `m`: Platform geneli ortalama puan (varsayılan: 7.0)
- `n`: İşletmenin aldığı toplam oy sayısı

Bu formül, az oyu olan işletmelerin anormal yüksek/düşük puanlarını dengeleyerek soğuk başlangıç problemini çözer.

#### 3. Kullanıcı Ağırlıklandırması
Her kullanıcının oyu, güvenilirlik seviyesine göre ağırlıklandırılır:

```
Weighted_Score = Σ(Puan_i × Kullanıcı_Ağırlığı_i) / Σ(Kullanıcı_Ağırlığı_i)
```

**Kullanıcı Ağırlık Değerleri:**
- Gurme Kullanıcı: 3.0
- Aktif Kullanıcı: 2.0
- Normal Kullanıcı: 1.5
- Yeni Kullanıcı: 1.0

#### 4. Nihai GurmeScore Hesaplama
```
GurmeScore = (0.6 × Weighted_Score + 0.4 × Bayesian_Score) × Quality_Multiplier × Confidence_Factor
```

---

## Ağırlıklandırma Mekanizması

### Kullanıcı Güvenilirlik Skoru

Kullanıcının güvenilirlik skoru aşağıdaki faktörlerle hesaplanır:

```
Güvenilirlik_Skoru = (Activity_Score × 0.4) + (Consistency_Score × 0.3) + (Diversity_Score × 0.2) + (Tenure_Score × 0.1)
```

#### Activity Score (Aktivite Puanı)
```
Activity_Score = min(Değerlendirme_Sayısı / 100, 1.0)
```

#### Consistency Score (Tutarlılık Puanı)
```
Consistency_Score = 1 - (Std_Deviation / 10)
```
- Kullanıcının verdiği puanların standart sapması düşükse tutarlılık yüksektir

#### Diversity Score (Çeşitlilik Puanı)
```
Diversity_Score = min(Benzersiz_İşletme_Sayısı / 50, 1.0)
```
- Farklı türde ve konumdaki işletmeleri değerlendirme

#### Tenure Score (Kıdem Puanı)
```
Tenure_Score = min(Üyelik_Günü / 365, 1.0)
```

---

## Benzerlik ve Pencere Analizi

### Zaman Penceresi Ağırlıklandırması

Yakın zamandaki değerlendirmeler daha fazla ağırlık alır:

```
Zaman_Ağırlığı = e^(-λ × Gün_Farkı)
```
Burada:
- `λ`: Zaman azalma katsayısı (varsayılan: 0.002)
- `Gün_Farkı`: Değerlendirme tarihinden bugüne kadar geçen gün sayısı

**Örnekler:**
- 0 gün: Ağırlık = 1.00 (tam ağırlık)
- 180 gün: Ağırlık = 0.70
- 365 gün: Ağırlık = 0.49
- 730 gün: Ağırlık = 0.24

### Benzerlik Analizi

Şüpheli oy kümelenmelerini tespit etmek için:

```
Benzerlik_Skoru = 1 / (1 + Σ|Puan_i - Puan_j| / n²)
```

Eğer bir zaman penceresinde (örn. 7 gün) çok sayıda benzer puan gelirse (Benzerlik_Skoru > 0.95), bu oylar otomatik olarak işaretlenir ve ağırlıkları azaltılır:

```
Düzeltilmiş_Ağırlık = Orijinal_Ağırlık × (1 - Benzerlik_Skoru × 0.5)
```

---

## Manipülasyona Dirençli Stratejiler

### 1. Ani Puan Değişimi Tespiti

```
Değişim_Oranı = |Yeni_Ortalama - Eski_Ortalama| / Eski_Ortalama
```

Eğer `Değişim_Oranı > 0.15` (15% değişim) bir hafta içinde gerçekleşirse:
- Yeni oylar karantinaya alınır
- Manuel inceleme başlatılır
- Geçici olarak Bayesian ortalamaya daha fazla ağırlık verilir

### 2. IP ve Cihaz Analizi

Aynı IP veya cihazdan gelen çoklu değerlendirmeler:
- Otomatik olarak işaretlenir
- Sadece ilk değerlendirme tam ağırlık alır
- Sonraki değerlendirmeler 0.2 ağırlıkla hesaplanır

### 3. Değerlendirme Zamanlaması Analizi

Kısa sürede çok sayıda değerlendirme (örn. 1 saat içinde 10+ değerlendirme):
```
Zamanlama_Cezası = max(0.3, 1 - (Oy_Sayısı_Saat / 5))
```

### 4. Aşırı Uç Değer Filtreleme

İstatistiksel aykırı değer tespiti:
```
Aykırı_Değer = |Puan - Medyan| > 2 × IQR
```
Burada `IQR` (Interquartile Range): 3. çeyrek - 1. çeyrek

Aykırı değerler:
- 0.5 ağırlıkla hesaplanır
- Gurme kullanıcılardan geliyorsa tam ağırlık korunur

---

## Soğuk Başlangıç Yönetimi

Yeni işletmeler için özel stratejiler:

### 1. Bootstrap Periyodu (0-10 Oy)

```
Bootstrap_Score = (Gerçek_Ortalama × 0.3) + (Platform_Ortalaması × 0.7)
```

Bu yaklaşım, ilk birkaç oy ile işletmenin aşırı yüksek veya düşük puan almasını engeller.

### 2. Hızlandırılmış Güven Kazanımı

Gurme kullanıcılardan gelen ilk oylar daha fazla ağırlık alır:
```
Bootstrap_Ağırlık = Normal_Ağırlık × 1.5
```

### 3. Kademeli Geçiş (11-25 Oy)

```
Geçiş_Faktörü = (Oy_Sayısı - 10) / 15
Final_Score = (Bootstrap_Score × (1 - Geçiş_Faktörü)) + (Normal_Score × Geçiş_Faktörü)
```

### 4. Olgunluk Durumu (25+ Oy)

Bu noktadan sonra normal GurmeScore hesaplama algoritması tam olarak devreye girer.

---

## Minimum Oy Koşulları

### Görünürlük Eşikleri

İşletmelerin listelerde görünebilmesi için minimum gereksinimler:

| Liste Türü | Minimum Oy | Minimum GurmeScore | Ek Gereksinim |
|-----------|-----------|-------------------|---------------|
| Genel Liste | 3 oy | 5.0 | - |
| Önerilen | 10 oy | 7.5 | 2+ Gurme oyu |
| En İyiler | 25 oy | 8.5 | 5+ Gurme oyu |
| Premium | 50 oy | 9.0 | 10+ Gurme oyu |

### Güven Seviyesi

```
Güven_Seviyesi = min(Oy_Sayısı / 100, 1.0) × Gurme_Oy_Oranı
```

Burada:
- `Gurme_Oy_Oranı = Gurme_Oyları / Toplam_Oy`

**Güven Seviyesi Kategorileri:**
- Yüksek: > 0.7 (Yeşil rozet)
- Orta: 0.4-0.7 (Sarı rozet)
- Düşük: < 0.4 (Gri rozet)

---

## Rütbe Belirleme Mantığı

İşletmeler, GurmeScore'larına göre rütbelere ayrılır:

### Rütbe Kategorileri

```
Rütbe = f(GurmeScore, Oy_Sayısı, Gurme_Oy_Oranı)
```

#### 1. Elit Gurme (🌟🌟🌟)
- GurmeScore ≥ 9.0
- Minimum 50 oy
- Gurme oy oranı ≥ 20%
- Güven seviyesi: Yüksek

#### 2. Üstün Kalite (🌟🌟)
- GurmeScore: 8.0-8.9
- Minimum 25 oy
- Gurme oy oranı ≥ 15%
- Güven seviyesi: Orta-Yüksek

#### 3. Kaliteli (🌟)
- GurmeScore: 7.0-7.9
- Minimum 10 oy
- Gurme oy oranı ≥ 10%

#### 4. İyi
- GurmeScore: 6.0-6.9
- Minimum 5 oy

#### 5. Orta
- GurmeScore: 5.0-5.9
- Minimum 3 oy

#### 6. Değerlendirme Bekliyor
- Oy sayısı < 3

### Rütbe Yükseltme Koşulları

Bir üst rütbeye geçiş için:
```
Yükseltme_Puanı = (GurmeScore - Mevcut_Rütbe_Alt_Sınır) / (Üst_Rütbe_Alt_Sınır - Mevcut_Rütbe_Alt_Sınır)
```

Yükseltme gerçekleşir eğer:
- `Yükseltme_Puanı ≥ 0.8` (rütbenin %80'ine ulaşılmış)
- Minimum oy koşulu sağlanıyor
- Son 30 günde en az 5 yeni değerlendirme alınmış

---

## Gurme Puanları Üstte Algoritması

Bu algoritma, deneyimli gurmelerin değerlendirdiği işletmeleri listelerin üst sıralarına taşır.

### Gurme Boost Faktörü

```
Gurme_Boost = 1 + (Gurme_Oy_Oranı × Gurme_Ağırlık_Katsayısı)
```

Burada:
- `Gurme_Oy_Oranı`: Toplam oylar içinde gurme oylarının oranı
- `Gurme_Ağırlık_Katsayısı`: Varsayılan 0.25

### Sıralama Algoritması

İşletmeler şu formüle göre sıralanır:

```
Sıralama_Skoru = GurmeScore × Gurme_Boost × Aktiflik_Faktörü
```

#### Aktiflik Faktörü
```
Aktiflik_Faktörü = 1 + (Son_30_Gün_Oy_Sayısı / Toplam_Oy) × 0.15
```

Bu faktör, sürekli olarak yeni değerlendirmeler alan işletmelere küçük bir avantaj sağlar.

### Adil Rekabet Mekanizması

Gurme boost'u aşırı avantaj sağlamaması için:
- Maksimum Gurme_Boost = 1.30 (maksimum %30 artış)
- Gurme oy oranı > 0.5 ise artış yavaşlar: `Gurme_Boost = 1.25 + (Gurme_Oy_Oranı - 0.5) × 0.1`

### Dinamik Sıralama

Kullanıcıya göre kişiselleştirilmiş sıralama:

```
Kişisel_Sıralama_Skoru = Sıralama_Skoru × Tercih_Uyum_Faktörü
```

Burada `Tercih_Uyum_Faktörü`, kullanıcının geçmiş beğenileri ve mutfak tercihleri ile işletmenin eşleşme derecesidir.

---

## Formüller ve Örnekler

### Örnek 1: Yeni Bir Restoran

**Durum:**
- İşletme: "Lezzet Durağı"
- Toplam oy: 5
- Oylar: [9.0, 8.5, 9.5, 8.0, 9.0]
- Gurme oy sayısı: 2
- Platform ortalaması: 7.0
- Güven katsayısı (C): 25

**Adım 1: Ham Ortalama**
```
Raw_Average = (9.0 + 8.5 + 9.5 + 8.0 + 9.0) / 5 = 8.8
```

**Adım 2: Bayesian Ağırlıklı Ortalama**
```
Bayesian_Score = (25 × 7.0 + 44.0) / (25 + 5)
                = (175 + 44) / 30
                = 219 / 30
                = 7.3
```

**Adım 3: Kullanıcı Ağırlıklı Ortalama**
Diyelim ki oyların ağırlıkları: [3.0, 3.0, 1.0, 1.5, 1.0] (2 gurme, 1 yeni, 1 normal, 1 yeni)

```
Weighted_Score = (9.0×3.0 + 8.5×3.0 + 9.5×1.0 + 8.0×1.5 + 9.0×1.0) / (3.0 + 3.0 + 1.0 + 1.5 + 1.0)
               = (27.0 + 25.5 + 9.5 + 12.0 + 9.0) / 9.5
               = 83.0 / 9.5
               = 8.74
```

**Adım 4: Bootstrap Faktörü (0-10 oy için)**
```
Bootstrap_Score = (8.74 × 0.3) + (7.0 × 0.7)
                = 2.62 + 4.9
                = 7.52
```

**Adım 5: Güven Faktörü**
```
Güven_Faktörü = min(5 / 100, 1.0) × (2 / 5)
              = 0.05 × 0.4
              = 0.02
Güven_Çarpanı = 1 + (Güven_Faktörü × 0.1)
              = 1.002
```

**Adım 6: Nihai GurmeScore**
```
GurmeScore = Bootstrap_Score × Güven_Çarpanı
           = 7.52 × 1.002
           = 7.54
```

**Sonuç:** Restoran "Kaliteli" rütbesinde başlar ve daha fazla oy topladıkça puanı 8.7'ye yaklaşacaktır.

---

### Örnek 2: Olgun Bir Restoran

**Durum:**
- İşletme: "Gurme Köşe"
- Toplam oy: 127
- Ham ortalama: 8.9
- Gurme oy sayısı: 42 (oran: 0.33)
- Ağırlıklı ortalama: 9.1
- Son 30 gündeki oy: 8

**Adım 1: Bayesian Ağırlıklı Ortalama**
```
Bayesian_Score = (25 × 7.0 + 127 × 8.9) / (25 + 127)
                = (175 + 1130.3) / 152
                = 1305.3 / 152
                = 8.59
```

**Adım 2: Birleşik Skor**
```
Combined_Score = (0.6 × 9.1 + 0.4 × 8.59)
               = 5.46 + 3.44
               = 8.90
```

**Adım 3: Gurme Boost**
```
Gurme_Boost = 1 + (0.33 × 0.25)
            = 1 + 0.0825
            = 1.0825
```

**Adım 4: Aktiflik Faktörü**
```
Aktiflik_Faktörü = 1 + (8 / 127) × 0.15
                 = 1 + 0.0094
                 = 1.0094
```

**Adım 5: Güven Faktörü**
```
Güven_Seviyesi = min(127 / 100, 1.0) × 0.33
               = 1.0 × 0.33
               = 0.33 (Düşük-Orta)
Güven_Çarpanı = 1.00 (olgun işletmeler için nötr)
```

**Adım 6: Nihai GurmeScore**
```
GurmeScore = 8.90 × 1.00
           = 8.90
```

**Adım 7: Sıralama Skoru**
```
Sıralama_Skoru = 8.90 × 1.0825 × 1.0094
               = 9.72
```

**Sonuç:** Restoran "Üstün Kalite" (🌟🌟) rütbesindedir ve listelerde üst sıralarda yer alır.

---

### Örnek 3: Manipülasyon Girişimi

**Durum:**
- İşletme: "Yeni Mekan"
- Mevcut durum: 15 oy, ortalama 6.8
- Ani gelişme: 1 gün içinde 20 yeni oy (hepsi 10.0)
- Yeni oyların %90'ı aynı IP bloğundan

**Adım 1: Ani Değişim Tespiti**
```
Eski_Ortalama = 6.8
Yeni_Ham_Ortalama = (15 × 6.8 + 20 × 10.0) / 35
                  = (102 + 200) / 35
                  = 8.63

Değişim_Oranı = |8.63 - 6.8| / 6.8
              = 1.83 / 6.8
              = 0.269 (26.9%)
```
**Sonuç:** %15'in üzerinde değişim - karantina aktivasyonu!

**Adım 2: IP/Cihaz Cezası**
18 oy (%90) aynı IP'den geldi:
```
Düzeltilmiş_Ağırlık = 0.2 × 18 + 1.0 × 2
                    = 3.6 + 2.0
                    = 5.6 (20 yerine)
```

**Adım 3: Zamanlama Cezası**
```
Zamanlama_Cezası = max(0.3, 1 - (20 / 5))
                 = max(0.3, 1 - 4)
                 = max(0.3, -3)
                 = 0.3
```

**Adım 4: Düzeltilmiş Ortalama**
```
Düzeltilmiş_Skor = (15 × 6.8 + 5.6 × 10.0 × 0.3) / (15 + 5.6)
                 = (102 + 16.8) / 20.6
                 = 118.8 / 20.6
                 = 5.77
```

**Adım 5: Karantina Altında GurmeScore**
Bayesian ağırlığı artırılır (C = 50 yerine 25):
```
Karantina_Score = (50 × 7.0 + 118.8) / (50 + 20.6)
                = (350 + 118.8) / 70.6
                = 468.8 / 70.6
                = 6.64
```

**Sonuç:** Manipülasyon girişimi başarısız! Puan 8.63 yerine 6.64'te kaldı. Manuel inceleme bekliyor.

---

### Örnek 4: Zaman Ağırlıklandırması

**Durum:**
- İşletme: "Klasik Lezzet"
- 5 değerlendirme farklı zamanlarda:
  - Bugün: 9.0
  - 6 ay önce: 8.5
  - 1 yıl önce: 7.0
  - 2 yıl önce: 8.0
  - 3 yıl önce: 9.5

**Adım 1: Zaman Ağırlıkları** (λ = 0.002)
```
Ağırlık_0   = e^(-0.002 × 0)   = 1.00
Ağırlık_180 = e^(-0.002 × 180) = 0.70
Ağırlık_365 = e^(-0.002 × 365) = 0.48
Ağırlık_730 = e^(-0.002 × 730) = 0.23
Ağırlık_1095 = e^(-0.002 × 1095) = 0.11
```

**Adım 2: Zaman Ağırlıklı Ortalama**
```
Zaman_Ağırlıklı = (9.0×1.00 + 8.5×0.70 + 7.0×0.48 + 8.0×0.23 + 9.5×0.11) / (1.00 + 0.70 + 0.48 + 0.23 + 0.11)
                = (9.0 + 5.95 + 3.36 + 1.84 + 1.045) / 2.52
                = 21.195 / 2.52
                = 8.41
```

**Adım 3: Basit Ortalama (Karşılaştırma)**
```
Basit_Ortalama = (9.0 + 8.5 + 7.0 + 8.0 + 9.5) / 5
               = 42.0 / 5
               = 8.40
```

**Sonuç:** Zaman ağırlıklandırması, son değerlendirmelere daha fazla önem vererek mevcut kaliteyi daha iyi yansıtır. Bu örnekte fark minimal çünkü en yeni puan da en eski puana yakın.

---

## Sonuç ve En İyi Uygulamalar

### Sistemin Güçlü Yönleri

1. **Çok Boyutlu Değerlendirme**: Sadece puan değil, kullanıcı güvenilirliği, zaman ve davranış analizi
2. **Manipülasyon Direnci**: Çoklu katmanlı koruma mekanizmaları
3. **Adil Başlangıç**: Yeni işletmeler için dengeli yaklaşım
4. **Kalite Odaklılık**: Gurme kullanıcıların görüşlerine öncelik
5. **Dinamik Adaptasyon**: Zaman içinde değişen koşullara uyum

### İşletmeler İçin Öneriler

- **Tutarlı Kalite**: En iyi skor stratejisi, sürekli yüksek kalite sunmaktır
- **Gurme İlgisi**: Deneyimli gurmeleri çekmek için özel etkinlikler
- **Aktif Katılım**: Değerlendirmelere nazik ve profesyonel yanıtlar
- **Şeffaflık**: Menü, fiyat ve hizmet konusunda açık iletişim

### Gelecek Geliştirmeler

- Makine öğrenmesi ile geliştirilmiş manipülasyon tespiti
- Sezonsal ve mekan bazlı dinamik ağırlıklandırma
- Sosyal ağ analizi ile güven skorlarının iyileştirilmesi
- Kişiselleştirilmiş öneri algoritmaları

---

## Ek Kaynaklar

- **API Dokümantasyonu**: GurmeScore hesaplama endpoint'leri
- **Veri Modeli**: Veritabanı şeması ve ilişkiler
- **Test Senaryoları**: Birim ve entegrasyon testleri
- **Performans Metrikleri**: Sistem performans analizi

---

**Son Güncelleme:** 2026-01-05  
**Versiyon:** 1.0.0  
**Lisans:** Özel - Lezzet Atlası Platformu

