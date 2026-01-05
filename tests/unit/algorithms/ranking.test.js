/**
 * User Ranking System Unit Tests
 * Tests for the user rank calculation and promotion/demotion logic
 */

const { 
  calculateUserRank, 
  updateUserRank, 
  getRankLevel,
  evaluateUserQuality 
} = require('../../../src/algorithms/ranking');

describe('User Ranking - Basic Rank Calculation', () => {
  describe('New User', () => {
    it('should assign "Yeni Gurme" rank to new users', () => {
      const user = { 
        reviewCount: 0, 
        totalScore: 0,
        createdAt: new Date()
      };
      
      const rank = calculateUserRank(user);
      expect(rank).toBe('Yeni Gurme');
    });

    it('should assign "Yeni Gurme" to users with less than 10 reviews', () => {
      const user = { 
        reviewCount: 5, 
        averageScore: 4.5 
      };
      
      const rank = calculateUserRank(user);
      expect(rank).toBe('Yeni Gurme');
    });
  });

  describe('Experienced User', () => {
    it('should assign "Gurme" rank to users with 10-49 reviews', () => {
      const user = { 
        reviewCount: 25, 
        averageScore: 4.0 
      };
      
      const rank = calculateUserRank(user);
      expect(rank).toBe('Gurme');
    });

    it('should assign "Master Chef" rank to users with 50+ reviews and high quality', () => {
      const user = { 
        reviewCount: 50, 
        averageScore: 4.2,
        helpfulVotes: 100 
      };
      
      const rank = calculateUserRank(user);
      expect(rank).toBe('Master Chef');
    });

    it('should assign "Elite Gurme" rank to top tier users', () => {
      const user = { 
        reviewCount: 200, 
        averageScore: 4.5,
        helpfulVotes: 500,
        verified: true 
      };
      
      const rank = calculateUserRank(user);
      expect(rank).toBe('Elite Gurme');
    });
  });
});

describe('User Ranking - Rank Criteria', () => {
  describe('Multiple Criteria Check', () => {
    it('should require all criteria to be met for promotion', () => {
      const users = [
        { reviewCount: 50, averageScore: 2.0, helpfulVotes: 0 }, // quantity but not quality
        { reviewCount: 5, averageScore: 5.0, helpfulVotes: 50 },  // quality but not quantity
      ];
      
      users.forEach(user => {
        const rank = calculateUserRank(user);
        expect(rank).not.toBe('Master Chef');
      });
    });

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
  });

  describe('Quality Thresholds', () => {
    it('should require minimum average score for higher ranks', () => {
      const user = { 
        reviewCount: 100, 
        averageScore: 2.5, // Low quality
        helpfulVotes: 10 
      };
      
      const rank = calculateUserRank(user);
      expect(['Yeni Gurme', 'Gurme']).toContain(rank);
    });

    it('should reward high quality with faster progression', () => {
      const highQualityUser = { 
        reviewCount: 15, 
        averageScore: 4.8,
        helpfulVotes: 30 
      };
      
      const mediumQualityUser = { 
        reviewCount: 30, 
        averageScore: 3.5,
        helpfulVotes: 10 
      };
      
      const highRank = getRankLevel(calculateUserRank(highQualityUser));
      const mediumRank = getRankLevel(calculateUserRank(mediumQualityUser));
      
      expect(highRank).toBeGreaterThanOrEqual(mediumRank);
    });
  });
});

describe('User Ranking - Rank Promotion', () => {
  it('should promote user when criteria are met', () => {
    const user = { 
      id: 'user-123',
      reviewCount: 9, 
      rank: 'Yeni Gurme',
      averageScore: 4.0,
      helpfulVotes: 5
    };
    
    // Simulate adding one more review to meet criteria
    const updatedUser = {
      ...user,
      reviewCount: 10,
      averageScore: 4.1,
      helpfulVotes: 6
    };
    
    const result = updateUserRank(updatedUser);
    
    expect(result.newRank).toBe('Gurme');
    expect(result.promoted).toBe(true);
    expect(result.notification).toBeDefined();
    expect(result.notification.title).toMatch(/promoted|terfi/i);
  });

  it('should not promote if criteria not fully met', () => {
    const user = { 
      reviewCount: 10, 
      rank: 'Yeni Gurme',
      averageScore: 2.0, // Too low
      helpfulVotes: 0
    };
    
    const result = updateUserRank(user);
    
    expect(result.promoted).toBe(false);
    expect(result.newRank).toBe('Yeni Gurme');
  });

  it('should include rank benefits in promotion notification', () => {
    const user = { 
      reviewCount: 50, 
      rank: 'Gurme',
      averageScore: 4.5,
      helpfulVotes: 100
    };
    
    const result = updateUserRank(user);
    
    if (result.promoted) {
      expect(result.benefits).toBeDefined();
      expect(result.benefits).toContain('badge');
      expect(result.benefits.length).toBeGreaterThan(0);
    }
  });
});

