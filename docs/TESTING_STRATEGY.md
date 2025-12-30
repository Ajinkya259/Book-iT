# Book-iT: Testing Strategy

**Version:** 1.0
**Date:** December 2024

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types](#test-types)
3. [Testing Tools](#testing-tools)
4. [Test Structure](#test-structure)
5. [Unit Tests](#unit-tests)
6. [Integration Tests](#integration-tests)
7. [E2E Tests](#e2e-tests)
8. [Test Cases by Feature](#test-cases-by-feature)
9. [CI/CD Integration](#cicd-integration)
10. [iOS Testing](#ios-testing)

---

## Testing Philosophy

### Principles

1. **Test behavior, not implementation** - Focus on what the code does, not how
2. **High-value tests first** - Prioritize critical paths (auth, booking)
3. **Fast feedback** - Unit tests should run in seconds
4. **Realistic integration tests** - Use test database, not mocks
5. **E2E for critical flows** - Happy paths and key error scenarios

### Test Coverage Goals

| Type | Target | Priority |
|------|--------|----------|
| Unit Tests | 80%+ for utilities/helpers | High |
| Integration Tests | All API endpoints | High |
| E2E Tests | Critical user flows | Medium |

---

## Test Types

### 1. Unit Tests

- Test individual functions in isolation
- Mock external dependencies
- Fast execution (< 1ms per test)
- Run on every commit

### 2. Integration Tests

- Test API endpoints with real database
- Test database queries
- Use test database (reset between tests)
- Run on every commit

### 3. E2E Tests

- Test complete user flows
- Browser-based (Playwright)
- Run before deployment
- Slower, fewer tests

---

## Testing Tools

### Next.js (Web + API)

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit & integration test runner |
| **Testing Library** | React component testing |
| **MSW** | API mocking for frontend |
| **Playwright** | E2E browser testing |
| **Prisma** | Test database management |

### iOS (SwiftUI)

| Tool | Purpose |
|------|---------|
| **XCTest** | Unit & integration tests |
| **XCUITest** | UI testing |

---

## Test Structure

### Directory Layout

```
book-it-web/
├── src/
│   ├── lib/
│   │   └── utils/
│   │       ├── slots.ts
│   │       └── slots.test.ts      # Co-located unit tests
│   └── app/
│       └── api/
│           └── bookings/
│               └── route.ts
├── tests/
│   ├── setup.ts                   # Test setup & utilities
│   ├── helpers/
│   │   ├── db.ts                  # Database helpers
│   │   ├── auth.ts                # Auth helpers
│   │   └── factories.ts           # Test data factories
│   ├── integration/
│   │   ├── auth.test.ts
│   │   ├── vendors.test.ts
│   │   ├── services.test.ts
│   │   ├── bookings.test.ts
│   │   └── reviews.test.ts
│   └── e2e/
│       ├── booking-flow.spec.ts
│       ├── vendor-onboarding.spec.ts
│       └── search.spec.ts
├── vitest.config.ts
└── playwright.config.ts
```

### Configuration Files

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.ts', '**/*.test.tsx'],
    exclude: ['**/e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['tests/**', '**/*.d.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'Mobile Safari', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Unit Tests

### What to Unit Test

- Utility functions (date formatting, slug generation)
- Time slot calculation logic
- Validation schemas (Zod)
- Price formatting
- Distance calculations

### Example: Time Slot Calculation

```typescript
// src/lib/utils/slots.test.ts
import { describe, it, expect } from 'vitest';
import {
  generateTimeSlots,
  filterAvailableSlots,
  isSlotInPast,
} from './slots';

describe('generateTimeSlots', () => {
  it('generates correct slots for 30-min service in 8-hour day', () => {
    const slots = generateTimeSlots({
      startTime: '09:00',
      endTime: '17:00',
      duration: 30,
      buffer: 0,
    });

    expect(slots).toHaveLength(16); // (8 * 60) / 30 = 16
    expect(slots[0]).toEqual({ startTime: '09:00', endTime: '09:30' });
    expect(slots[15]).toEqual({ startTime: '16:30', endTime: '17:00' });
  });

  it('includes buffer time between slots', () => {
    const slots = generateTimeSlots({
      startTime: '09:00',
      endTime: '10:00',
      duration: 20,
      buffer: 10, // 10 min buffer
    });

    // 20 min service + 10 min buffer = 30 min blocks
    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({ startTime: '09:00', endTime: '09:20' });
    expect(slots[1]).toEqual({ startTime: '09:30', endTime: '09:50' });
  });

  it('handles duration longer than available time', () => {
    const slots = generateTimeSlots({
      startTime: '09:00',
      endTime: '09:30',
      duration: 60,
      buffer: 0,
    });

    expect(slots).toHaveLength(0);
  });
});

describe('filterAvailableSlots', () => {
  const allSlots = [
    { startTime: '09:00', endTime: '09:30' },
    { startTime: '09:30', endTime: '10:00' },
    { startTime: '10:00', endTime: '10:30' },
    { startTime: '10:30', endTime: '11:00' },
  ];

  it('removes slots that overlap with existing bookings', () => {
    const existingBookings = [
      { startTime: '09:30', endTime: '10:00' },
    ];

    const available = filterAvailableSlots(allSlots, existingBookings);

    expect(available).toHaveLength(3);
    expect(available.map(s => s.startTime)).toEqual(['09:00', '10:00', '10:30']);
  });

  it('handles booking that spans multiple slots', () => {
    const existingBookings = [
      { startTime: '09:30', endTime: '10:30' }, // Spans 2 slots
    ];

    const available = filterAvailableSlots(allSlots, existingBookings);

    expect(available).toHaveLength(2);
    expect(available.map(s => s.startTime)).toEqual(['09:00', '10:30']);
  });

  it('returns all slots when no bookings exist', () => {
    const available = filterAvailableSlots(allSlots, []);
    expect(available).toHaveLength(4);
  });
});

describe('isSlotInPast', () => {
  it('returns true for past slots on today', () => {
    const now = new Date('2024-01-15T10:30:00');
    const result = isSlotInPast('09:00', '2024-01-15', now);
    expect(result).toBe(true);
  });

  it('returns false for future slots on today', () => {
    const now = new Date('2024-01-15T10:30:00');
    const result = isSlotInPast('14:00', '2024-01-15', now);
    expect(result).toBe(false);
  });

  it('returns false for any slot on future date', () => {
    const now = new Date('2024-01-15T10:30:00');
    const result = isSlotInPast('09:00', '2024-01-16', now);
    expect(result).toBe(false);
  });
});
```

### Example: Validation Schema

```typescript
// src/lib/validations/booking.test.ts
import { describe, it, expect } from 'vitest';
import { createBookingSchema } from './booking';

describe('createBookingSchema', () => {
  const validData = {
    vendorId: 'uuid-vendor',
    serviceId: 'uuid-service',
    date: '2024-01-15',
    startTime: '14:00',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+1234567890',
  };

  it('accepts valid booking data', () => {
    const result = createBookingSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = createBookingSchema.safeParse({
      ...validData,
      customerEmail: 'not-an-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date format', () => {
    const result = createBookingSchema.safeParse({
      ...validData,
      date: '15-01-2024', // Wrong format
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid time format', () => {
    const result = createBookingSchema.safeParse({
      ...validData,
      startTime: '2:00 PM', // Should be 24h format
    });
    expect(result.success).toBe(false);
  });

  it('allows optional phone', () => {
    const { customerPhone, ...dataWithoutPhone } = validData;
    const result = createBookingSchema.safeParse(dataWithoutPhone);
    expect(result.success).toBe(true);
  });
});
```

---

## Integration Tests

### Test Database Setup

```typescript
// tests/setup.ts
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma/client';

beforeAll(async () => {
  // Ensure we're using test database
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Tests must use test database!');
  }
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.$transaction([
    prisma.review.deleteMany(),
    prisma.booking.deleteMany(),
    prisma.service.deleteMany(),
    prisma.availability.deleteMany(),
    prisma.vendorException.deleteMany(),
    prisma.vendorImage.deleteMany(),
    prisma.categoriesOnVendors.deleteMany(),
    prisma.vendor.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
```

### Test Factories

```typescript
// tests/helpers/factories.ts
import { prisma } from '@/lib/prisma/client';
import { UserRole, BookingStatus } from '@prisma/client';

export async function createTestUser(overrides = {}) {
  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@example.com`,
      role: UserRole.CUSTOMER,
      ...overrides,
    },
  });
}

export async function createTestVendor(userId: string, overrides = {}) {
  return prisma.vendor.create({
    data: {
      userId,
      businessName: 'Test Vendor',
      slug: `test-vendor-${Date.now()}`,
      email: 'vendor@example.com',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      postalCode: '12345',
      latitude: 40.7128,
      longitude: -74.0060,
      timezone: 'America/New_York',
      ...overrides,
    },
  });
}

export async function createTestService(vendorId: string, overrides = {}) {
  return prisma.service.create({
    data: {
      vendorId,
      name: 'Test Service',
      duration: 30,
      price: 25.00,
      ...overrides,
    },
  });
}

export async function createTestCustomer(userId: string, overrides = {}) {
  return prisma.customer.create({
    data: {
      userId,
      name: 'Test Customer',
      ...overrides,
    },
  });
}

export async function createTestBooking(
  vendorId: string,
  serviceId: string,
  customerId: string,
  overrides = {}
) {
  return prisma.booking.create({
    data: {
      vendorId,
      serviceId,
      customerId,
      date: new Date('2024-01-15'),
      startTime: '14:00',
      endTime: '14:30',
      status: BookingStatus.CONFIRMED,
      customerName: 'Test Customer',
      customerEmail: 'customer@example.com',
      ...overrides,
    },
  });
}

export async function createVendorWithAvailability() {
  const user = await createTestUser({ role: UserRole.VENDOR });
  const vendor = await createTestVendor(user.id);

  // Set availability Mon-Fri 9-17
  for (let day = 1; day <= 5; day++) {
    await prisma.availability.create({
      data: {
        vendorId: vendor.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        isActive: true,
      },
    });
  }

  return { user, vendor };
}
```

### API Integration Test Example

```typescript
// tests/integration/bookings.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { POST as createBooking } from '@/app/api/bookings/route';
import {
  createTestUser,
  createVendorWithAvailability,
  createTestService,
  createTestCustomer,
  createTestBooking,
} from '../helpers/factories';
import { prisma } from '@/lib/prisma/client';
import { UserRole } from '@prisma/client';

describe('POST /api/bookings', () => {
  let vendor: any;
  let service: any;
  let customer: any;
  let customerUser: any;

  beforeEach(async () => {
    // Setup test data
    const vendorData = await createVendorWithAvailability();
    vendor = vendorData.vendor;
    service = await createTestService(vendor.id);

    customerUser = await createTestUser({ role: UserRole.CUSTOMER });
    customer = await createTestCustomer(customerUser.id);
  });

  it('creates a booking for available slot', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        vendorId: vendor.id,
        serviceId: service.id,
        date: '2024-01-15', // Monday
        startTime: '14:00',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
      },
    });

    // Mock authenticated user
    req.user = { id: customerUser.id, role: 'CUSTOMER' };

    const response = await createBooking(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('CONFIRMED');
    expect(data.data.startTime).toBe('14:00');
  });

  it('rejects booking for unavailable slot', async () => {
    // Create existing booking for the same slot
    await createTestBooking(vendor.id, service.id, customer.id, {
      date: new Date('2024-01-15'),
      startTime: '14:00',
      endTime: '14:30',
    });

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        vendorId: vendor.id,
        serviceId: service.id,
        date: '2024-01-15',
        startTime: '14:00',
        customerName: 'Jane Doe',
        customerEmail: 'jane@example.com',
      },
    });

    req.user = { id: customerUser.id, role: 'CUSTOMER' };

    const response = await createBooking(req);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('SLOT_UNAVAILABLE');
  });

  it('rejects booking outside vendor availability', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        vendorId: vendor.id,
        serviceId: service.id,
        date: '2024-01-14', // Sunday - vendor closed
        startTime: '14:00',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
      },
    });

    req.user = { id: customerUser.id, role: 'CUSTOMER' };

    const response = await createBooking(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
  });

  it('prevents double-booking race condition', async () => {
    // Simulate two simultaneous booking requests
    const bookingPromises = Array(2).fill(null).map(() => {
      const { req } = createMocks({
        method: 'POST',
        body: {
          vendorId: vendor.id,
          serviceId: service.id,
          date: '2024-01-15',
          startTime: '14:00',
          customerName: 'Test',
          customerEmail: 'test@example.com',
        },
      });
      req.user = { id: customerUser.id, role: 'CUSTOMER' };
      return createBooking(req);
    });

    const responses = await Promise.all(bookingPromises);
    const results = await Promise.all(responses.map(r => r.json()));

    // Exactly one should succeed
    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].error.code).toBe('SLOT_UNAVAILABLE');
  });
});
```

---

## E2E Tests

### Booking Flow Test

```typescript
// tests/e2e/booking-flow.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Create test vendor via API or seed
    // Login as customer
  });

  test('customer can book an appointment', async ({ page }) => {
    // 1. Navigate to vendor page
    await page.goto('/vendor/test-barber-shop');
    await expect(page.locator('h1')).toContainText('Test Barber Shop');

    // 2. Select a service
    await page.click('text=Haircut');
    await expect(page.locator('[data-testid="service-detail"]')).toBeVisible();

    // 3. Click "Book Now"
    await page.click('button:has-text("Book Now")');

    // 4. Select date (pick tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.click(`[data-date="${tomorrow.toISOString().split('T')[0]}"]`);

    // 5. Select time slot
    await page.click('[data-testid="slot-14:00"]');

    // 6. Fill booking form
    await page.fill('[name="customerName"]', 'John Doe');
    await page.fill('[name="customerEmail"]', 'john@example.com');
    await page.fill('[name="customerPhone"]', '+1234567890');

    // 7. Confirm booking
    await page.click('button:has-text("Confirm Booking")');

    // 8. Verify success
    await expect(page.locator('[data-testid="booking-confirmation"]')).toBeVisible();
    await expect(page.locator('text=Booking Confirmed')).toBeVisible();
  });

  test('shows error when slot becomes unavailable', async ({ page }) => {
    // TODO: Test scenario where another user books the slot
    // while current user is on confirmation page
  });

  test('validates required fields', async ({ page }) => {
    await page.goto('/vendor/test-barber-shop');
    await page.click('text=Haircut');
    await page.click('button:has-text("Book Now")');

    // Try to submit without filling required fields
    await page.click('button:has-text("Confirm Booking")');

    await expect(page.locator('text=Name is required')).toBeVisible();
    await expect(page.locator('text=Email is required')).toBeVisible();
  });
});
```

---

## Test Cases by Feature

### Authentication Test Cases

| ID | Test Case | Type |
|----|-----------|------|
| AUTH-001 | Register with valid email creates user | Integration |
| AUTH-002 | Register with existing email fails | Integration |
| AUTH-003 | Login with correct credentials succeeds | Integration |
| AUTH-004 | Login with wrong password fails | Integration |
| AUTH-005 | Protected route without token returns 401 | Integration |
| AUTH-006 | Protected route with valid token succeeds | Integration |
| AUTH-007 | Vendor route with customer token returns 403 | Integration |
| AUTH-008 | Logout invalidates session | Integration |
| AUTH-009 | Complete registration flow works | E2E |

### Vendor Test Cases

| ID | Test Case | Type |
|----|-----------|------|
| VEN-001 | Create vendor profile succeeds | Integration |
| VEN-002 | Create vendor with duplicate slug fails | Integration |
| VEN-003 | Update vendor profile succeeds | Integration |
| VEN-004 | Get vendor by ID returns correct data | Integration |
| VEN-005 | Get vendor by slug returns correct data | Integration |
| VEN-006 | Vendor onboarding flow works | E2E |

### Service Test Cases

| ID | Test Case | Type |
|----|-----------|------|
| SVC-001 | Create service succeeds | Integration |
| SVC-002 | Create service with negative price fails | Integration |
| SVC-003 | Create service with zero duration fails | Integration |
| SVC-004 | Update service succeeds | Integration |
| SVC-005 | Delete service soft-deletes | Integration |
| SVC-006 | List services returns active only | Integration |

### Booking Test Cases

| ID | Test Case | Type |
|----|-----------|------|
| BOOK-001 | Get slots for future date succeeds | Integration |
| BOOK-002 | Get slots for past date returns empty | Integration |
| BOOK-003 | Get slots for closed day returns empty | Integration |
| BOOK-004 | Create booking for available slot succeeds | Integration |
| BOOK-005 | Create booking for booked slot fails | Integration |
| BOOK-006 | Double-booking prevention works | Integration |
| BOOK-007 | Cancel booking as customer succeeds | Integration |
| BOOK-008 | Cancel booking as vendor succeeds | Integration |
| BOOK-009 | View own booking succeeds | Integration |
| BOOK-010 | View other's booking fails | Integration |
| BOOK-011 | Slots respect buffer time | Unit |
| BOOK-012 | Slots respect lead time | Unit |
| BOOK-013 | Complete booking flow works | E2E |

### Search Test Cases

| ID | Test Case | Type |
|----|-----------|------|
| SRCH-001 | Search by location returns nearby | Integration |
| SRCH-002 | Search with category filter works | Integration |
| SRCH-003 | Search with rating filter works | Integration |
| SRCH-004 | Sort by distance works | Integration |
| SRCH-005 | Sort by rating works | Integration |
| SRCH-006 | Pagination works correctly | Integration |
| SRCH-007 | Search on map updates results | E2E |

### Review Test Cases

| ID | Test Case | Type |
|----|-----------|------|
| REV-001 | Create review for completed booking succeeds | Integration |
| REV-002 | Create review for pending booking fails | Integration |
| REV-003 | Create duplicate review fails | Integration |
| REV-004 | Rating outside 1-5 fails | Integration |
| REV-005 | Vendor response succeeds | Integration |
| REV-006 | Average rating updates correctly | Integration |

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: bookit_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Setup test database
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/bookit_test

      - name: Run unit & integration tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/bookit_test

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/bookit_test

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### NPM Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## iOS Testing

### XCTest Unit Tests

```swift
// BookItTests/SlotCalculationTests.swift
import XCTest
@testable import BookIt

