# Test Senaryoları / Test Scenarios

## 1. GurmeScore Algoritmaları - Unit Test Senaryoları

### 1.1 Temel Skor Hesaplama / Basic Score Calculation

#### Test Case 1.1.1: Mükemmel Değerlendirme
**Given**: Bir restoran için tüm kriterlerde maksimum puanlar verilmiş  
**When**: GurmeScore hesaplanır  
**Then**: Skor 100 olmalı

```javascript
describe('GurmeScore - Basic Calculation', () => {
  it('should return 100 for perfect ratings across all criteria', () => {
    const review = {
      taste: 5.0,
      service: 5.0,
      ambiance: 5.0,
      priceValue: 5.0,
      cleanliness: 5.0
    };
    
    const score = calculateGurmeScore(review);
    expect(score).toBe(100);
  });
});
```

#### Test Case 1.1.2: Sıfır Değerlendirme
**Given**: Bir restoran için hiç değerlendirme yok  
**When**: GurmeScore hesaplanır  
**Then**: Skor 0 veya null olmalı

```javascript
it('should return 0 when no reviews exist', () => {
  const reviews = [];
  const score = calculateGurmeScore(reviews);
  expect(score).toBe(0);
});
```

#### Test Case 1.1.3: Kısmi Değerlendirme
**Given**: Bazı kriterler doldurulmamış  
**When**: GurmeScore hesaplanır  
**Then**: Sadece doldurulmuş kriterler üzerinden hesaplama yapılmalı

```javascript
it('should calculate score only from provided criteria', () => {
  const review = {
    taste: 4.0,
    service: 3.5,
    // ambiance, priceValue, cleanliness not provided
  };
  
  const score = calculateGurmeScore(review);
  expect(score).toBeGreaterThan(0);
  expect(score).toBeLessThan(100);
});
```

### 1.2 Ağırlıklı Ortalama / Weighted Average

#### Test Case 1.2.1: Farklı Ağırlıklar
**Given**: Her kriterin farklı ağırlığı var (örn: taste: %40, service: %25, vb.)  
**When**: GurmeScore hesaplanır  
**Then**: Ağırlıklı ortalama doğru hesaplanmalı

```javascript
it('should apply correct weights to different criteria', () => {
  const review = {
    taste: 5.0,      // weight: 0.4
    service: 3.0,    // weight: 0.25
    ambiance: 2.0,   // weight: 0.15
    priceValue: 4.0, // weight: 0.1
    cleanliness: 5.0 // weight: 0.1
  };
  
  const expectedScore = (5.0 * 0.4) + (3.0 * 0.25) + (2.0 * 0.15) + 
                        (4.0 * 0.1) + (5.0 * 0.1);
  
  const score = calculateGurmeScore(review);
  expect(score).toBeCloseTo(expectedScore * 20, 1); // *20 to scale to 100
});
```

#### Test Case 1.2.2: Ağırlık Toplamı Kontrolü
**Given**: Tüm ağırlıklar tanımlı  
**When**: Ağırlıklar toplanır  
**Then**: Toplam 1.0 (veya %100) olmalı

```javascript
it('should ensure all weights sum to 1.0', () => {
  const weights = getScoreWeights();
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  expect(sum).toBeCloseTo(1.0, 2);
});
```

### 1.3 Normalizasyon / Normalization

#### Test Case 1.3.1: Aykırı Değer Eleme
**Given**: Çok düşük veya çok yüksek aykırı değerler var  
**When**: GurmeScore hesaplanır  
**Then**: Aykırı değerler hesaplamayı olumsuz etkilememeli

```javascript
it('should handle outlier reviews appropriately', () => {
  const reviews = [
    { taste: 5.0, service: 5.0 }, // normal
    { taste: 5.0, service: 4.5 }, // normal
    { taste: 1.0, service: 1.0 }, // outlier
    { taste: 4.5, service: 5.0 }, // normal
  ];
  
  const scoreWithOutlier = calculateAverageScore(reviews);
  const scoreWithoutOutlier = calculateAverageScore(reviews.slice(0, 3));
  
  // Score should not drastically change due to one outlier
  expect(Math.abs(scoreWithOutlier - scoreWithoutOutlier)).toBeLessThan(10);
});
```

#### Test Case 1.3.2: Minimum Değerlendirme Sayısı
**Given**: Çok az değerlendirme var (örn: 1-2)  
**When**: GurmeScore hesaplanır  
**Then**: Güven faktörü düşük olmalı veya "yetersiz veri" işareti olmalı

```javascript
it('should indicate low confidence when review count is insufficient', () => {
  const reviews = [{ taste: 5.0, service: 5.0 }];
  
  const result = calculateGurmeScoreWithConfidence(reviews);
  expect(result.confidence).toBe('low');
  expect(result.minReviewsNeeded).toBeGreaterThan(reviews.length);
});
```

### 1.4 Zaman Ağırlıklandırma / Time Weighting