describe('User Ranking - Rank Demotion', () => {
  describe('Quality-based Demotion', () => {
    it('should demote users with consistently low-quality reviews', () => {
      const user = { 
        id: 'user-456',
        rank: 'Master Chef',
        reviewCount: 50,
        recentReviews: [
          { score: 1.0, helpful: 0, reported: 2 },
          { score: 1.5, helpful: 0, reported: 3 },
          { score: 2.0, helpful: 0, reported: 1 },
          { score: 1.0, helpful: 0, reported: 2 },
          { score: 2.5, helpful: 1, reported: 1 }
        ]
      };
      
      const result = evaluateUserQuality(user);
      
      expect(result.shouldDemote).toBe(true);
      expect(result.newRank).not.toBe('Master Chef');
      expect(result.reason).toMatch(/quality|spam|abuse/i);
    });

    it('should not demote users with temporary low scores', () => {
      const user = { 
        rank: 'Master Chef',
        reviewCount: 100,
        averageScore: 4.5,
        recentReviews: [
          { score: 2.0, helpful: 5, reported: 0 }, // One low score
          { score: 4.5, helpful: 10, reported: 0 },
          { score: 5.0, helpful: 15, reported: 0 },
          { score: 4.0, helpful: 8, reported: 0 }
        ]
      };
      
      const result = evaluateUserQuality(user);
      
      expect(result.shouldDemote).toBe(false);
    });
  });

  describe('Abuse-based Demotion', () => {
    it('should demote users with multiple abuse reports', () => {
      const user = { 
        rank: 'Master Chef',
        reviewCount: 50,
        abuseReports: 5,
        suspensions: 2
      };
      
      const result = evaluateUserQuality(user);
      
      expect(result.shouldDemote).toBe(true);
      expect(result.reason).toMatch(/abuse|violation/i);
    });

    it('should consider spam detection in demotion', () => {
      const user = { 
        rank: 'Gurme',
        reviewCount: 30,
        spamScore: 0.85, // High spam probability
        duplicateContent: 10
      };
      
      const result = evaluateUserQuality(user);
      
      expect(result.shouldDemote).toBe(true);
      expect(result.reason).toMatch(/spam/i);
    });
  });

  describe('Inactivity-based Demotion', () => {
    it('should consider inactivity in rank maintenance', () => {
      const user = { 
        rank: 'Elite Gurme',
        reviewCount: 200,
        lastReviewDate: new Date('2024-01-01'), // 2 years ago
        averageScore: 4.5
      };
      
      const result = evaluateUserQuality(user);
      
      // Elite rank might require activity
      expect(result.activityWarning).toBe(true);
    });
  });
});

describe('User Ranking - Rank Levels', () => {
  it('should return correct numerical level for each rank', () => {
    const ranks = {
      'Yeni Gurme': 1,
      'Gurme': 2,
      'Master Chef': 3,
      'Elite Gurme': 4
    };
    
    Object.entries(ranks).forEach(([rank, expectedLevel]) => {
      expect(getRankLevel(rank)).toBe(expectedLevel);
    });
  });

  it('should compare ranks correctly', () => {
    expect(getRankLevel('Master Chef')).toBeGreaterThan(getRankLevel('Gurme'));
    expect(getRankLevel('Gurme')).toBeGreaterThan(getRankLevel('Yeni Gurme'));
    expect(getRankLevel('Elite Gurme')).toBeGreaterThan(getRankLevel('Master Chef'));
  });
});

describe('User Ranking - Edge Cases', () => {
  it('should handle users with zero helpful votes', () => {
    const user = { 
      reviewCount: 50, 
      averageScore: 4.5,
      helpfulVotes: 0 
    };
    
    const rank = calculateUserRank(user);
    expect(rank).toBeDefined();
  });

  it('should handle null or undefined values gracefully', () => {
    const invalidUsers = [
      null,
      undefined,
      {},
      { reviewCount: null },
      { averageScore: undefined }
    ];
    
    invalidUsers.forEach(user => {
      expect(() => calculateUserRank(user)).not.toThrow();
    });
  });

  it('should handle very high review counts', () => {
    const user = { 
      reviewCount: 10000, 
      averageScore: 4.5,
      helpfulVotes: 5000 
    };
    
    const rank = calculateUserRank(user);
    expect(rank).toBe('Elite Gurme');
  });

  it('should handle decimal review counts appropriately', () => {
    const user = { 
      reviewCount: 10.7, // Should be treated as 10
      averageScore: 4.0 
    };
    
    expect(() => calculateUserRank(user)).not.toThrow();
  });
});

describe('User Ranking - Rank Progress', () => {
  it('should calculate progress towards next rank', () => {
    const user = { 
      reviewCount: 7,
      averageScore: 4.0,
      helpfulVotes: 5,
      rank: 'Yeni Gurme'
    };
    
    const result = updateUserRank(user, { includeProgress: true });
    
    expect(result.progress).toBeDefined();
    expect(result.progress.current).toBe(7);
    expect(result.progress.required).toBe(10);
    expect(result.progress.percentage).toBeCloseTo(70, 0);
  });

  it('should show multiple criteria progress', () => {
    const user = { 
      reviewCount: 8,
      averageScore: 3.5,
      helpfulVotes: 3,
      rank: 'Yeni Gurme'
    };
    
    const result = updateUserRank(user, { includeProgress: true });
    
    expect(result.progress.criteria).toBeDefined();
    expect(result.progress.criteria.reviews.met).toBe(false);
    expect(result.progress.criteria.quality.met).toBe(false);
  });
});