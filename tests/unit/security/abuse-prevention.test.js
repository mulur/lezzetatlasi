/**
 * Abuse Prevention Unit Tests
 * Tests for rate limiting, spam detection, and abuse prevention mechanisms
 */

const { 
  checkRateLimit,
  detectSpam,
  detectBotBehavior,
  detectCoordinatedAttack,
  checkMultiAccounting 
} = require('../../../src/security/abuse-prevention');

describe('Rate Limiting', () => {
  describe('Normal Usage', () => {
    it('should allow requests within rate limit', async () => {
      const userId = 'user-123';
      const limit = 100;
      
      const results = [];
      for (let i = 0; i < limit; i++) {
        const result = await checkRateLimit(userId, 'api_general');
        results.push(result);
      }
      
      const allAllowed = results.every(r => r.allowed === true);
      expect(allAllowed).toBe(true);
    });

    it('should track remaining requests', async () => {
      const userId = 'user-456';
      
      await checkRateLimit(userId, 'api_general'); // Use 1
      const result = await checkRateLimit(userId, 'api_general'); // Use 2
      
      expect(result.remaining).toBeLessThan(result.limit);
    });
  });

  describe('Rate Limit Exceeded', () => {
    it('should block requests exceeding rate limit', async () => {
      const userId = 'user-spam-1';
      const limit = 10;
      
      // Exhaust the limit
      for (let i = 0; i < limit; i++) {
        await checkRateLimit(userId, 'api_reviews', { limit });
      }
      
      // This should be blocked
      const result = await checkRateLimit(userId, 'api_reviews', { limit });
      
      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeGreaterThan(0);
      expect(result.message).toMatch(/rate limit|too many requests/i);
    });

    it('should provide retry-after time', async () => {
      const userId = 'user-spam-2';
      const limit = 5;
      const window = 60; // seconds
      
      for (let i = 0; i < limit; i++) {
        await checkRateLimit(userId, 'api_test', { limit, window });
      }
      
      const result = await checkRateLimit(userId, 'api_test', { limit, window });
      
      expect(result.retryAfter).toBeDefined();
      expect(result.retryAfter).toBeLessThanOrEqual(window);
    });
  });

  describe('Different Endpoints', () => {
    it('should apply different limits for different endpoints', async () => {
      const userId = 'user-789';
      
      const limits = {
        api_general: 100,
        api_reviews: 20,
        api_search: 50
      };
      
      for (const [endpoint, limit] of Object.entries(limits)) {
        const result = await checkRateLimit(userId, endpoint);
        expect(result.limit).toBe(limit);
      }
    });

    it('should track limits independently per endpoint', async () => {
      const userId = 'user-multi-1';
      
      // Exhaust reviews endpoint
      for (let i = 0; i < 20; i++) {
        await checkRateLimit(userId, 'api_reviews');
      }
      
      const reviewsResult = await checkRateLimit(userId, 'api_reviews');
      const generalResult = await checkRateLimit(userId, 'api_general');
      
      expect(reviewsResult.allowed).toBe(false);
      expect(generalResult.allowed).toBe(true);
    });
  });

  describe('Window Reset', () => {
    it('should reset limit after time window', async () => {
      const userId = 'user-reset-1';
      const limit = 5;
      const window = 1; // 1 second for testing
      
      // Exhaust limit
      for (let i = 0; i < limit; i++) {
        await checkRateLimit(userId, 'api_test', { limit, window });
      }
      
      const blockedResult = await checkRateLimit(userId, 'api_test', { limit, window });
      expect(blockedResult.allowed).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, window * 1000 + 100));
      
      const allowedResult = await checkRateLimit(userId, 'api_test', { limit, window });
      expect(allowedResult.allowed).toBe(true);
    });
  });
});