#### Test Case 1.4.1: Yeni Değerlendirmeler Daha Önemli
**Given**: Eski ve yeni değerlendirmeler mevcut  
**When**: GurmeScore hesaplanır  
**Then**: Yeni değerlendirmeler daha fazla ağırlığa sahip olmalı

```javascript
it('should give more weight to recent reviews', () => {
  const oldReview = { 
    taste: 5.0, 
    service: 5.0, 
    date: new Date('2024-01-01') 
  };
  const newReview = { 
    taste: 3.0, 
    service: 3.0, 
    date: new Date('2026-01-01') 
  };
  
  const score = calculateGurmeScore([oldReview, newReview]);
  
  // Score should be closer to 3.0 than 5.0
  expect(score).toBeLessThan(70);
  expect(score).toBeGreaterThan(50);
});
```

### 1.5 Edge Cases ve Hata Durumları

#### Test Case 1.5.1: Negatif Değerler
**Given**: Negatif puanlar girilmiş  
**When**: GurmeScore hesaplanır  
**Then**: Hata fırlatılmalı veya değer 0'a normalize edilmeli

```javascript
it('should reject negative rating values', () => {
  const invalidReview = { taste: -1.0, service: 5.0 };
  expect(() => calculateGurmeScore(invalidReview)).toThrow();
});
```

#### Test Case 1.5.2: Maksimum Değerin Üzerinde
**Given**: 5.0'ın üzerinde puanlar girilmiş  
**When**: GurmeScore hesaplanır  
**Then**: Hata fırlatılmalı veya değer maksimuma normalize edilmeli

```javascript
it('should reject ratings above maximum value', () => {
  const invalidReview = { taste: 6.0, service: 5.0 };
  expect(() => calculateGurmeScore(invalidReview)).toThrow();
});
```

#### Test Case 1.5.3: Geçersiz Veri Tipleri
**Given**: String, null veya undefined değerler girilmiş  
**When**: GurmeScore hesaplanır  
**Then**: Uygun hata mesajı döndürülmeli

```javascript
it('should handle invalid data types gracefully', () => {
  const invalidReviews = [
    { taste: "five", service: 5.0 },
    { taste: null, service: 5.0 },
    { taste: undefined, service: 5.0 }
  ];
  
  invalidReviews.forEach(review => {
    expect(() => calculateGurmeScore(review)).toThrow(/invalid.*type/i);
  });
});
```

---

## 2. Rütbe Eşlemesi - Unit Test Senaryoları

### 2.1 Rütbe Hesaplama / Rank Calculation

#### Test Case 2.1.1: Yeni Kullanıcı
**Given**: Hiç değerlendirme yapmamış yeni kullanıcı  
**When**: Rütbe hesaplanır  
**Then**: Başlangıç rütbesi "Yeni Gurme" olmalı

```javascript
it('should assign "Yeni Gurme" rank to new users', () => {
  const user = { reviewCount: 0, totalScore: 0 };
  const rank = calculateUserRank(user);
  expect(rank).toBe('Yeni Gurme');
});
```

#### Test Case 2.1.2: Deneyimli Kullanıcı
**Given**: 50+ değerlendirme yapmış, ortalama 4.0+ puan alan kullanıcı  
**When**: Rütbe hesaplanır  
**Then**: Rütbe "Master Chef" olmalı

```javascript
it('should assign "Master Chef" rank to experienced users with high ratings', () => {
  const user = { 
    reviewCount: 50, 
    averageScore: 4.2,
    helpfulVotes: 100 
  };
  const rank = calculateUserRank(user);
  expect(rank).toBe('Master Chef');
});
```

#### Test Case 2.1.3: Rütbe Terfi
**Given**: Kullanıcı bir sonraki rütbe için gereken kriterleri karşıladı  
**When**: Rütbe güncellenir  
**Then**: Bir üst rütbeye terfi etmeli ve bildirim almalı

```javascript
it('should promote user when criteria are met', () => {
  const user = { 
    reviewCount: 9, 
    rank: 'Yeni Gurme',
    averageScore: 4.0 
  };
  
  // Add one more review to meet criteria
  const updatedUser = addReview(user, { score: 4.5 });
  const result = updateUserRank(updatedUser);
  
  expect(result.newRank).toBe('Gurme');
  expect(result.promoted).toBe(true);
  expect(result.notification).toBeDefined();
});
```

### 2.2 Rütbe Kriterleri / Rank Criteria

#### Test Case 2.2.1: Çoklu Kriter Kontrolü
**Given**: Rütbe için hem sayı hem kalite kriterleri var  
**When**: Kullanıcı sadece birini karşılıyor  
**Then**: Terfi etmemeli

```javascript
it('should require all criteria to be met for promotion', () => {
  const users = [
    { reviewCount: 50, averageScore: 2.0 }, // quantity but not quality
    { reviewCount: 5, averageScore: 5.0 },  // quality but not quantity
  ];
  
  users.forEach(user => {
    const rank = calculateUserRank(user);
    expect(rank).not.toBe('Master Chef');
  });
});
```