final class SlotCalculationTests: XCTestCase {

    func testGenerateTimeSlots() {
        let slots = SlotCalculator.generateSlots(
            startTime: "09:00",
            endTime: "17:00",
            duration: 30,
            buffer: 0
        )

        XCTAssertEqual(slots.count, 16)
        XCTAssertEqual(slots.first?.startTime, "09:00")
        XCTAssertEqual(slots.last?.endTime, "17:00")
    }

    func testFilterUnavailableSlots() {
        let allSlots = [
            Slot(startTime: "09:00", endTime: "09:30"),
            Slot(startTime: "09:30", endTime: "10:00"),
            Slot(startTime: "10:00", endTime: "10:30"),
        ]

        let bookedSlots = [
            Slot(startTime: "09:30", endTime: "10:00"),
        ]

        let available = SlotCalculator.filterAvailable(
            slots: allSlots,
            booked: bookedSlots
        )

        XCTAssertEqual(available.count, 2)
    }
}
```

### XCUITest E2E Tests

```swift
// BookItUITests/BookingFlowTests.swift
import XCTest

final class BookingFlowTests: XCTestCase {

    let app = XCUIApplication()

    override func setUpWithError() throws {
        continueAfterFailure = false
        app.launch()
    }

    func testBookAppointmentFlow() throws {
        // Login
        app.textFields["Email"].tap()
        app.textFields["Email"].typeText("test@example.com")
        app.secureTextFields["Password"].tap()
        app.secureTextFields["Password"].typeText("password123")
        app.buttons["Login"].tap()

        // Navigate to vendor
        app.searchFields["Search"].tap()
        app.searchFields["Search"].typeText("Barber")
        app.cells.firstMatch.tap()

        // Select service
        app.staticTexts["Haircut"].tap()
        app.buttons["Book Now"].tap()

        // Select date and time
        // ... date picker interaction

        // Confirm
        app.buttons["Confirm Booking"].tap()

        // Assert success
        XCTAssertTrue(app.staticTexts["Booking Confirmed"].exists)
    }
}
```

---

## Running Tests

### Commands

```bash
# Run all unit & integration tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run specific test file
npm run test -- slots.test.ts

# Run tests matching pattern
npm run test -- --grep "booking"
```

---

*Document maintained by: Book-iT Team*
*Last Updated: December 2024*
