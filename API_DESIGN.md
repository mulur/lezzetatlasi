# Lezzetatlası REST API Tasarımı

## İçindekiler
1. [Genel Bakış](#genel-bakış)
2. [Kimlik Doğrulama](#kimlik-doğrulama)
3. [Endpoint Listesi](#endpoint-listesi)
4. [Yetkilendirme Matrisi](#yetkilendirme-matrisi)
5. [Pagination, Sorting, Filtering](#pagination-sorting-filtering)
6. [Hata Kodları](#hata-kodları)

## Genel Bakış

Base URL: `https://api.lezzetatlasi.com/v1`

### Roller
- **Guest**: Kayıtsız kullanıcı (sadece okuma)
- **User**: Kayıtlı kullanıcı (yorum/puan verebilir)
- **Gourmet**: Özel kod ile kayıt olan gurme kullanıcı (detaylı değerlendirme yetkisi)
- **Admin**: Sistem yöneticisi

### Genel HTTP Header'lar
```
Authorization: Bearer {access_token}
Content-Type: application/json
Accept: application/json
X-API-Version: 1.0
```

## Kimlik Doğrulama

### 1. Kullanıcı Kaydı (Normal)

**Endpoint:** `POST /auth/register`

**Request:**
```json
{
  "email": "kullanici@example.com",
  "password": "SecurePass123!",
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "phone": "+905551234567"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "userId": "usr_1a2b3c4d5e",
    "email": "kullanici@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "role": "user",
    "createdAt": "2026-01-05T17:39:58Z"
  },
  "message": "Kayıt başarılı. Lütfen email adresinizi doğrulayın."
}
```

### 2. Gurme Kaydı (Özel Kod ile)

**Endpoint:** `POST /auth/register/gourmet`

**Request:**
```json
{
  "email": "gurme@example.com",
  "password": "SecurePass123!",
  "firstName": "Mehmet",
  "lastName": "Demir",
  "phone": "+905551234567",
  "gourmetCode": "GURME2026XYZ",
  "expertise": ["Turkish Cuisine", "Fine Dining"],
  "certification": "Culinary Institute Graduate",
  "bio": "15 yıllık deneyime sahip profesyonel şef"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "userId": "usr_2f3g4h5i6j",
    "email": "gurme@example.com",
    "firstName": "Mehmet",
    "lastName": "Demir",
    "role": "gourmet",
    "gourmetProfile": {
      "expertise": ["Turkish Cuisine", "Fine Dining"],
      "certification": "Culinary Institute Graduate",
      "verifiedAt": "2026-01-05T17:39:58Z"
    },
    "createdAt": "2026-01-05T17:39:58Z"
  },
  "message": "Gurme kaydınız başarıyla oluşturuldu."
}
```

**Error Response:** `400 Bad Request`
```json
{
  "success": false,
  "error": {
    "code": "INVALID_GOURMET_CODE",
    "message": "Geçersiz gurme kodu",
    "details": "Girdiğiniz kod geçersiz veya kullanılmış."
  }
}
```

### 3. Giriş Yapma

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "kullanici@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "rt_9k8j7h6g5f4d3s2a1",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "userId": "usr_1a2b3c4d5e",
      "email": "kullanici@example.com",
      "role": "user"
    }
  }
}
```

### 4. Token Yenileme

**Endpoint:** `POST /auth/refresh`

**Request:**
```json
{
  "refreshToken": "rt_9k8j7h6g5f4d3s2a1"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  }
}
```

### 5. Çıkış Yapma

**Endpoint:** `POST /auth/logout`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Başarıyla çıkış yapıldı."
}
```

## Endpoint Listesi

### Kullanıcı Yönetimi

#### 6. Profil Görüntüleme

**Endpoint:** `GET /users/me`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "usr_1a2b3c4d5e",
    "email": "kullanici@example.com",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "phone": "+905551234567",
    "role": "user",
    "profilePhoto": "https://cdn.lezzetatlasi.com/users/usr_1a2b3c4d5e/profile.jpg",
    "stats": {
      "reviewCount": 42,
      "photoCount": 18,
      "followersCount": 15,
      "followingCount": 23
    },
    "createdAt": "2026-01-05T17:39:58Z",
    "updatedAt": "2026-01-05T18:00:00Z"
  }
}
```

#### 7. Profil Güncelleme

**Endpoint:** `PATCH /users/me`

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "firstName": "Ahmet",
  "lastName": "Yılmaz",
  "phone": "+905551234567",
  "bio": "Yemek sevdalısı",
  "city": "Istanbul"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "usr_1a2b3c4d5e",
    "firstName": "Ahmet",
    "lastName": "Yılmaz",
    "phone": "+905551234567",
    "bio": "Yemek sevdalısı",
    "city": "Istanbul",
    "updatedAt": "2026-01-05T18:30:00Z"
  }
}
```