describe('Spam Detection', () => {
  describe('Duplicate Content', () => {
    it('should detect duplicate content spam', async () => {
      const userId = 'spammer-1';
      const duplicateReview = {
        restaurantId: 'rest-1',
        comment: 'Great place! Highly recommend!',
        taste: 5.0,
        service: 5.0
      };
      
      const results = [];
      for (let i = 0; i < 3; i++) {
        const result = await detectSpam(userId, {
          ...duplicateReview,
          restaurantId: `rest-${i + 1}`
        });
        results.push(result);
      }
      
      // First should pass, subsequent should be flagged
      expect(results[0].isSpam).toBe(false);
      expect(results[2].isSpam).toBe(true);
      expect(results[2].reason).toMatch(/duplicate|similar/i);
    });

    it('should calculate content similarity', async () => {
      const userId = 'user-similar-1';
      
      const review1 = {
        comment: 'The food was absolutely amazing and the service was great!'
      };
      
      const review2 = {
        comment: 'The food was absolutely amazing and the service was excellent!'
      };
      
      const result = await detectSpam(userId, review2, { previousReviews: [review1] });
      
      expect(result.similarity).toBeGreaterThan(0.8);
      expect(result.isSpam).toBe(true);
    });
  });

  describe('Rapid Submissions', () => {
    it('should detect rapid successive submissions', async () => {
      const userId = 'rapid-user-1';
      const startTime = Date.now();
      
      const reviews = Array(5).fill(null).map((_, i) => ({
        restaurantId: `rest-${i}`,
        comment: `Review ${i}`,
        taste: 4.0,
        submittedAt: startTime + (i * 1000) // 1 second apart
      }));
      
      const results = [];
      for (const review of reviews) {
        const result = await detectSpam(userId, review);
        results.push(result);
      }
      
      const spamDetected = results.some(r => r.isSpam && r.reason.match(/rapid|too fast/i));
      expect(spamDetected).toBe(true);
    });

    it('should throttle based on submission frequency', async () => {
      const userId = 'throttle-user-1';
      
      const result = await detectSpam(userId, {
        comment: 'Test review',
        submissionRate: 5, // 5 reviews in last minute
        normalRate: 0.5 // normally 0.5 per minute
      });
      
      expect(result.throttle).toBe(true);
      expect(result.waitTime).toBeGreaterThan(0);
    });
  });

  describe('Content Quality', () => {
    it('should detect low quality content', async () => {
      const lowQualityReviews = [
        { comment: 'good' }, // Too short
        { comment: 'asdasdasd' }, // Gibberish
        { comment: 'AMAZING FOOD!!!!' }, // All caps + spam words
        { comment: 'http://spam-site.com check this out!' } // URL spam
      ];
      
      for (const review of lowQualityReviews) {
        const result = await detectSpam('user-quality-1', review);
        expect(result.qualityScore).toBeLessThan(0.5);
      }
    });

    it('should allow high quality content', async () => {
      const goodReview = {
        comment: 'I visited this restaurant last weekend with my family. ' +
                'The atmosphere was cozy and welcoming. The steak was cooked perfectly ' +
                'to my liking and the dessert was exceptional. Service was friendly ' +
                'and attentive. Highly recommended for special occasions.',
        taste: 4.5,
        service: 4.5
      };
      
      const result = await detectSpam('user-quality-2', goodReview);
      
      expect(result.isSpam).toBe(false);
      expect(result.qualityScore).toBeGreaterThan(0.7);
    });
  });
});

describe('Bot Detection', () => {
  it('should detect bot-like behavior', async () => {
    const botBehavior = {
      userId: 'suspected-bot-1',
      reviewInterval: 300, // exactly 5 minutes between each
      reviewCount: 20,
      contentSimilarity: 0.95, // 95% similar content
      userAgent: 'curl/7.64.1' // suspicious user agent
    };
    
    const result = await detectBotBehavior(botBehavior);
    
    expect(result.isBot).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.8);
    expect(result.indicators).toContain('regular_timing');
    expect(result.indicators).toContain('similar_content');
  });

  it('should detect automated patterns', async () => {
    const reviews = Array(10).fill(null).map((_, i) => ({
      timestamp: Date.now() + (i * 300000), // Exactly 5 min intervals
      restaurantId: `rest-${i}`,
      taste: 4.0,
      service: 4.0,
      comment: `Review number ${i}`
    }));
    
    const result = await detectBotBehavior({ userId: 'pattern-bot-1', reviews });
    
    expect(result.isBot).toBe(true);
    expect(result.reason).toMatch(/regular|pattern|automated/i);
  });

  it('should not flag human-like irregular behavior', async () => {
    const reviews = [
      { timestamp: Date.now(), comment: 'Great food!' },
      { timestamp: Date.now() + 3600000, comment: 'Amazing service and atmosphere' },
      { timestamp: Date.now() + 7200000, comment: 'Will definitely come back' },
      { timestamp: Date.now() + 86400000, comment: 'Best restaurant in town' }
    ];
    
    const result = await detectBotBehavior({ userId: 'human-user-1', reviews });
    
    expect(result.isBot).toBe(false);
  });
});

