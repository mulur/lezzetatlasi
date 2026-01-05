/**
 * Test Setup and Helper Functions
 * Common utilities for test initialization, cleanup, and data management
 */

const fs = require('fs').promises;
const path = require('path');

// Load fixture data
async function loadFixture(fixtureName) {
  const fixturePath = path.join(__dirname, '..', 'fixtures', `${fixtureName}.json`);
  const data = await fs.readFile(fixturePath, 'utf-8');
  return JSON.parse(data);
}

// Database setup and teardown
async function setupTestDatabase() {
  console.log('Setting up test database...');
  
  // Load fixtures
  const users = await loadFixture('users');
  const restaurants = await loadFixture('restaurants');
  const reviews = await loadFixture('reviews');
  
  // Initialize database with test data
  // In a real implementation, this would seed the database
  global.testData = {
    users: users.users,
    restaurants: restaurants.restaurants,
    reviews: reviews.reviews,
    roles: users.roles,
    ranks: users.ranks
  };
  
  console.log('Test database setup complete');
}

async function cleanupTestDatabase() {
  console.log('Cleaning up test database...');
  
  // Clean up test data
  // In a real implementation, this would truncate tables or drop test database
  delete global.testData;
  
  console.log('Test database cleanup complete');
}

// Reset database between tests
async function resetTestDatabase() {
  await cleanupTestDatabase();
  await setupTestDatabase();
}

