# Tax Invoice Generator - Playwright Testing Guide

## Overview

This project includes comprehensive end-to-end testing using Playwright. The test suite covers all major functionality including authentication, client management, invoice generation, and cross-browser compatibility.

## Test Structure

```
tests/
├── auth.spec.ts                 # Authentication tests
├── client-management.spec.ts    # Client CRUD operations
├── invoice-generation.spec.ts   # Invoice creation and PDF generation
├── invoice-history.spec.ts      # Invoice history and search
├── integration.spec.ts          # End-to-end workflow tests
├── performance.spec.ts          # Performance and load tests
├── security.spec.ts             # Security and validation tests
├── cross-browser.spec.ts        # Cross-browser compatibility
├── example-usage.spec.ts        # Example tests using helpers
├── test-data.json              # Test data configuration
└── utils/
    └── test-helpers.ts         # Reusable test utilities
```

## Installation

Install Playwright and its dependencies:

```bash
npm install
npm run test:install
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests with browser UI (headed mode)
npm run test:headed

# Run tests with Playwright UI (interactive mode)
npm run test:ui

# Debug tests step by step
npm run test:debug

# View test report
npm run test:report
```

### Specific Test Categories

```bash
# Run authentication tests only
npx playwright test auth.spec.ts

# Run client management tests
npx playwright test client-management.spec.ts

# Run performance tests
npx playwright test performance.spec.ts

# Run security tests
npx playwright test security.spec.ts
```

### Browser-Specific Testing

```bash
# Run tests on Chrome only
npx playwright test --project=chromium

# Run tests on Firefox only
npx playwright test --project=firefox

# Run tests on Safari only
npx playwright test --project=webkit

# Run mobile tests
npx playwright test --project="Mobile Chrome"
```

## Test Configuration

The tests are configured in `playwright.config.ts` with the following features:

- **Multi-browser support**: Chrome, Firefox, Safari, Edge
- **Mobile testing**: iPhone and Android device simulation
- **Automatic screenshots**: On test failures
- **Video recording**: On test failures
- **Trace collection**: For debugging failed tests
- **Parallel execution**: Tests run in parallel for speed
- **Auto-retry**: Failed tests retry automatically

## Test Data Management

Test data is managed in `tests/test-data.json`:

```json
{
  "testUsers": {
    "validAdmin": {
      "username": "Invoice",
      "password": "test123"
    }
  },
  "testClients": [...],
  "testInvoices": [...],
  "testScenarios": {...}
}
```

## Test Helpers

The `TestHelpers` class provides reusable utilities:

```typescript
const helpers = new TestHelpers(page);

// Login with default credentials
await helpers.login();

// Create test client
await helpers.createTestClient(clientData);

// Create test invoice
await helpers.createTestInvoice(clientData, invoiceData);

// Download and verify PDF
await helpers.downloadAndVerifyPDF(pattern);

// Measure performance
const loadTime = await helpers.measurePageLoadTime(() => page.click('text=Dashboard'));
```

## Test Scenarios Covered

### Authentication (TC001-TC003)
- Valid/invalid login attempts
- Session management
- Logout functionality
- Token security

### Client Management (TC004-TC008)
- Create, read, update, delete clients
- Form validation
- Search functionality
- Data persistence

### Invoice Generation (TC009-TC012)
- Complete invoice creation workflow
- Client selection and auto-population
- Real-time preview updates
- PDF generation and download

### Invoice History (TC013-TC015)
- Invoice listing and display
- Comprehensive search functionality
- PDF download from history

### Integration Tests (TC016-TC017)
- End-to-end workflows
- Database persistence
- Cross-module functionality

### Performance Tests (TC018-TC020)
- Page load performance
- Search performance
- PDF generation speed
- Concurrent user handling

### Security Tests (TC021-TC024)
- Authentication security
- Input validation
- XSS prevention
- SQL injection protection
- API security

### Cross-Browser Tests (TC025-TC028)
- Chrome, Firefox, Safari compatibility
- Mobile responsiveness
- Touch interactions
- Browser-specific features

## Running Tests in CI/CD

Example GitHub Actions workflow:

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:install
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## Test Reports

Playwright generates comprehensive HTML reports with:

- Test execution summary
- Screenshots of failures
- Video recordings
- Error traces
- Performance metrics
- Browser compatibility matrix

Access reports with:
```bash
npm run test:report
```

## Debugging Failed Tests

### Debug Mode
```bash
# Run specific test in debug mode
npx playwright test auth.spec.ts --debug
```

### Trace Viewer
```bash
# View trace for failed test
npx playwright show-trace trace.zip
```

### Screenshots and Videos
Failed tests automatically capture:
- Screenshots at failure point
- Video recording of entire test
- Browser console logs
- Network requests

## Best Practices

### Test Organization
- Group related tests in describe blocks
- Use descriptive test names with test case IDs
- Keep tests independent and isolated
- Use beforeEach for common setup

### Data Management
- Use unique test data to avoid conflicts
- Clean up test data after tests
- Use realistic test data, not mock data
- Store reusable data in test-data.json

### Assertions
- Use appropriate Playwright assertions
- Verify both positive and negative scenarios
- Check visual elements and functionality
- Validate error messages and edge cases

### Performance
- Run tests in parallel when possible
- Use page.waitForLoadState() for reliability
- Implement proper timeouts
- Monitor test execution times

## Troubleshooting

### Common Issues

**Tests failing due to timing**
```typescript
// Wait for network idle
await page.waitForLoadState('networkidle');

// Wait for specific element
await page.waitForSelector('text=Expected Content');
```

**PDF download issues**
```typescript
// Setup download handler before triggering
const downloadPromise = page.waitForEvent('download');
await page.click('text=Download PDF');
const download = await downloadPromise;
```

**Authentication state issues**
```typescript
// Clear storage before each test
await page.evaluate(() => localStorage.clear());
```

### Debug Commands

```bash
# Run with verbose logging
DEBUG=pw:api npx playwright test

# Run specific test with console output
npx playwright test --reporter=line auth.spec.ts

# Generate test code
npx playwright codegen localhost:5000
```

## Maintenance

### Regular Updates
- Update test data monthly
- Review and update selectors for UI changes
- Monitor test execution times
- Update browser versions

### Test Environment
- Keep test database clean
- Monitor test environment performance
- Regular backup of test configurations
- Update dependencies regularly

This comprehensive testing suite ensures your Tax Invoice Generator application is thoroughly tested across all browsers, devices, and scenarios before production deployment.