#### 8. Kullanıcı Silme (Hesap Kapatma)

**Endpoint:** `DELETE /users/me`

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "password": "SecurePass123!",
  "reason": "Artık kullanmıyorum"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Hesabınız başarıyla silindi."
}
```

#### 9. Başka Kullanıcı Profilini Görüntüleme

**Endpoint:** `GET /users/{userId}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "usr_2f3g4h5i6j",
    "firstName": "Mehmet",
    "lastName": "Demir",
    "role": "gourmet",
    "profilePhoto": "https://cdn.lezzetatlasi.com/users/usr_2f3g4h5i6j/profile.jpg",
    "bio": "15 yıllık deneyime sahip profesyonel şef",
    "stats": {
      "reviewCount": 128,
      "photoCount": 95,
      "followersCount": 450
    },
    "gourmetProfile": {
      "expertise": ["Turkish Cuisine", "Fine Dining"],
      "certification": "Culinary Institute Graduate",
      "verifiedAt": "2026-01-05T17:39:58Z"
    },
    "createdAt": "2026-01-05T17:39:58Z"
  }
}
```

### Restoran Yönetimi (CRUD)

#### 10. Restoran Listesi

**Endpoint:** `GET /restaurants`

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına sonuç (default: 20, max: 100)
- `sort`: Sıralama kriteri (rating, name, createdAt)
- `order`: Sıralama yönü (asc, desc)
- `city`: Şehir filtresi
- `cuisine`: Mutfak türü filtresi
- `minRating`: Minimum puan
- `search`: Arama terimi

**Example:** `GET /restaurants?page=1&limit=20&sort=rating&order=desc&city=Istanbul&minRating=4.0`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        "restaurantId": "rst_1x2y3z4a5b",
        "name": "Mikla",
        "slug": "mikla-istanbul",
        "description": "Modern Anadolu mutfağı",
        "cuisine": ["Turkish", "Mediterranean"],
        "city": "Istanbul",
        "district": "Beyoğlu",
        "address": "Meşrutiyet Caddesi No:15",
        "coordinates": {
          "lat": 41.0351,
          "lng": 28.9770
        },
        "phone": "+902122931234",
        "website": "https://www.mikla.com.tr",
        "priceRange": "$$$",
        "coverPhoto": "https://cdn.lezzetatlasi.com/restaurants/rst_1x2y3z4a5b/cover.jpg",
        "rating": {
          "overall": 4.7,
          "userRating": 4.6,
          "gourmetRating": 4.9,
          "count": 342
        },
        "isActive": true,
        "createdAt": "2026-01-01T10:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 15,
      "totalItems": 287,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPreviousPage": false
    }
  }
}
```

#### 11. Restoran Detayı

**Endpoint:** `GET /restaurants/{restaurantId}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "restaurantId": "rst_1x2y3z4a5b",
    "name": "Mikla",
    "slug": "mikla-istanbul",
    "description": "Modern Anadolu mutfağı ile dünya çapında tanınan restoran",
    "cuisine": ["Turkish", "Mediterranean"],
    "city": "Istanbul",
    "district": "Beyoğlu",
    "address": "Meşrutiyet Caddesi No:15",
    "coordinates": {
      "lat": 41.0351,
      "lng": 28.9770
    },
    "phone": "+902122931234",
    "website": "https://www.mikla.com.tr",
    "email": "info@mikla.com.tr",
    "priceRange": "$$$",
    "openingHours": {
      "monday": "18:00-23:00",
      "tuesday": "18:00-23:00",
      "wednesday": "18:00-23:00",
      "thursday": "18:00-23:00",
      "friday": "18:00-00:00",
      "saturday": "18:00-00:00",
      "sunday": "Closed"
    },
    "features": ["Reservation Required", "Valet Parking", "Wine Selection"],
    "rating": {
      "overall": 4.7,
      "userRating": 4.6,
      "gourmetRating": 4.9,
      "breakdown": {
        "food": 4.8,
        "service": 4.7,
        "ambiance": 4.6,
        "value": 4.5
      },
      "count": 342
    },
    "photos": [
      {
        "photoId": "pht_a1b2c3d4e5",
        "url": "https://cdn.lezzetatlasi.com/restaurants/rst_1x2y3z4a5b/photo1.jpg",
        "thumbnail": "https://cdn.lezzetatlasi.com/restaurants/rst_1x2y3z4a5b/photo1_thumb.jpg",
        "caption": "İç mekan görünümü",
        "uploadedBy": "usr_1a2b3c4d5e",
        "uploadedAt": "2026-01-02T15:30:00Z"
      }
    ],
    "recentReviews": [
      {
        "reviewId": "rev_5f6g7h8i9j",
        "rating": 5.0,
        "comment": "Harika bir deneyimdi!",
        "author": {
          "userId": "usr_1a2b3c4d5e",
          "name": "Ahmet Y.",
          "role": "user"
        },
        "createdAt": "2026-01-04T19:00:00Z"
      }
    ],
    "isActive": true,
    "createdAt": "2026-01-01T10:00:00Z",
    "updatedAt": "2026-01-05T12:00:00Z"
  }
}
```