#### Test Case 2.2.2: Yararlılık Puanı
**Given**: Değerlendirmeler diğer kullanıcılar tarafından yararlı bulunuyor  
**When**: Rütbe hesaplanır  
**Then**: Yararlılık puanı rütbeyi pozitif etkilemeli

```javascript
it('should consider helpfulness score in rank calculation', () => {
  const userWithHelpful = { 
    reviewCount: 20, 
    averageScore: 4.0,
    helpfulVotes: 50 
  };
  const userWithoutHelpful = { 
    reviewCount: 20, 
    averageScore: 4.0,
    helpfulVotes: 0 
  };
  
  const rankWithHelpful = calculateUserRank(userWithHelpful);
  const rankWithoutHelpful = calculateUserRank(userWithoutHelpful);
  
  expect(getRankLevel(rankWithHelpful)).toBeGreaterThan(
    getRankLevel(rankWithoutHelpful)
  );
});
```

### 2.3 Rütbe Düşme / Rank Demotion

#### Test Case 2.3.1: Kötü Kaliteli İçerik
**Given**: Kullanıcı sürekli düşük kaliteli değerlendirmeler yapıyor  
**When**: Kalite metrikleri kontrol edilir  
**Then**: Rütbe düşürülmeli

```javascript
it('should demote users with consistently low-quality reviews', () => {
  const user = { 
    rank: 'Master Chef',
    recentReviews: [
      { score: 1.0, helpful: 0, reported: 2 },
      { score: 1.5, helpful: 0, reported: 3 },
      { score: 2.0, helpful: 0, reported: 1 }
    ]
  };
  
  const result = evaluateUserQuality(user);
  expect(result.shouldDemote).toBe(true);
  expect(result.newRank).not.toBe('Master Chef');
});
```

---

## 3. API Fonksiyonları - Integration Test Senaryoları

### 3.1 Restoran API'leri

#### Test Case 3.1.1: Restoran Listesi
**Given**: Sistemde restoranlar mevcut  
**When**: GET /api/restaurants endpoint'i çağrılır  
**Then**: Sayfalanmış restoran listesi döndürülmeli

```javascript
describe('GET /api/restaurants', () => {
  it('should return paginated list of restaurants', async () => {
    const response = await request(app)
      .get('/api/restaurants?page=1&limit=10')
      .expect(200);
    
    expect(response.body.restaurants).toHaveLength(10);
    expect(response.body.pagination).toMatchObject({
      currentPage: 1,
      totalPages: expect.any(Number),
      totalItems: expect.any(Number)
    });
  });
});
```

#### Test Case 3.1.2: Restoran Detayı
**Given**: Geçerli bir restoran ID'si  
**When**: GET /api/restaurants/:id endpoint'i çağrılır  
**Then**: Tam restoran bilgisi ve değerlendirmeler döndürülmeli

```javascript
it('should return restaurant details with reviews', async () => {
  const restaurantId = 'test-restaurant-1';
  
  const response = await request(app)
    .get(`/api/restaurants/${restaurantId}`)
    .expect(200);
  
  expect(response.body).toMatchObject({
    id: restaurantId,
    name: expect.any(String),
    address: expect.any(String),
    gurmeScore: expect.any(Number),
    reviews: expect.any(Array)
  });
});
```

#### Test Case 3.1.3: Restoran Oluşturma - Yetkili Kullanıcı
**Given**: Yetkili bir kullanıcı token'ı  
**When**: POST /api/restaurants ile yeni restoran oluşturulur  
**Then**: Restoran başarıyla oluşturulmalı ve 201 döndürülmeli

```javascript
it('should create new restaurant with valid authentication', async () => {
  const newRestaurant = {
    name: 'Test Restaurant',
    address: 'Test Address',
    cuisine: 'Turkish',
    phone: '+90-555-123-4567'
  };
  
  const response = await request(app)
    .post('/api/restaurants')
    .set('Authorization', `Bearer ${validToken}`)
    .send(newRestaurant)
    .expect(201);
  
  expect(response.body).toMatchObject({
    id: expect.any(String),
    ...newRestaurant
  });
});
```

#### Test Case 3.1.4: Restoran Oluşturma - Yetkisiz
**Given**: Geçersiz veya eksik token  
**When**: POST /api/restaurants çağrılır  
**Then**: 401 Unauthorized döndürülmeli

```javascript
it('should reject restaurant creation without valid auth', async () => {
  const newRestaurant = { name: 'Test Restaurant' };
  
  await request(app)
    .post('/api/restaurants')
    .send(newRestaurant)
    .expect(401);
});
```

### 3.2 Değerlendirme API'leri

#### Test Case 3.2.1: Değerlendirme Gönderme
**Given**: Yetkili kullanıcı ve geçerli değerlendirme verisi  
**When**: POST /api/reviews endpoint'i çağrılır  
**Then**: Değerlendirme kaydedilmeli ve GurmeScore güncellendirilmeli