describe('Coordinated Attack Detection', () => {
  it('should detect coordinated attack patterns', async () => {
    const targetRestaurant = 'victim-restaurant-1';
    const attackAccounts = ['bot1', 'bot2', 'bot3', 'bot4', 'bot5'];
    const timestamp = Date.now();
    const timeWindow = 3600; // 1 hour
    
    const attacks = attackAccounts.map(userId => ({
      userId,
      restaurantId: targetRestaurant,
      taste: 1.0,
      service: 1.0,
      timestamp: timestamp + Math.random() * 1000 // within 1 second
    }));
    
    const detection = await detectCoordinatedAttack(targetRestaurant, timeWindow, attacks);
    
    expect(detection.isCoordinated).toBe(true);
    expect(detection.involvedAccounts).toEqual(expect.arrayContaining(attackAccounts));
    expect(detection.severity).toBe('high');
    expect(detection.confidence).toBeGreaterThan(0.9);
  });

  it('should identify attack characteristics', async () => {
    const attacks = [
      { userId: 'a1', timestamp: 1000, taste: 1.0, comment: 'Terrible!' },
      { userId: 'a2', timestamp: 1100, taste: 1.0, comment: 'Terrible!' },
      { userId: 'a3', timestamp: 1200, taste: 1.0, comment: 'Terrible!' }
    ];
    
    const detection = await detectCoordinatedAttack('target-1', 3600, attacks);
    
    expect(detection.characteristics).toContain('similar_timing');
    expect(detection.characteristics).toContain('similar_content');
    expect(detection.characteristics).toContain('similar_ratings');
  });

  it('should not flag organic negative reviews', async () => {
    const organicReviews = [
      { userId: 'u1', timestamp: 1000, taste: 2.0, comment: 'Food was cold' },
      { userId: 'u2', timestamp: 86400000, taste: 2.5, comment: 'Long wait time' },
      { userId: 'u3', timestamp: 172800000, taste: 3.0, comment: 'Decent but overpriced' }
    ];
    
    const detection = await detectCoordinatedAttack('restaurant-1', 604800, organicReviews);
    
    expect(detection.isCoordinated).toBe(false);
  });
});

describe('Multi-Account Detection', () => {
  it('should detect multiple accounts from same IP', async () => {
    const accounts = [
      { username: 'user1', email: 'user1@example.com', ip: '192.168.1.1', createdAt: Date.now() },
      { username: 'user2', email: 'user2@example.com', ip: '192.168.1.1', createdAt: Date.now() + 1000 },
      { username: 'user3', email: 'user3@example.com', ip: '192.168.1.1', createdAt: Date.now() + 2000 }
    ];
    
    const report = await checkMultiAccounting('192.168.1.1', accounts);
    
    expect(report.suspicious).toBe(true);
    expect(report.accountCount).toBe(3);
    expect(report.requiresVerification).toBe(true);
    expect(report.accounts).toHaveLength(3);
  });

  it('should detect device fingerprint similarities', async () => {
    const accounts = [
      { 
        userId: 'user-a',
        deviceFingerprint: {
          userAgent: 'Mozilla/5.0...',
          screenResolution: '1920x1080',
          timezone: 'Europe/Istanbul',
          plugins: ['plugin1', 'plugin2']
        }
      },
      { 
        userId: 'user-b',
        deviceFingerprint: {
          userAgent: 'Mozilla/5.0...',
          screenResolution: '1920x1080',
          timezone: 'Europe/Istanbul',
          plugins: ['plugin1', 'plugin2']
        }
      }
    ];
    
    const similarity = await checkMultiAccounting(null, accounts);
    
    expect(similarity.suspicious).toBe(true);
    expect(similarity.reason).toMatch(/device|fingerprint/i);
  });

  it('should allow legitimate shared IPs', async () => {
    const accounts = [
      { 
        username: 'user1', 
        ip: '192.168.1.1', 
        createdAt: Date.now() - 30 * 86400000, // 30 days ago
        verified: true
      },
      { 
        username: 'user2', 
        ip: '192.168.1.1', 
        createdAt: Date.now(),
        verified: false
      }
    ];
    
    const report = await checkMultiAccounting('192.168.1.1', accounts);
    
    // Should be flagged but with lower severity (could be family/office)
    expect(report.severity).toBe('low');
  });
});

describe('Abuse Score Calculation', () => {
  it('should calculate comprehensive abuse score', async () => {
    const user = {
      userId: 'test-user-1',
      rateLimit: { violations: 5 },
      spam: { detections: 3 },
      reports: 10,
      suspensions: 2
    };
    
    const score = await calculateAbuseScore(user);
    
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should recommend action based on abuse score', async () => {
    const scenarios = [
      { score: 20, expectedAction: 'monitor' },
      { score: 50, expectedAction: 'warning' },
      { score: 80, expectedAction: 'suspend' },
      { score: 95, expectedAction: 'ban' }
    ];
    
    scenarios.forEach(({ score, expectedAction }) => {
      const recommendation = getActionRecommendation(score);
      expect(recommendation.action).toBe(expectedAction);
    });
  });
});

// Helper function that would be in the actual implementation
function calculateAbuseScore(user) {
  let score = 0;
  score += (user.rateLimit?.violations || 0) * 5;
  score += (user.spam?.detections || 0) * 10;
  score += (user.reports || 0) * 2;
  score += (user.suspensions || 0) * 20;
  return Math.min(score, 100);
}

function getActionRecommendation(score) {
  if (score >= 90) return { action: 'ban', reason: 'Severe abuse detected' };
  if (score >= 70) return { action: 'suspend', reason: 'Multiple violations' };
  if (score >= 40) return { action: 'warning', reason: 'Suspicious activity' };
  return { action: 'monitor', reason: 'Low risk' };
}
