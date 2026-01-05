/**
 * GurmeScore Algorithm Unit Tests
 * Tests for the core scoring algorithm used to rate restaurants
 */

const { calculateGurmeScore, getScoreWeights } = require('../../../src/algorithms/gurmescore');

describe('GurmeScore - Basic Calculation', () => {
  describe('Perfect Ratings', () => {
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

  describe('Zero Reviews', () => {
    it('should return 0 when no reviews exist', () => {
      const reviews = [];
      const score = calculateGurmeScore(reviews);
      expect(score).toBe(0);
    });

    it('should return null for restaurants with no data', () => {
      const score = calculateGurmeScore(null);
      expect(score).toBeNull();
    });
  });

  describe('Partial Reviews', () => {
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

    it('should handle single criterion review', () => {
      const review = { taste: 5.0 };
      
      const score = calculateGurmeScore(review);
      expect(score).toBeDefined();
      expect(typeof score).toBe('number');
    });
  });
});

describe('GurmeScore - Weighted Average', () => {
  describe('Weight Configuration', () => {
    it('should ensure all weights sum to 1.0', () => {
      const weights = getScoreWeights();
      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 2);
    });

    it('should have taste as the highest weighted criterion', () => {
      const weights = getScoreWeights();
      const maxWeight = Math.max(...Object.values(weights));
      expect(weights.taste).toBe(maxWeight);
    });
  });

  describe('Weighted Calculation', () => {
    it('should apply correct weights to different criteria', () => {
      const review = {
        taste: 5.0,      // weight: 0.4
        service: 3.0,    // weight: 0.25
        ambiance: 2.0,   // weight: 0.15
        priceValue: 4.0, // weight: 0.1
        cleanliness: 5.0 // weight: 0.1
      };
      
      const weights = getScoreWeights();
      const expectedScore = (
        review.taste * weights.taste +
        review.service * weights.service +
        review.ambiance * weights.ambiance +
        review.priceValue * weights.priceValue +
        review.cleanliness * weights.cleanliness
      ) * 20; // Scale to 100
      
      const score = calculateGurmeScore(review);
      expect(score).toBeCloseTo(expectedScore, 1);
    });
  });
});

describe('GurmeScore - Edge Cases and Error Handling', () => {
  describe('Invalid Input Values', () => {
    it('should reject negative rating values', () => {
      const invalidReview = { taste: -1.0, service: 5.0 };
      expect(() => calculateGurmeScore(invalidReview)).toThrow(/invalid.*rating/i);
    });

    it('should reject ratings above maximum value', () => {
      const invalidReview = { taste: 6.0, service: 5.0 };
      expect(() => calculateGurmeScore(invalidReview)).toThrow(/invalid.*rating/i);
    });

    it('should handle NaN values', () => {
      const invalidReview = { taste: NaN, service: 5.0 };
      expect(() => calculateGurmeScore(invalidReview)).toThrow(/invalid.*value/i);
    });
  });

  describe('Invalid Data Types', () => {
    it('should handle invalid data types gracefully', () => {
      const invalidReviews = [
        { taste: "five", service: 5.0 },
        { taste: null, service: 5.0 },
        { taste: undefined, service: 5.0 },
        { taste: {}, service: 5.0 },
        { taste: [], service: 5.0 }
      ];
      
      invalidReviews.forEach(review => {
        expect(() => calculateGurmeScore(review)).toThrow(/invalid.*type/i);
      });
    });

    it('should require at least one valid criterion', () => {
      const emptyReview = {};
      expect(() => calculateGurmeScore(emptyReview)).toThrow(/no valid criteria/i);
    });
  });

  describe('Boundary Values', () => {
    it('should handle minimum boundary (0.0)', () => {
      const review = {
        taste: 0.0,
        service: 0.0,
        ambiance: 0.0,
        priceValue: 0.0,
        cleanliness: 0.0
      };
      
      const score = calculateGurmeScore(review);
      expect(score).toBe(0);
    });

    it('should handle maximum boundary (5.0)', () => {
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

    it('should handle decimal precision', () => {
      const review = {
        taste: 4.7,
        service: 3.8,
        ambiance: 4.2,
        priceValue: 3.5,
        cleanliness: 4.9
      };
      
      const score = calculateGurmeScore(review);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
      expect(Number.isFinite(score)).toBe(true);
    });
  });
});

describe('GurmeScore - Time Weighting', () => {
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
    
    // Score should be closer to 3.0 (60) than 5.0 (100)
    expect(score).toBeLessThan(80);
    expect(score).toBeGreaterThan(50);
  });

  it('should use decay factor for old reviews', () => {
    const reviews = [
      { taste: 5.0, service: 5.0, date: new Date('2020-01-01') }, // Very old
      { taste: 4.0, service: 4.0, date: new Date() } // Recent
    ];
    
    const score = calculateGurmeScore(reviews);
    
    // Recent review should dominate
    expect(score).toBeCloseTo(80, 0); // Closer to 4.0 (80) than 4.5 (90)
  });
});

describe('GurmeScore - Multiple Reviews Normalization', () => {
  it('should handle outlier reviews appropriately', () => {
    const reviews = [
      { taste: 5.0, service: 5.0 },
      { taste: 5.0, service: 4.5 },
      { taste: 1.0, service: 1.0 }, // outlier
      { taste: 4.5, service: 5.0 },
      { taste: 5.0, service: 4.5 }
    ];
    
    const scoreWithOutlier = calculateGurmeScore(reviews);
    const scoreWithoutOutlier = calculateGurmeScore(reviews.filter((_, i) => i !== 2));
    
    // Score should not drastically change due to one outlier
    expect(Math.abs(scoreWithOutlier - scoreWithoutOutlier)).toBeLessThan(10);
  });

  it('should calculate average for multiple reviews', () => {
    const reviews = [
      { taste: 5.0, service: 5.0 },
      { taste: 4.0, service: 4.0 },
      { taste: 3.0, service: 3.0 }
    ];
    
    const score = calculateGurmeScore(reviews);
    
    // Average should be around 4.0 (80)
    expect(score).toBeCloseTo(80, 0);
  });
});

describe('GurmeScore - Confidence Level', () => {
  it('should indicate low confidence when review count is insufficient', () => {
    const reviews = [{ taste: 5.0, service: 5.0 }];
    
    const result = calculateGurmeScore(reviews, { includeConfidence: true });
    
    expect(result.confidence).toBe('low');
    expect(result.minReviewsNeeded).toBeGreaterThan(reviews.length);
  });

  it('should indicate high confidence with many reviews', () => {
    const reviews = Array(50).fill({
      taste: 4.5,
      service: 4.0,
      ambiance: 4.5
    });
    
    const result = calculateGurmeScore(reviews, { includeConfidence: true });
    
    expect(result.confidence).toBe('high');
    expect(result.score).toBeDefined();
  });

  it('should indicate medium confidence with moderate review count', () => {
    const reviews = Array(10).fill({
      taste: 4.0,
      service: 4.0
    });
    
    const result = calculateGurmeScore(reviews, { includeConfidence: true });
    
    expect(result.confidence).toBe('medium');
  });
});