```javascript
it('should create review and update restaurant score', async () => {
  const review = {
    restaurantId: 'test-restaurant-1',
    taste: 4.5,
    service: 4.0,
    ambiance: 4.5,
    comment: 'Great experience!'
  };
  
  const initialScore = await getRestaurantScore('test-restaurant-1');
  
  const response = await request(app)
    .post('/api/reviews')
    .set('Authorization', `Bearer ${validToken}`)
    .send(review)
    .expect(201);
  
  const updatedScore = await getRestaurantScore('test-restaurant-1');
  
  expect(response.body.id).toBeDefined();
  expect(updatedScore).not.toBe(initialScore);
});
```

#### Test Case 3.2.2: Çift Değerlendirme Engelleme
**Given**: Kullanıcı aynı restorana daha önce değerlendirme yapmış  
**When**: Tekrar değerlendirme yapılmaya çalışılır  
**Then**: 409 Conflict döndürülmeli

```javascript
it('should prevent duplicate reviews for same restaurant', async () => {
  const review = {
    restaurantId: 'test-restaurant-1',
    taste: 4.5,
    service: 4.0
  };
  
  // First review
  await request(app)
    .post('/api/reviews')
    .set('Authorization', `Bearer ${validToken}`)
    .send(review)
    .expect(201);
  
  // Duplicate review
  await request(app)
    .post('/api/reviews')
    .set('Authorization', `Bearer ${validToken}`)
    .send(review)
    .expect(409);
});
```

#### Test Case 3.2.3: Değerlendirme Güncelleme
**Given**: Kullanıcının mevcut değerlendirmesi  
**When**: PUT /api/reviews/:id ile güncelleme yapılır  
**Then**: Değerlendirme güncellendirilmeli ve skor yeniden hesaplanmalı

```javascript
it('should update existing review and recalculate score', async () => {
  const reviewId = 'test-review-1';
  const updates = { taste: 5.0, service: 5.0 };
  
  const response = await request(app)
    .put(`/api/reviews/${reviewId}`)
    .set('Authorization', `Bearer ${validToken}`)
    .send(updates)
    .expect(200);
  
  expect(response.body.taste).toBe(5.0);
  expect(response.body.updatedAt).toBeDefined();
});
```

### 3.3 Validasyon Testleri

#### Test Case 3.3.1: Eksik Zorunlu Alanlar
**Given**: Zorunlu alanlar eksik veri  
**When**: API endpoint'i çağrılır  
**Then**: 400 Bad Request ve açıklayıcı hata mesajı döndürülmeli

```javascript
it('should return validation errors for missing required fields', async () => {
  const incompleteReview = { restaurantId: 'test-1' }; // missing rating fields
  
  const response = await request(app)
    .post('/api/reviews')
    .set('Authorization', `Bearer ${validToken}`)
    .send(incompleteReview)
    .expect(400);
  
  expect(response.body.errors).toContain('taste is required');
  expect(response.body.errors).toContain('service is required');
});
```

#### Test Case 3.3.2: Geçersiz Veri Formatı
**Given**: Geçersiz formatta veri (örn: email, telefon)  
**When**: API endpoint'i çağrılır  
**Then**: Format hatası döndürülmeli

```javascript
it('should validate data formats', async () => {
  const invalidData = {
    name: 'Test Restaurant',
    email: 'invalid-email',
    phone: '123' // invalid format
  };
  
  const response = await request(app)
    .post('/api/restaurants')
    .set('Authorization', `Bearer ${validToken}`)
    .send(invalidData)
    .expect(400);
  
  expect(response.body.errors).toEqual(
    expect.arrayContaining([
      expect.stringMatching(/email/i),
      expect.stringMatching(/phone/i)
    ])
  );
});
```

### 3.4 Hata İşleme

#### Test Case 3.4.1: Bulunamayan Kaynak
**Given**: Var olmayan bir kaynak ID'si  
**When**: GET endpoint'i çağrılır  
**Then**: 404 Not Found döndürülmeli

```javascript
it('should return 404 for non-existent resources', async () => {
  const response = await request(app)
    .get('/api/restaurants/non-existent-id')
    .expect(404);
  
  expect(response.body.message).toMatch(/not found/i);
});
```

#### Test Case 3.4.2: Sunucu Hatası
**Given**: Database bağlantısı kopuk  
**When**: Herhangi bir endpoint çağrılır  
**Then**: 500 Internal Server Error ve genel hata mesajı döndürülmeli

```javascript
it('should handle database errors gracefully', async () => {
  // Mock database failure
  jest.spyOn(db, 'query').mockRejectedValueOnce(new Error('Connection lost'));
  
  const response = await request(app)
    .get('/api/restaurants')
    .expect(500);
  
  expect(response.body.message).toBe('Internal server error');
  expect(response.body.details).toBeUndefined(); // Don't expose internal details
});
```

---

## 4. Invite/Rol Akışı - Integration Test Senaryoları

### 4.1 Davet Sistemi

#### Test Case 4.1.1: Davet Oluşturma
**Given**: Admin yetkili kullanıcı  
**When**: POST /api/invites ile yeni davet oluşturur  
**Then**: Davet linki oluşturulmalı ve email gönderilmeli