#### 12. Restoran Oluşturma

**Endpoint:** `POST /restaurants`

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Request:**
```json
{
  "name": "Neolokal",
  "description": "Modern Türk mutfağı",
  "cuisine": ["Turkish", "Contemporary"],
  "city": "Istanbul",
  "district": "Beyoğlu",
  "address": "Kılıçali Paşa, Arap Camii, Galata Kulesi Sk. No:5",
  "coordinates": {
    "lat": 41.0260,
    "lng": 28.9748
  },
  "phone": "+902122444544",
  "website": "https://www.neolokal.com",
  "email": "info@neolokal.com",
  "priceRange": "$$$",
  "openingHours": {
    "monday": "12:00-23:00",
    "tuesday": "12:00-23:00",
    "wednesday": "12:00-23:00",
    "thursday": "12:00-23:00",
    "friday": "12:00-23:30",
    "saturday": "12:00-23:30",
    "sunday": "12:00-23:00"
  },
  "features": ["Reservation Required", "Outdoor Seating", "Wine Selection"]
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "restaurantId": "rst_2y3z4a5b6c",
    "name": "Neolokal",
    "slug": "neolokal-istanbul",
    "description": "Modern Türk mutfağı",
    "cuisine": ["Turkish", "Contemporary"],
    "city": "Istanbul",
    "district": "Beyoğlu",
    "isActive": true,
    "createdAt": "2026-01-05T18:00:00Z"
  },
  "message": "Restoran başarıyla oluşturuldu."
}
```

#### 13. Restoran Güncelleme

**Endpoint:** `PATCH /restaurants/{restaurantId}`

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Request:**
```json
{
  "description": "Güncellenmiş açıklama",
  "phone": "+902122444545",
  "openingHours": {
    "monday": "12:00-23:30"
  }
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "restaurantId": "rst_2y3z4a5b6c",
    "description": "Güncellenmiş açıklama",
    "phone": "+902122444545",
    "updatedAt": "2026-01-05T18:30:00Z"
  },
  "message": "Restoran bilgileri güncellendi."
}
```

#### 14. Restoran Silme (Soft Delete)

