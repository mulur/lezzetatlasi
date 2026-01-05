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