```javascript
it('should create invite and send email', async () => {
  const inviteData = {
    email: 'newuser@example.com',
    role: 'reviewer',
    expiresIn: '7d'
  };
  
  const emailSpy = jest.spyOn(emailService, 'send');
  
  const response = await request(app)
    .post('/api/invites')
    .set('Authorization', `Bearer ${adminToken}`)
    .send(inviteData)
    .expect(201);
  
  expect(response.body.inviteCode).toBeDefined();
  expect(response.body.expiresAt).toBeDefined();
  expect(emailSpy).toHaveBeenCalledWith(
    expect.objectContaining({
      to: inviteData.email,
      subject: expect.stringMatching(/invite/i)
    })
  );
});
```

#### Test Case 4.1.2: Davet Kullanma
**Given**: Geçerli davet kodu  
**When**: Kullanıcı davet kodu ile kayıt olur  
**Then**: Hesap oluşturulmalı ve uygun rol atanmalı

```javascript
it('should allow user signup with valid invite code', async () => {
  const inviteCode = 'valid-invite-code';
  const userData = {
    email: 'newuser@example.com',
    password: 'SecurePass123!',
    name: 'New User',
    inviteCode
  };
  
  const response = await request(app)
    .post('/api/auth/signup')
    .send(userData)
    .expect(201);
  
  expect(response.body.user.role).toBe('reviewer');
  expect(response.body.token).toBeDefined();
  
  // Verify invite is marked as used
  const invite = await getInvite(inviteCode);
  expect(invite.used).toBe(true);
  expect(invite.usedBy).toBe(response.body.user.id);
});
```

#### Test Case 4.1.3: Süresi Dolmuş Davet
**Given**: Süresi dolmuş davet kodu  
**When**: Davet kodu ile kayıt olunmaya çalışılır  
**Then**: 410 Gone veya 400 Bad Request döndürülmeli

```javascript
it('should reject expired invite codes', async () => {
  const expiredInviteCode = 'expired-invite-code';
  
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'user@example.com',
      password: 'Pass123!',
      inviteCode: expiredInviteCode
    })
    .expect(410);
  
  expect(response.body.message).toMatch(/expired/i);
});
```

#### Test Case 4.1.4: Kullanılmış Davet
**Given**: Daha önce kullanılmış davet kodu  
**When**: Aynı kod tekrar kullanılmaya çalışılır  
**Then**: Reddedilmeli

```javascript
it('should reject already used invite codes', async () => {
  const usedInviteCode = 'used-invite-code';
  
  const response = await request(app)
    .post('/api/auth/signup')
    .send({
      email: 'another@example.com',
      password: 'Pass123!',
      inviteCode: usedInviteCode
    })
    .expect(400);
  
  expect(response.body.message).toMatch(/already used/i);
});
```

### 4.2 Rol Yönetimi

#### Test Case 4.2.1: Rol Atama - Admin
**Given**: Admin kullanıcı  
**When**: Başka bir kullanıcıya rol atar  
**Then**: Rol başarıyla atanmalı

```javascript
it('should allow admin to assign roles', async () => {
  const userId = 'user-123';
  const newRole = 'moderator';
  
  const response = await request(app)
    .put(`/api/users/${userId}/role`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ role: newRole })
    .expect(200);
  
  expect(response.body.role).toBe(newRole);
  
  // Verify permissions are updated
  const user = await getUser(userId);
  expect(user.permissions).toContain('moderate_reviews');
});
```

#### Test Case 4.2.2: Rol Atama - Yetkisiz
**Given**: Normal kullanıcı (admin değil)  
**When**: Rol değiştirmeye çalışır  
**Then**: 403 Forbidden döndürülmeli

```javascript
it('should reject role assignment from non-admin users', async () => {
  const userId = 'user-123';
  
  await request(app)
    .put(`/api/users/${userId}/role`)
    .set('Authorization', `Bearer ${regularUserToken}`)
    .send({ role: 'admin' })
    .expect(403);
});
```

#### Test Case 4.2.3: Rol Tabanlı Erişim
**Given**: Farklı rollere sahip kullanıcılar  
**When**: Rol gerektiren endpoint'ler çağrılır  
**Then**: Sadece yetkili roller erişebilmeli

```javascript
describe('Role-based access control', () => {
  const protectedEndpoints = [
    { method: 'post', path: '/api/restaurants', requiredRole: 'admin' },
    { method: 'delete', path: '/api/reviews/123', requiredRole: 'moderator' },
    { method: 'post', path: '/api/reviews', requiredRole: 'reviewer' }
  ];
  
  protectedEndpoints.forEach(endpoint => {
    it(`should protect ${endpoint.method.toUpperCase()} ${endpoint.path}`, async () => {
      const tokens = {
        admin: adminToken,
        moderator: moderatorToken,
        reviewer: reviewerToken,
        basic: basicUserToken
      };
      
      // Test with insufficient role
      const insufficientToken = tokens.basic;
      await request(app)
        [endpoint.method](endpoint.path)
        .set('Authorization', `Bearer ${insufficientToken}`)
        .expect(403);
      
      // Test with sufficient role
      const sufficientToken = tokens[endpoint.requiredRole];
      await request(app)
        [endpoint.method](endpoint.path)
        .set('Authorization', `Bearer ${sufficientToken}`)
        .expect(code => code !== 403); // May be 200, 201, or validation error, but not 403
    });
  });
});
```