**Endpoint:** `DELETE /restaurants/{restaurantId}`

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Restoran başarıyla silindi."
}
```

### Değerlendirme ve Yorum Sistemi

#### 15. Normal Kullanıcı Yorumu (Basit)

**Endpoint:** `POST /restaurants/{restaurantId}/reviews`

**Headers:** `Authorization: Bearer {token}` (User, Gourmet)

**Request (User):**
```json
{
  "rating": 4.5,
  "comment": "Yemekler çok lezzetliydi, personel çok ilgiliydi.",
  "visitDate": "2026-01-03",
  "wouldRecommend": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "reviewId": "rev_6g7h8i9j0k",
    "restaurantId": "rst_1x2y3z4a5b",
    "userId": "usr_1a2b3c4d5e",
    "rating": 4.5,
    "comment": "Yemekler çok lezzetliydi, personel çok ilgiliydi.",
    "visitDate": "2026-01-03",
    "wouldRecommend": true,
    "type": "user_review",
    "createdAt": "2026-01-05T18:00:00Z"
  },
  "message": "Yorumunuz başarıyla kaydedildi."
}
```

#### 16. Gurme Değerlendirmesi (Detaylı)

**Endpoint:** `POST /restaurants/{restaurantId}/reviews/gourmet`

**Headers:** `Authorization: Bearer {token}` (Gourmet only)

**Request (Gourmet):**
```json
{
  "ratings": {
    "food": 4.8,
    "presentation": 4.9,
    "service": 4.7,
    "ambiance": 4.6,
    "value": 4.5,
    "overall": 4.7
  },
  "detailedReview": {
    "summary": "Modern Türk mutfağının en iyi örneklerinden biri",
    "foodQuality": "Malzemeler son derece taze ve özenle seçilmiş. Lezzet dengesinde mükemmel uyum var.",
    "presentation": "Plating çok etkileyici. Her tabak bir sanat eseri gibi.",
    "service": "Profesyonel ve bilgili personel. Wine pairing önerileri yerinde.",
    "ambiance": "Şık ve modern dekorasyon. Boğaz manzarası muhteşem.",
    "recommendations": ["Izgara Levrek", "Közlenmiş Patlıcan", "Şarap Menüsü"],
    "improvements": ["Rezervasyon sistemi daha esnek olabilir"]
  },
  "visitDate": "2026-01-03",
  "occasion": "Dinner",
  "groupSize": 4,
  "wouldRecommend": true
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "reviewId": "rev_7h8i9j0k1l",
    "restaurantId": "rst_1x2y3z4a5b",
    "userId": "usr_2f3g4h5i6j",
    "type": "gourmet_review",
    "ratings": {
      "food": 4.8,
      "presentation": 4.9,
      "service": 4.7,
      "ambiance": 4.6,
      "value": 4.5,
      "overall": 4.7
    },
    "detailedReview": {
      "summary": "Modern Türk mutfağının en iyi örneklerinden biri",
      "recommendations": ["Izgara Levrek", "Közlenmiş Patlıcan", "Şarap Menüsü"]
    },
    "verifiedGourmet": true,
    "createdAt": "2026-01-05T18:00:00Z"
  },
  "message": "Gurme değerlendirmeniz başarıyla kaydedildi."
}
```

#### 17. Yorum Listesi

**Endpoint:** `GET /restaurants/{restaurantId}/reviews`

**Query Parameters:**
- `page`: Sayfa numarası (default: 1)
- `limit`: Sayfa başına sonuç (default: 10)
- `sort`: Sıralama (recent, highest, lowest)
- `type`: Filtreleme (all, user, gourmet)

**Example:** `GET /restaurants/rst_1x2y3z4a5b/reviews?page=1&limit=10&sort=recent&type=all`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reviews": [
      {
        "reviewId": "rev_7h8i9j0k1l",
        "type": "gourmet_review",
        "author": {
          "userId": "usr_2f3g4h5i6j",
          "name": "Mehmet Demir",
          "role": "gourmet",
          "profilePhoto": "https://cdn.lezzetatlasi.com/users/usr_2f3g4h5i6j/profile.jpg",
          "verifiedGourmet": true
        },
        "ratings": {
          "overall": 4.7,
          "food": 4.8,
          "service": 4.7
        },
        "detailedReview": {
          "summary": "Modern Türk mutfağının en iyi örneklerinden biri"
        },
        "visitDate": "2026-01-03",
        "helpfulCount": 42,
        "createdAt": "2026-01-05T18:00:00Z"
      },
      {
        "reviewId": "rev_6g7h8i9j0k",
        "type": "user_review",
        "author": {
          "userId": "usr_1a2b3c4d5e",
          "name": "Ahmet Y.",
          "role": "user",
          "profilePhoto": "https://cdn.lezzetatlasi.com/users/usr_1a2b3c4d5e/profile.jpg"
        },
        "rating": 4.5,
        "comment": "Yemekler çok lezzetliydi, personel çok ilgiliydi.",
        "visitDate": "2026-01-03",
        "helpfulCount": 15,
        "createdAt": "2026-01-05T18:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 35,
      "totalItems": 342,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPreviousPage": false
    },
    "summary": {
      "totalReviews": 342,
      "userReviews": 214,
      "gourmetReviews": 128,
      "averageRating": 4.7
    }
  }
}
```

#### 18. Yorum Güncelleme

**Endpoint:** `PATCH /reviews/{reviewId}`

**Headers:** `Authorization: Bearer {token}` (Owner only)

**Request:**
```json
{
  "rating": 5.0,
  "comment": "Güncellenmiş yorum içeriği"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reviewId": "rev_6g7h8i9j0k",
    "rating": 5.0,
    "comment": "Güncellenmiş yorum içeriği",
    "updatedAt": "2026-01-05T19:00:00Z"
  },
  "message": "Yorumunuz güncellendi."
}
```

#### 19. Yorum Silme

**Endpoint:** `DELETE /reviews/{reviewId}`

**Headers:** `Authorization: Bearer {token}` (Owner or Admin)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Yorum silindi."
}
```

#### 20. Yorumu Yararlı Bulma

**Endpoint:** `POST /reviews/{reviewId}/helpful`

**Headers:** `Authorization: Bearer {token}`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "reviewId": "rev_6g7h8i9j0k",
    "helpfulCount": 16
  }
}
```

### Fotoğraf Yönetimi (Pre-signed URL ile)

#### 21. Fotoğraf Yükleme İçin URL Alma

