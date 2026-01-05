# Test Documentation

## Running Tests

This directory contains comprehensive unit and integration tests for the Lezzet Atlası project.

### Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch
```

### Test Categories

#### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run specific test suites
npm run test:gurmescore    # GurmeScore algorithm tests
npm run test:ranking       # User ranking tests
npm run test:abuse         # Abuse prevention tests
```

#### Integration Tests
```bash
# Run all integration tests
npm run test:integration

# Run specific test suites
npm run test:invite        # Invite/role flow tests
```

#### End-to-End Tests
```bash
npm run test:e2e
```

### Test Structure

```
tests/
├── unit/                          # Unit tests
│   ├── algorithms/
│   │   ├── gurmescore.test.js    # GurmeScore calculation tests
│   │   └── ranking.test.js        # User ranking tests
│   ├── api/                       # API validation tests
│   ├── auth/                      # Authentication tests
│   └── security/
│       └── abuse-prevention.test.js  # Rate limiting, spam detection
├── integration/                   # Integration tests
│   ├── api/                       # API endpoint tests
│   ├── workflows/
│   │   └── invite-flow.test.js    # Invite and role flow tests
│   └── security/                  # Security integration tests
├── e2e/                          # End-to-end tests
│   ├── user-journeys/
│   └── critical-paths/
├── fixtures/                     # Test data
│   ├── users.json
│   ├── restaurants.json
│   └── reviews.json
└── helpers/                      # Test utilities
    ├── test-setup.js            # Setup and helper functions
    ├── mock-data.js
    └── assertions.js
```

## Test Coverage Goals

- **Overall Coverage**: Minimum 80%
- **Critical Paths**: 100% coverage
  - GurmeScore calculation
  - Rank calculation
  - Abuse detection
  - Authentication flows

### Viewing Coverage Reports

After running tests with coverage:

```bash
npm run test:coverage

# Open the HTML report
open coverage/index.html
```

## Writing Tests

### Test Naming Convention

Use descriptive test names following the "Given-When-Then" pattern:

```javascript
describe('GurmeScore Calculation', () => {
  it('should return 100 for perfect ratings across all criteria', () => {
    // Given: Perfect ratings
    const review = { taste: 5.0, service: 5.0, ... };
    
    // When: Calculate score
    const score = calculateGurmeScore(review);
    
    // Then: Score is 100
    expect(score).toBe(100);
  });
});
```

### Using Test Fixtures

```javascript
const { loadFixture } = require('../helpers/test-setup');

describe('My Test', () => {
  let testData;
  
  beforeAll(async () => {
    const users = await loadFixture('users');
    testData = users.users[0];
  });
  
  it('should use fixture data', () => {
    expect(testData.username).toBe('yenigurme');
  });
});
```

### Using Mock Generators

```javascript
const { generateMockUser, generateMockReview } = require('../helpers/test-setup');

it('should create user and review', () => {
  const user = generateMockUser({ rank: 'Master Chef' });
  const review = generateMockReview(user.id, 'rest-1', {
    ratings: { taste: 5.0 }
  });
  
  expect(user.rank).toBe('Master Chef');
  expect(review.ratings.taste).toBe(5.0);
});
```

## Test Data Management

### Fixtures
- Located in `tests/fixtures/`
- JSON files containing realistic test data
- Used for integration tests

### Mock Data Generators
- Located in `tests/helpers/test-setup.js`
- Generate random test data for unit tests
- Ensure test isolation

## Continuous Integration

Tests are automatically run on:
- Every commit to a PR
- Before merging to main branch
- Scheduled daily runs

### CI Configuration

```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: npm run test:ci

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Debugging Tests

### Running Single Test
```bash
npm test -- tests/unit/algorithms/gurmescore.test.js
```

### Running with Verbose Output
```bash
npm run test:verbose
```

### Running Specific Test Cases
```bash
npm test -- --testNamePattern="should return 100"
```

### Using Jest Debugger
```bash
node --inspect-brk node_modules/.bin/jest tests/unit/algorithms/gurmescore.test.js
```

Then open Chrome DevTools: `chrome://inspect`

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to reset state
- Don't rely on test execution order

### 2. Clear Test Names
- Use descriptive names that explain what is being tested
- Follow "should" pattern: "should return error when input is invalid"

### 3. AAA Pattern
```javascript
it('should calculate average score', () => {
  // Arrange
  const reviews = [{ score: 5 }, { score: 4 }];
  
  // Act
  const average = calculateAverage(reviews);
  
  // Assert
  expect(average).toBe(4.5);
});
```

### 4. Test Edge Cases
- Null/undefined values
- Empty arrays/objects
- Boundary values (min/max)
- Invalid input types

### 5. Mock External Dependencies
```javascript
jest.mock('../services/email');
const emailService = require('../services/email');

it('should send email', async () => {
  emailService.send.mockResolvedValue({ success: true });
  
  await sendInvite('test@example.com');
  
  expect(emailService.send).toHaveBeenCalledWith(
    expect.objectContaining({
      to: 'test@example.com'
    })
  );
});
```

## Troubleshooting

### Tests are slow
- Use `jest --maxWorkers=4` to limit parallelism
- Check for unnecessary waits or timeouts
- Mock external services

### Flaky tests
- Check for timing issues
- Ensure proper test isolation
- Use `jest.retryTimes(3)` for inherently flaky tests

### Coverage not updating
- Delete `coverage/` directory
- Run `npm run test:coverage` again
- Check `.gitignore` doesn't exclude source files

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [Test Strategy Document](../TEST_STRATEGY.md)
- [Test Scenarios Document](../TEST_SCENARIOS.md)

## Support

For questions or issues:
1. Check existing test examples
2. Review test strategy documentation
3. Ask in team chat or create an issue