// Mock data generators
function generateMockUser(overrides = {}) {
  return {
    id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    username: `testuser_${Math.random().toString(36).substr(2, 9)}`,
    email: `test_${Math.random().toString(36).substr(2, 9)}@example.com`,
    password: '$2b$10$hashedpassword',
    role: 'reviewer',
    rank: 'Yeni Gurme',
    reviewCount: 0,
    averageScore: 0,
    helpfulVotes: 0,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

function generateMockRestaurant(overrides = {}) {
  return {
    id: `rest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name: `Test Restaurant ${Math.random().toString(36).substr(2, 5)}`,
    cuisine: 'Turkish',
    address: 'Test Address, Istanbul',
    phone: '+90-212-555-0000',
    priceRange: '$$',
    gurmeScore: null,
    reviewCount: 0,
    averageRatings: null,
    verified: false,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

function generateMockReview(userId, restaurantId, overrides = {}) {
  return {
    id: `review-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId,
    restaurantId,
    ratings: {
      taste: 4.0,
      service: 4.0,
      ambiance: 4.0,
      priceValue: 4.0,
      cleanliness: 4.0
    },
    comment: 'Test review comment',
    photos: [],
    helpfulCount: 0,
    notHelpfulCount: 0,
    reported: 0,
    verified: false,
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

function generateMockInvite(overrides = {}) {
  return {
    inviteCode: `invite-${Math.random().toString(36).substr(2, 16)}`,
    email: `invite_${Math.random().toString(36).substr(2, 9)}@example.com`,
    role: 'reviewer',
    used: false,
    revoked: false,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    ...overrides
  };
}

// Authentication helpers
function generateMockToken(userId, role = 'reviewer') {
  // In a real implementation, this would generate a valid JWT
  return `mock-jwt-token-${userId}-${role}`;
}

async function authenticateTestUser(role = 'reviewer') {
  const user = generateMockUser({ role });
  const token = generateMockToken(user.id, role);
  return { user, token };
}

// Assertion helpers
function expectValidGurmeScore(score) {
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(100);
  expect(typeof score).toBe('number');
  expect(Number.isFinite(score)).toBe(true);
}

function expectValidRank(rank) {
  const validRanks = ['Yeni Gurme', 'Gurme', 'Master Chef', 'Elite Gurme'];
  expect(validRanks).toContain(rank);
}

function expectValidRole(role) {
  const validRoles = ['basic', 'reviewer', 'moderator', 'admin'];
  expect(validRoles).toContain(role);
}

function expectValidReview(review) {
  expect(review).toMatchObject({
    id: expect.any(String),
    userId: expect.any(String),
    restaurantId: expect.any(String),
    ratings: {
      taste: expect.any(Number),
      service: expect.any(Number)
    },
    createdAt: expect.any(String)
  });
  
  // Validate rating ranges
  Object.values(review.ratings).forEach(rating => {
    expect(rating).toBeGreaterThanOrEqual(0);
    expect(rating).toBeLessThanOrEqual(5);
  });
}

function expectValidRestaurant(restaurant) {
  expect(restaurant).toMatchObject({
    id: expect.any(String),
    name: expect.any(String),
    cuisine: expect.any(String),
    address: expect.any(String)
  });
}

// Time helpers
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function isWithinTimeWindow(timestamp, windowSeconds) {
  const now = Date.now();
  const diff = Math.abs(now - new Date(timestamp).getTime());
  return diff <= windowSeconds * 1000;
}

// Rate limit helpers
async function exhaustRateLimit(userId, endpoint, limit) {
  const requests = [];
  for (let i = 0; i < limit; i++) {
    requests.push({ userId, endpoint, timestamp: Date.now() });
  }
  return requests;
}

// Spam detection helpers
function generateSimilarContent(baseContent, variations = 3) {
  const contents = [baseContent];
  
  for (let i = 0; i < variations; i++) {
    // Make slight variations
    const varied = baseContent
      .replace(/amazing/gi, 'wonderful')
      .replace(/great/gi, 'excellent')
      .replace(/good/gi, 'nice');
    contents.push(varied);
  }
  
  return contents;
}

// Mock email service
const mockEmailService = {
  sentEmails: [],
  
  send: async function(email) {
    this.sentEmails.push(email);
    return { success: true, messageId: `msg-${Date.now()}` };
  },
  
  clear: function() {
    this.sentEmails = [];
  },
  
  getLastEmail: function() {
    return this.sentEmails[this.sentEmails.length - 1];
  },
  
  findEmail: function(criteria) {
    return this.sentEmails.find(email => {
      return Object.entries(criteria).every(([key, value]) => {
        if (typeof value === 'string') {
          return email[key]?.includes(value);
        }
        return email[key] === value;
      });
    });
  }
};

// Abuse prevention helpers (for testing abuse prevention logic)
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

// Mock authentication functions (for integration tests)
async function getAuthToken(role = 'reviewer') {
  // Mock implementation - would actually authenticate and return token
  return `mock-token-${role}`;
}

async function createTestUser(overrides = {}) {
  // Mock implementation
  const user = generateMockUser(overrides);
  return user.id;
}

async function createTestInvite(adminToken, overrides = {}) {
  // Mock implementation
  return generateMockInvite(overrides);
}

async function createExpiredInvite() {
  // Mock implementation
  const invite = generateMockInvite({
    expiresAt: new Date(Date.now() - 1000).toISOString() // Already expired
  });
  return invite;
}

// Export all helpers
module.exports = {
  // Database
  setupTestDatabase,
  cleanupTestDatabase,
  resetTestDatabase,
  loadFixture,
  
  // Mock generators
  generateMockUser,
  generateMockRestaurant,
  generateMockReview,
  generateMockInvite,
  
  // Authentication
  generateMockToken,
  authenticateTestUser,
  getAuthToken,
  createTestUser,
  createTestInvite,
  createExpiredInvite,
  
  // Assertions
  expectValidGurmeScore,
  expectValidRank,
  expectValidRole,
  expectValidReview,
  expectValidRestaurant,
  
  // Time
  sleep,
  getDateDaysAgo,
  isWithinTimeWindow,
  
  // Rate limiting
  exhaustRateLimit,
  
  // Spam detection
  generateSimilarContent,
  
  // Abuse prevention
  calculateAbuseScore,
  getActionRecommendation,
  
  // Mock services
  mockEmailService
};