**Endpoint:** `POST /photos/upload-url`

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "restaurantId": "rst_1x2y3z4a5b",
  "fileName": "restaurant-food.jpg",
  "fileType": "image/jpeg",
  "fileSize": 2048576,
  "caption": "Signature dish"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "uploadUrl": "https://s3.amazonaws.com/lezzetatlasi-photos/uploads/pht_b2c3d4e5f6?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=...",
    "photoId": "pht_b2c3d4e5f6",
    "expiresIn": 300,
    "method": "PUT",
    "headers": {
      "Content-Type": "image/jpeg"
    }
  },
  "message": "Yükleme URL'si oluşturuldu. 5 dakika içinde kullanın."
}
```

**Kullanım Akışı:**
1. Client bu endpoint'i çağırır ve uploadUrl alır
2. Client, aldığı URL'e dosyayı PUT request ile yükler (S3'e direkt)
3. Yükleme tamamlandıktan sonra aşağıdaki endpoint'i çağırır

#### 22. Fotoğraf Yükleme Onayı

**Endpoint:** `POST /photos/{photoId}/confirm`

**Headers:** `Authorization: Bearer {token}`

**Request:**
```json
{
  "caption": "Signature dish",
  "tags": ["main course", "seafood"]
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "photoId": "pht_b2c3d4e5f6",
    "url": "https://cdn.lezzetatlasi.com/photos/pht_b2c3d4e5f6.jpg",
    "thumbnail": "https://cdn.lezzetatlasi.com/photos/pht_b2c3d4e5f6_thumb.jpg",
    "caption": "Signature dish",
    "tags": ["main course", "seafood"],
    "restaurantId": "rst_1x2y3z4a5b",
    "uploadedBy": "usr_1a2b3c4d5e",
    "status": "active",
    "createdAt": "2026-01-05T18:30:00Z"
  },
  "message": "Fotoğraf başarıyla yüklendi."
}
```

#### 23. Restoran Fotoğrafları Listesi

**Endpoint:** `GET /restaurants/{restaurantId}/photos`

**Query Parameters:**
- `page`: Sayfa numarası
- `limit`: Sayfa başına sonuç
- `sort`: recent, popular

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "photos": [
      {
        "photoId": "pht_b2c3d4e5f6",
        "url": "https://cdn.lezzetatlasi.com/photos/pht_b2c3d4e5f6.jpg",
        "thumbnail": "https://cdn.lezzetatlasi.com/photos/pht_b2c3d4e5f6_thumb.jpg",
        "caption": "Signature dish",
        "tags": ["main course", "seafood"],
        "uploadedBy": {
          "userId": "usr_1a2b3c4d5e",
          "name": "Ahmet Y."
        },
        "likes": 24,
        "createdAt": "2026-01-05T18:30:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 8,
      "totalItems": 76,
      "itemsPerPage": 10
    }
  }
}
```

#### 24. Fotoğraf Silme

**Endpoint:** `DELETE /photos/{photoId}`

**Headers:** `Authorization: Bearer {token}` (Owner or Admin)

**Response:** `200 OK`
```json
{
  "success": true,
  "message": "Fotoğraf silindi."
}
```

### Arama ve Keşfet

#### 25. Genel Arama

**Endpoint:** `GET /search`

**Query Parameters:**
- `q`: Arama terimi (required)
- `type`: restaurant, user, review
- `page`: Sayfa numarası
- `limit`: Sayfa başına sonuç

**Example:** `GET /search?q=kebap&type=restaurant&page=1&limit=20`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "type": "restaurant",
        "restaurantId": "rst_3z4a5b6c7d",
        "name": "Kebapçı İskender",
        "city": "Bursa",
        "rating": 4.8,
        "coverPhoto": "https://cdn.lezzetatlasi.com/restaurants/rst_3z4a5b6c7d/cover.jpg"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 48
    }
  }
}
```

#### 26. Yakındaki Restoranlar

**Endpoint:** `GET /restaurants/nearby`

**Query Parameters:**
- `lat`: Latitude (required)
- `lng`: Longitude (required)
- `radius`: Yarıçap (km, default: 5)
- `limit`: Sonuç limiti

**Example:** `GET /restaurants/nearby?lat=41.0351&lng=28.9770&radius=2&limit=10`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "restaurants": [
      {
        "restaurantId": "rst_1x2y3z4a5b",
        "name": "Mikla",
        "distance": 0.8,
        "distanceUnit": "km",
        "rating": 4.7,
        "priceRange": "$$$",
        "coordinates": {
          "lat": 41.0351,
          "lng": 28.9770
        }
      }
    ],
    "center": {
      "lat": 41.0351,
      "lng": 28.9770
    },
    "radius": 2
  }
}
```

### Admin İşlemleri

#### 27. Kullanıcı Listesi (Admin)