### 4.3 Yetki Hiyerarşisi

#### Test Case 4.3.1: Yetki Kalıtımı
**Given**: Admin rolü tüm yetkilere sahip  
**When**: Moderator veya reviewer işlemleri yapılır  
**Then**: Admin tüm işlemleri yapabilmeli

```javascript
it('should allow admin to perform all role operations', async () => {
  const operations = [
    () => request(app).post('/api/reviews').set('Authorization', `Bearer ${adminToken}`),
    () => request(app).delete('/api/reviews/123').set('Authorization', `Bearer ${adminToken}`),
    () => request(app).put('/api/users/123/role').set('Authorization', `Bearer ${adminToken}`)
  ];
  
  for (const operation of operations) {
    const response = await operation();
    expect(response.status).not.toBe(403);
  }
});
```

---

## 5. Abuse Engelleme - Unit ve Integration Test Senaryoları

### 5.1 Rate Limiting

#### Test Case 5.1.1: Normal Kullanım
**Given**: Kullanıcı limit altında istek yapıyor  
**When**: API çağrıları yapılır  
**Then**: Tüm istekler başarılı olmalı

```javascript
it('should allow requests within rate limit', async () => {
  const requests = Array(10).fill(null).map(() =>
    request(app)
      .get('/api/restaurants')
      .set('Authorization', `Bearer ${validToken}`)
  );
  
  const responses = await Promise.all(requests);
  
  responses.forEach(response => {
    expect(response.status).toBe(200);
  });
});
```

#### Test Case 5.1.2: Rate Limit Aşımı
**Given**: Kullanıcı çok fazla istek yapıyor  
**When**: Limit aşıldığında  
**Then**: 429 Too Many Requests döndürülmeli

```javascript
it('should block requests exceeding rate limit', async () => {
  const limit = 100;
  const requests = Array(limit + 10).fill(null).map(() =>
    request(app)
      .get('/api/restaurants')
      .set('Authorization', `Bearer ${validToken}`)
  );
  
  const responses = await Promise.all(requests);
  
  const blockedRequests = responses.filter(r => r.status === 429);
  expect(blockedRequests.length).toBeGreaterThan(0);
  
  // Check rate limit headers
  const lastResponse = responses[responses.length - 1];
  expect(lastResponse.headers['x-ratelimit-limit']).toBeDefined();
  expect(lastResponse.headers['x-ratelimit-remaining']).toBeDefined();
  expect(lastResponse.headers['retry-after']).toBeDefined();
});
```

#### Test Case 5.1.3: Farklı Endpoint'ler için Farklı Limitler
**Given**: Farklı endpoint'lerin farklı rate limitleri var  
**When**: Her endpoint test edilir  
**Then**: Her biri kendi limitini uygulamalı

```javascript
it('should apply different limits for different endpoints', async () => {
  const endpoints = [
    { path: '/api/restaurants', limit: 100 },
    { path: '/api/reviews', limit: 20 },
    { path: '/api/search', limit: 50 }
  ];
  
  for (const endpoint of endpoints) {
    // Make requests up to limit + 1
    const requests = Array(endpoint.limit + 1).fill(null).map(() =>
      request(app).get(endpoint.path).set('Authorization', `Bearer ${validToken}`)
    );
    
    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];
    
    expect(lastResponse.status).toBe(429);
    expect(lastResponse.headers['x-ratelimit-limit']).toBe(String(endpoint.limit));
  }
});
```

### 5.2 Spam Önleme

#### Test Case 5.2.1: Tekrarlanan İçerik
**Given**: Kullanıcı aynı içeriği tekrar tekrar gönderiyor  
**When**: Spam detection çalışır  
**Then**: İçerik engellenmeli veya işaretlendirilmeli