**Endpoint:** `GET /admin/users`

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Query Parameters:**
- `page`, `limit`, `sort`, `role`, `search`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "userId": "usr_1a2b3c4d5e",
        "email": "kullanici@example.com",
        "firstName": "Ahmet",
        "lastName": "Yılmaz",
        "role": "user",
        "isActive": true,
        "stats": {
          "reviewCount": 42,
          "photoCount": 18
        },
        "createdAt": "2026-01-05T17:39:58Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 120,
      "totalItems": 2387
    }
  }
}
```

#### 28. Kullanıcı Rolü Güncelleme (Admin)

**Endpoint:** `PATCH /admin/users/{userId}/role`

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Request:**
```json
{
  "role": "gourmet",
  "reason": "Uzman şef olduğu doğrulandı"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "usr_1a2b3c4d5e",
    "role": "gourmet",
    "updatedAt": "2026-01-05T19:00:00Z"
  }
}
```

#### 29. Kullanıcı Askıya Alma/Aktifleştirme (Admin)

**Endpoint:** `PATCH /admin/users/{userId}/status`

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Request:**
```json
{
  "isActive": false,
  "reason": "Spam içerik paylaşımı"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "userId": "usr_1a2b3c4d5e",
    "isActive": false,
    "suspendedAt": "2026-01-05T19:00:00Z"
  }
}
```

#### 30. Gurme Kod Oluşturma (Admin)

**Endpoint:** `POST /admin/gourmet-codes`

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Request:**
```json
{
  "quantity": 10,
  "expiresAt": "2026-12-31T23:59:59Z",
  "note": "2026 yılı gurme kayıtları için"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "codes": [
      {
        "code": "GURME2026ABC",
        "expiresAt": "2026-12-31T23:59:59Z",
        "isUsed": false,
        "createdAt": "2026-01-05T19:00:00Z"
      },
      {
        "code": "GURME2026DEF",
        "expiresAt": "2026-12-31T23:59:59Z",
        "isUsed": false,
        "createdAt": "2026-01-05T19:00:00Z"
      }
    ],
    "totalGenerated": 10
  }
}
```

#### 31. İstatistikler (Admin)

**Endpoint:** `GET /admin/statistics`

**Headers:** `Authorization: Bearer {token}` (Admin only)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 2387,
      "regular": 2100,
      "gourmet": 257,
      "admin": 30,
      "newThisMonth": 156
    },
    "restaurants": {
      "total": 287,
      "active": 278,
      "newThisMonth": 12
    },
    "reviews": {
      "total": 8542,
      "userReviews": 6234,
      "gourmetReviews": 2308,
      "thisMonth": 423
    },
    "photos": {
      "total": 15643,
      "thisMonth": 892
    }
  }
}
```

## Yetkilendirme Matrisi

| Endpoint | Guest | User | Gourmet | Admin |
|----------|-------|------|---------|-------|
| **Kimlik Doğrulama** |
| POST /auth/register | ✅ | ✅ | ✅ | ✅ |
| POST /auth/register/gourmet | ✅ | ✅ | ✅ | ✅ |
| POST /auth/login | ✅ | ✅ | ✅ | ✅ |
| POST /auth/refresh | ✅ | ✅ | ✅ | ✅ |
| POST /auth/logout | ❌ | ✅ | ✅ | ✅ |
| **Kullanıcı Profili** |
| GET /users/me | ❌ | ✅ | ✅ | ✅ |
| PATCH /users/me | ❌ | ✅ | ✅ | ✅ |
| DELETE /users/me | ❌ | ✅ | ✅ | ✅ |
| GET /users/{userId} | ✅ | ✅ | ✅ | ✅ |
| **Restoran** |
| GET /restaurants | ✅ | ✅ | ✅ | ✅ |
| GET /restaurants/{restaurantId} | ✅ | ✅ | ✅ | ✅ |
| POST /restaurants | ❌ | ❌ | ❌ | ✅ |
| PATCH /restaurants/{restaurantId} | ❌ | ❌ | ❌ | ✅ |
| DELETE /restaurants/{restaurantId} | ❌ | ❌ | ❌ | ✅ |
| **Değerlendirme** |
| GET /restaurants/{restaurantId}/reviews | ✅ | ✅ | ✅ | ✅ |
| POST /restaurants/{restaurantId}/reviews | ❌ | ✅ | ✅ | ✅ |
| POST /restaurants/{restaurantId}/reviews/gourmet | ❌ | ❌ | ✅ | ✅ |
| PATCH /reviews/{reviewId} | ❌ | ✅ (own) | ✅ (own) | ✅ |
| DELETE /reviews/{reviewId} | ❌ | ✅ (own) | ✅ (own) | ✅ |
| POST /reviews/{reviewId}/helpful | ❌ | ✅ | ✅ | ✅ |
| **Fotoğraf** |
| POST /photos/upload-url | ❌ | ✅ | ✅ | ✅ |
| POST /photos/{photoId}/confirm | ❌ | ✅ (own) | ✅ (own) | ✅ |
| GET /restaurants/{restaurantId}/photos | ✅ | ✅ | ✅ | ✅ |
| DELETE /photos/{photoId} | ❌ | ✅ (own) | ✅ (own) | ✅ |
| **Arama** |
| GET /search | ✅ | ✅ | ✅ | ✅ |
| GET /restaurants/nearby | ✅ | ✅ | ✅ | ✅ |
| **Admin** |
| GET /admin/users | ❌ | ❌ | ❌ | ✅ |
| PATCH /admin/users/{userId}/role | ❌ | ❌ | ❌ | ✅ |
| PATCH /admin/users/{userId}/status | ❌ | ❌ | ❌ | ✅ |
| POST /admin/gourmet-codes | ❌ | ❌ | ❌ | ✅ |
| GET /admin/statistics | ❌ | ❌ | ❌ | ✅ |

### Yetkilendirme Notları

- ✅ : İzin verildi
- ❌ : İzin verilmedi
- (own) : Sadece kendi içeriği için izin var

**Özel Durumlar:**
- Gourmet kullanıcılar hem normal review hem de detaylı gurme değerlendirmesi yapabilir
- Admin tüm içerikleri düzenleyebilir/silebilir
- User ve Gourmet sadece kendi yorumlarını/fotoğraflarını düzenleyebilir/silebilir

## Pagination, Sorting, Filtering

### Pagination (Sayfalama)

**Cursor-based Pagination (Önerilen):**
```
GET /restaurants?cursor=eyJpZCI6InJzdF8xeDJ5M3o0YTViIiwibGFzdFNvcnQiOjQuN30&limit=20
```

**Response:**
```json
{
  "data": { ... },
  "pagination": {
    "nextCursor": "eyJpZCI6InJzdF8yeTN6NGE1YjZjIiwibGFzdFNvcnQiOjQuNX0",
    "prevCursor": "eyJpZCI6InJzdF8wdzF4MnkzejRhIiwibGFzdFNvcnQiOjQuOX0",
    "hasNextPage": true,
    "hasPreviousPage": false,
    "limit": 20
  }
}
```

**Offset-based Pagination (Alternatif):**
```
GET /restaurants?page=1&limit=20
```

**Response:**
```json
{
  "data": { ... },
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 287,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

### Sorting (Sıralama)

**Format:**
```
GET /restaurants?sort=rating&order=desc
GET /restaurants?sort=-rating  (- işareti desc için)
```

**Desteklenen Sort Alanları:**
- Restoranlar: `rating`, `name`, `createdAt`, `reviewCount`
- Yorumlar: `createdAt`, `rating`, `helpfulCount`
- Kullanıcılar: `createdAt`, `reviewCount`, `name`

**Çoklu Sıralama:**
```
GET /restaurants?sort=rating:desc,name:asc
```

### Filtering (Filtreleme)

**Format:**
```
GET /restaurants?city=Istanbul&cuisine=Turkish&minRating=4.0&priceRange=$$$
```

**Operatörler:**
- `eq`: Eşit (default)
- `ne`: Eşit değil
- `gt`: Büyük
- `gte`: Büyük eşit
- `lt`: Küçük
- `lte`: Küçük eşit
- `in`: İçinde
- `nin`: İçinde değil

**Örnekler:**
```
GET /restaurants?rating[gte]=4.0&rating[lte]=5.0
GET /restaurants?cuisine[in]=Turkish,Mediterranean
GET /restaurants?city=Istanbul&isActive=true
GET /reviews?createdAt[gte]=2026-01-01&createdAt[lte]=2026-01-31
```

**Tam Metin Arama:**
```
GET /restaurants?search=kebap&searchFields=name,description
```

### Rate Limiting

**Limitler:**
- Guest: 100 istek/saat
- User: 1000 istek/saat
- Gourmet: 2000 istek/saat
- Admin: 10000 istek/saat

**Response Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 956
X-RateLimit-Reset: 1704477598
```

**429 Too Many Requests Response:**
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "İstek limitinizi aştınız",
    "retryAfter": 3600
  }
}
```

## Hata Kodları

### HTTP Status Codes

- `200 OK`: Başarılı
- `201 Created`: Kaynak oluşturuldu
- `204 No Content`: Başarılı, içerik yok
- `400 Bad Request`: Geçersiz istek
- `401 Unauthorized`: Kimlik doğrulama gerekli
- `403 Forbidden`: Yetki yok
- `404 Not Found`: Kaynak bulunamadı
- `409 Conflict`: Çakışma (duplicate vb.)
- `422 Unprocessable Entity`: Validasyon hatası
- `429 Too Many Requests`: Rate limit aşımı
- `500 Internal Server Error`: Sunucu hatası
- `503 Service Unavailable`: Servis kullanılamıyor

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Kullanıcı dostu hata mesajı",
    "details": "Detaylı teknik açıklama (opsiyonel)",
    "field": "fieldName (validasyon hataları için)",
    "timestamp": "2026-01-05T17:39:58Z",
    "requestId": "req_abc123def456"
  }
}
```