```javascript
it('should detect and prevent duplicate content spam', async () => {
  const duplicateReview = {
    restaurantId: 'test-restaurant-1',
    taste: 4.0,
    service: 4.0,
    comment: 'Great place!'
  };
  
  // Send same review to different restaurants
  const restaurants = ['rest-1', 'rest-2', 'rest-3'];
  const requests = restaurants.map(id =>
    request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${validToken}`)
      .send({ ...duplicateReview, restaurantId: id })
  );
  
  const responses = await Promise.all(requests);
  
  // First should succeed, subsequent should be flagged or rejected
  expect(responses[0].status).toBe(201);
  expect(responses[responses.length - 1].status).toBeOneOf([400, 429]);
  expect(responses[responses.length - 1].body.message).toMatch(/spam|duplicate/i);
});
```

#### Test Case 5.2.2: Hızlı Ardışık Gönderiler
**Given**: Kullanıcı çok kısa sürede çok sayıda değerlendirme yapıyor  
**When**: Zaman bazlı kontrol yapılır  
**Then**: Yavaşlatma veya geçici engel uygulanmalı

```javascript
it('should throttle rapid successive submissions', async () => {
  const reviews = Array(5).fill(null).map((_, i) => ({
    restaurantId: `restaurant-${i}`,
    taste: 4.0,
    service: 4.0,
    comment: `Review ${i}`
  }));
  
  const startTime = Date.now();
  
  const requests = reviews.map(review =>
    request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${validToken}`)
      .send(review)
  );
  
  const responses = await Promise.all(requests);
  const endTime = Date.now();
  
  // System should introduce delays or reject some requests
  const rejectedCount = responses.filter(r => r.status === 429).length;
  const timeTaken = endTime - startTime;
  
  // Either some requests were rejected OR significant delay was introduced
  expect(rejectedCount > 0 || timeTaken > 5000).toBe(true);
});
```

### 5.3 Kötüye Kullanım Tespiti

#### Test Case 5.3.1: Şüpheli Puanlama Paterni
**Given**: Kullanıcı sadece bir restorana 5 yıldız, diğerlerine 1 yıldız veriyor  
**When**: Abuse detection analizi yapılır  
**Then**: Şüpheli işaret konmalı

```javascript
it('should detect suspicious rating patterns', async () => {
  const userId = 'test-user-123';
  const targetRestaurant = 'favorite-restaurant';
  
  const reviews = [
    { restaurantId: targetRestaurant, taste: 5, service: 5 },
    { restaurantId: 'competitor-1', taste: 1, service: 1 },
    { restaurantId: 'competitor-2', taste: 1, service: 1 },
    { restaurantId: 'competitor-3', taste: 1, service: 1 }
  ];
  
  // Create reviews
  for (const review of reviews) {
    await createReview(userId, review);
  }
  
  const abuseReport = await analyzeUserBehavior(userId);
  
  expect(abuseReport.suspicious).toBe(true);
  expect(abuseReport.reasons).toContain('biased_rating_pattern');
  expect(abuseReport.confidence).toBeGreaterThan(0.7);
});
```

#### Test Case 5.3.2: Bot Davranışı
**Given**: Çok düzenli aralıklarla, çok benzer içeriklerle gönderiler yapılıyor  
**When**: Bot detection çalışır  
**Then**: Hesap işaretlendirilmeli veya askıya alınmalı

```javascript
it('should detect bot-like behavior', async () => {
  const botBehavior = {
    reviewInterval: 300, // exactly 5 minutes between each
    reviewCount: 20,
    contentSimilarity: 0.95 // 95% similar content
  };
  
  const result = await detectBotBehavior('suspected-bot-user', botBehavior);
  
  expect(result.isBot).toBe(true);
  expect(result.confidence).toBeGreaterThan(0.8);
  expect(result.actionTaken).toBeOneOf(['flag', 'suspend', 'captcha_required']);
});
```

#### Test Case 5.3.3: Koordineli Saldırı
**Given**: Birden fazla hesap aynı restorana kısa sürede aynı tip değerlendirme yapıyor  
**When**: Koordinasyon analizi yapılır  
**Then**: Tüm ilgili hesaplar işaretlendirilmeli

```javascript
it('should detect coordinated attack patterns', async () => {
  const targetRestaurant = 'victim-restaurant';
  const attackAccounts = ['bot1', 'bot2', 'bot3', 'bot4'];
  const timeWindow = 3600; // 1 hour
  
  const attacks = attackAccounts.map(userId => ({
    userId,
    restaurantId: targetRestaurant,
    taste: 1,
    service: 1,
    timestamp: Date.now()
  }));
  
  const detection = await detectCoordinatedAttack(targetRestaurant, timeWindow);
  
  expect(detection.isCoordinated).toBe(true);
  expect(detection.involvedAccounts).toEqual(expect.arrayContaining(attackAccounts));
  expect(detection.severity).toBe('high');
  expect(detection.reviewsQuarantined).toBeGreaterThan(0);
});
```

### 5.4 Hesap Güvenliği

#### Test Case 5.4.1: Birden Fazla Hesap Tespiti
**Given**: Aynı IP'den birden fazla hesap oluşturulmuş  
**When**: Multi-accounting kontrolü yapılır  
**Then**: Şüpheli olarak işaretlendirilmeli

```javascript
it('should detect multiple accounts from same IP', async () => {
  const accounts = [
    { username: 'user1', email: 'user1@example.com', ip: '192.168.1.1' },
    { username: 'user2', email: 'user2@example.com', ip: '192.168.1.1' },
    { username: 'user3', email: 'user3@example.com', ip: '192.168.1.1' }
  ];
  
  for (const account of accounts) {
    await createAccount(account);
  }
  
  const report = await checkMultiAccounting('192.168.1.1');
  
  expect(report.accountCount).toBe(3);
  expect(report.suspicious).toBe(true);
  expect(report.requiresVerification).toBe(true);
});
```

#### Test Case 5.4.2: Şüpheli Giriş Denemesi
**Given**: Farklı lokasyonlardan hızlı giriş denemeleri  
**When**: Anomali tespiti yapılır  
**Then**: Ek doğrulama istendirilmeli

```javascript
it('should detect suspicious login patterns', async () => {
  const userId = 'user-123';
  const logins = [
    { location: 'Istanbul, TR', timestamp: Date.now() },
    { location: 'New York, US', timestamp: Date.now() + 1000 }, // 1 second later
    { location: 'Tokyo, JP', timestamp: Date.now() + 2000 } // 2 seconds later
  ];
  
  for (const login of logins) {
    await recordLogin(userId, login);
  }
  
  const security = await checkLoginSecurity(userId);
  
  expect(security.anomalyDetected).toBe(true);
  expect(security.requiresTwoFactor).toBe(true);
  expect(security.reason).toMatch(/impossible.*travel/i);
});
```

---

## 6. Test Veri Şablonları / Test Data Templates

### 6.1 Örnek Kullanıcılar

```javascript
const testUsers = {
  newUser: {
    id: 'user-new-1',
    username: 'yenigurme',
    email: 'yeni@example.com',
    reviewCount: 0,
    rank: 'Yeni Gurme',
    createdAt: new Date()
  },
  
  experiencedUser: {
    id: 'user-exp-1',
    username: 'deneyimligurme',
    email: 'deneyimli@example.com',
    reviewCount: 150,
    averageScore: 4.2,
    rank: 'Master Chef',
    helpfulVotes: 300,
    createdAt: new Date('2024-01-01')
  },
  
  moderator: {
    id: 'user-mod-1',
    username: 'moderator',
    email: 'mod@example.com',
    role: 'moderator',
    permissions: ['moderate_reviews', 'delete_spam'],
    reviewCount: 50
  },
  
  admin: {
    id: 'user-admin-1',
    username: 'admin',
    email: 'admin@example.com',
    role: 'admin',
    permissions: ['all'],
    reviewCount: 200
  }
};
```

### 6.2 Örnek Restoranlar

```javascript
const testRestaurants = {
  popular: {
    id: 'rest-pop-1',
    name: 'Popüler Restoran',
    cuisine: 'Turkish',
    address: 'İstanbul, Türkiye',
    gurmeScore: 87.5,
    reviewCount: 250,
    createdAt: new Date('2023-01-01')
  },
  
  new: {
    id: 'rest-new-1',
    name: 'Yeni Restoran',
    cuisine: 'Italian',
    address: 'İstanbul, Türkiye',
    gurmeScore: null,
    reviewCount: 0,
    createdAt: new Date()
  },
  
  controversial: {
    id: 'rest-con-1',
    name: 'Tartışmalı Restoran',
    cuisine: 'Fast Food',
    address: 'İstanbul, Türkiye',
    gurmeScore: 65.0,
    reviewCount: 100,
    reviews: [
      { score: 5.0, count: 50 },
      { score: 1.0, count: 50 }
    ]
  }
};
```

### 6.3 Örnek Değerlendirmeler

```javascript
const testReviews = {
  perfect: {
    taste: 5.0,
    service: 5.0,
    ambiance: 5.0,
    priceValue: 5.0,
    cleanliness: 5.0,
    comment: 'Mükemmel bir deneyimdi!',
    userId: 'user-exp-1',
    restaurantId: 'rest-pop-1'
  },
  
  poor: {
    taste: 2.0,
    service: 2.0,
    ambiance: 2.5,
    priceValue: 3.0,
    cleanliness: 2.0,
    comment: 'Beklentilerimi karşılamadı.',
    userId: 'user-new-1',
    restaurantId: 'rest-new-1'
  },
  
  detailed: {
    taste: 4.5,
    service: 4.0,
    ambiance: 4.5,
    priceValue: 4.0,
    cleanliness: 5.0,
    comment: 'Yemekler çok lezzetliydi, özellikle ana yemek harika. Servis biraz yavaştı ama personel güler yüzlüydü. Mekan ambiyansı çok hoş, fiyatlar makul. Tekrar geleceğim.',
    photos: ['photo1.jpg', 'photo2.jpg'],
    userId: 'user-exp-1',
    restaurantId: 'rest-pop-1',
    helpfulCount: 25,
    createdAt: new Date('2025-12-01')
  }
};
```

---

## 7. Test Çalıştırma Komutları / Test Execution Commands

```bash
# Tüm testleri çalıştır / Run all tests
npm test

# Sadece unit testleri / Unit tests only
npm run test:unit

# Sadece integration testleri / Integration tests only
npm run test:integration

# Coverage raporu ile / With coverage report
npm run test:coverage

# Watch mode (geliştirme sırasında) / Watch mode (during development)
npm run test:watch

# Specific test file
npm test -- tests/unit/algorithms/gurmescore.test.js

# Pattern ile test çalıştırma / Run tests by pattern
npm test -- --testNamePattern="GurmeScore"
```

---

**Son Güncelleme / Last Updated**: 2026-01-05  
**Versiyon / Version**: 1.0  
**Toplam Test Senaryosu / Total Test Scenarios**: 50+