### Uygulama Error Kodları

| Kod | HTTP Status | Açıklama |
|-----|-------------|----------|
| INVALID_CREDENTIALS | 401 | Geçersiz email/şifre |
| TOKEN_EXPIRED | 401 | Token süresi dolmuş |
| TOKEN_INVALID | 401 | Geçersiz token |
| INSUFFICIENT_PERMISSIONS | 403 | Yetki yetersiz |
| RESOURCE_NOT_FOUND | 404 | Kaynak bulunamadı |
| USER_ALREADY_EXISTS | 409 | Kullanıcı zaten var |
| INVALID_GOURMET_CODE | 400 | Geçersiz gurme kodu |
| GOURMET_CODE_EXPIRED | 400 | Gurme kodu süresi dolmuş |
| GOURMET_CODE_USED | 400 | Gurme kodu kullanılmış |
| VALIDATION_ERROR | 422 | Validasyon hatası |
| DUPLICATE_REVIEW | 409 | Aynı restoran için yorum var |
| PHOTO_UPLOAD_FAILED | 400 | Fotoğraf yükleme başarısız |
| PHOTO_SIZE_EXCEEDED | 400 | Fotoğraf boyutu aşıldı |
| RATE_LIMIT_EXCEEDED | 429 | İstek limiti aşıldı |
| INTERNAL_ERROR | 500 | Sunucu hatası |

### Validation Error Example

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validasyon hatası",
    "errors": [
      {
        "field": "email",
        "message": "Geçerli bir email adresi giriniz"
      },
      {
        "field": "password",
        "message": "Şifre en az 8 karakter olmalıdır"
      }
    ]
  }
}
```

## CRUD Dağılımı Özeti

### Restoranlar
- **Create**: POST /restaurants (Admin)
- **Read**: GET /restaurants, GET /restaurants/{restaurantId} (Herkese açık)
- **Update**: PATCH /restaurants/{restaurantId} (Admin)
- **Delete**: DELETE /restaurants/{restaurantId} (Admin)

### Kullanıcılar
- **Create**: POST /auth/register, POST /auth/register/gourmet (Herkese açık)
- **Read**: GET /users/me (Kendi), GET /users/{userId} (Herkese açık)
- **Update**: PATCH /users/me (Kendi)
- **Delete**: DELETE /users/me (Kendi)

### Yorumlar
- **Create**: POST /restaurants/{restaurantId}/reviews (User, Gourmet)
- **Create (Detaylı)**: POST /restaurants/{restaurantId}/reviews/gourmet (Gourmet)
- **Read**: GET /restaurants/{restaurantId}/reviews (Herkese açık)
- **Update**: PATCH /reviews/{reviewId} (Kendi içeriği)
- **Delete**: DELETE /reviews/{reviewId} (Kendi içeriği veya Admin)

### Fotoğraflar
- **Create**: POST /photos/upload-url → Upload → POST /photos/{photoId}/confirm (User, Gourmet)
- **Read**: GET /restaurants/{restaurantId}/photos (Herkese açık)
- **Update**: Desteklenmez (silip yeniden yükleme gerekir)
- **Delete**: DELETE /photos/{photoId} (Kendi içeriği veya Admin)

## Güvenlik Önerileri

1. **HTTPS Only**: Tüm API çağrıları HTTPS üzerinden yapılmalı
2. **JWT Token**: Access token 1 saat, refresh token 30 gün geçerli
3. **Rate Limiting**: Role bazlı rate limiting uygulanmalı
4. **Input Validation**: Tüm inputlar server-side validate edilmeli
5. **CORS**: Sadece izinli domainlerden istek kabul edilmeli
6. **SQL Injection**: Prepared statements/ORM kullanılmalı
7. **XSS Protection**: User input'ları sanitize edilmeli
8. **File Upload**: Pre-signed URL ile direkt S3'e yükleme
9. **Password**: Bcrypt ile hash'lenmeli (minimum 10 rounds)
10. **Audit Log**: Kritik işlemler loglanmalı

## Versiyonlama

API versiyonlama stratejisi:
- URL Path: `/v1/restaurants`, `/v2/restaurants`
- Header: `Accept: application/vnd.lezzetatlasi.v1+json`

Breaking changes için yeni versiyon oluşturulmalı.
Deprecated endpoint'ler minimum 6 ay desteklenmeli.
