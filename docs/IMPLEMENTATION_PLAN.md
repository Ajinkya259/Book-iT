# Book-iT: Implementation Plan

**Version:** 1.0
**Date:** December 2024
**Status:** Planning

---

## Table of Contents

1. [Implementation Phases Overview](#implementation-phases-overview)
2. [Phase 0: Project Setup](#phase-0-project-setup)
3. [Phase 1: Authentication System](#phase-1-authentication-system)
4. [Phase 2: Vendor Core](#phase-2-vendor-core)
5. [Phase 3: Booking Engine](#phase-3-booking-engine)
6. [Phase 4: Customer & Discovery](#phase-4-customer--discovery)
7. [Phase 5: Reviews & Trust](#phase-5-reviews--trust)
8. [Phase 6: Notifications](#phase-6-notifications)
9. [Phase 7: iOS App](#phase-7-ios-app)
10. [Phase 8: Polish & Launch](#phase-8-polish--launch)
11. [Critical Considerations](#critical-considerations)
12. [Risk Areas](#risk-areas)
13. [Open Questions](#open-questions)

---

## Implementation Phases Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    IMPLEMENTATION TIMELINE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 0          Phase 1         Phase 2         Phase 3               │
│  ┌──────┐        ┌──────┐        ┌──────┐        ┌──────┐               │
│  │Setup │───────▶│ Auth │───────▶│Vendor│───────▶│Booking│              │
│  └──────┘        └──────┘        └──────┘        └──────┘               │
│                                                       │                  │
│                                                       ▼                  │
│  Phase 7         Phase 6         Phase 5         Phase 4                │
│  ┌──────┐        ┌──────┐        ┌──────┐        ┌──────┐               │
│  │ iOS  │◀───────│Notify│◀───────│Review│◀───────│Search│               │
│  └──────┘        └──────┘        └──────┘        └──────┘               │
│      │                                                                   │
│      ▼                                                                   │
│  Phase 8                                                                 │
│  ┌──────┐                                                                │
│  │Launch│                                                                │
│  └──────┘                                                                │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phase Dependencies

| Phase | Depends On | Blocks |
|-------|------------|--------|
| 0: Setup | Nothing | All phases |
| 1: Auth | Phase 0 | Phases 2-7 |
| 2: Vendor | Phase 1 | Phase 3 |
| 3: Booking | Phase 2 | Phases 4, 5 |
| 4: Discovery | Phase 3 | Phase 5 |
| 5: Reviews | Phases 3, 4 | Phase 6 |
| 6: Notifications | Phase 3 | Phase 8 |
| 7: iOS | Phases 1-4 | Phase 8 |
| 8: Launch | All phases | - |

---

## Phase 0: Project Setup

**Goal:** Set up all accounts, tools, and project scaffolding.

### Tasks

#### 0.1 Create External Accounts

| Task | Service | Priority |
|------|---------|----------|
| 0.1.1 | Create Supabase account & project | P0 |
| 0.1.2 | Create Vercel account | P0 |
| 0.1.3 | Create Google Cloud account & project | P0 |
| 0.1.4 | Enable Google Maps APIs (Maps JS, iOS SDK, Places, Geocoding) | P0 |
| 0.1.5 | Get Google Maps API keys (restrict by domain/bundle ID) | P0 |
| 0.1.6 | Apple Developer account (if not already) | P1 |

#### 0.2 Initialize Next.js Project

```bash
# Commands to run
npx create-next-app@latest book-it-web --typescript --tailwind --eslint --app --src-dir
cd book-it-web
npm install prisma @prisma/client
npm install @supabase/supabase-js @supabase/ssr
npm install zod
npm install -D @types/node
```

#### 0.3 Configure Prisma

| Task | Description |
|------|-------------|
| 0.3.1 | Initialize Prisma: `npx prisma init` |
| 0.3.2 | Configure DATABASE_URL to Supabase |
| 0.3.3 | Enable PostGIS extension in Supabase |
| 0.3.4 | Create initial schema (see DATABASE_SCHEMA.md) |
| 0.3.5 | Run first migration: `npx prisma migrate dev` |

#### 0.4 Project Structure Setup

```
book-it-web/
├── src/
│   ├── app/
│   │   ├── (auth)/                 # Auth pages (login, register)
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (web)/                  # Public web pages
│   │   │   ├── page.tsx            # Homepage
│   │   │   ├── search/             # Search/discovery
│   │   │   └── vendor/[slug]/      # Vendor public profile
│   │   ├── (dashboard)/            # Protected dashboard pages
│   │   │   ├── vendor/             # Vendor dashboard
│   │   │   └── customer/           # Customer dashboard
│   │   ├── api/                    # API routes
│   │   │   ├── auth/
│   │   │   ├── vendors/
│   │   │   ├── services/
│   │   │   ├── bookings/
│   │   │   ├── reviews/
│   │   │   └── search/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                     # Base UI components
│   │   ├── forms/                  # Form components
│   │   ├── maps/                   # Map components
│   │   └── booking/                # Booking-specific components
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts           # Browser client
│   │   │   ├── server.ts           # Server client
│   │   │   └── middleware.ts       # Auth middleware
│   │   ├── prisma/
│   │   │   └── client.ts           # Prisma client singleton
│   │   ├── validations/            # Zod schemas
│   │   └── utils/
│   │       ├── dates.ts            # Date/time utilities
│   │       ├── slots.ts            # Time slot calculations
│   │       └── geo.ts              # Geospatial utilities
│   └── types/
│       └── index.ts                # Shared TypeScript types
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

#### 0.5 Environment Configuration

```env
# .env.local (example)
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

NEXT_PUBLIC_SUPABASE_URL="https://xxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="xxx"
SUPABASE_SERVICE_ROLE_KEY="xxx"

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="xxx"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

#### 0.6 Deploy Empty Shell

| Task | Description |
|------|-------------|
| 0.6.1 | Connect GitHub repo to Vercel |
| 0.6.2 | Configure environment variables in Vercel |
| 0.6.3 | Deploy and verify basic page loads |
| 0.6.4 | Set up preview deployments for PRs |

### Phase 0 Definition of Done

- [ ] All accounts created and configured
- [ ] Next.js project runs locally
- [ ] Prisma connects to Supabase successfully
- [ ] Empty shell deployed to Vercel
- [ ] Environment variables configured in all environments

---

## Phase 1: Authentication System

**Goal:** Users can register and login as Vendor or Customer.

### Tasks

#### 1.1 Database: User Tables

```prisma
// Add to schema.prisma
enum UserRole {
  VENDOR
  CUSTOMER
  ADMIN
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  role          UserRole
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  vendor        Vendor?
  customer      Customer?
}
```

#### 1.2 Supabase Auth Configuration

| Task | Description |
|------|-------------|
| 1.2.1 | Enable Email auth in Supabase |
| 1.2.2 | Configure email templates |
| 1.2.3 | Enable Apple Sign-In (for iOS) |
| 1.2.4 | Enable Google Sign-In (optional) |
| 1.2.5 | Set up auth redirect URLs |

#### 1.3 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user (vendor or customer) |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/logout` | POST | Logout current session |
| `/api/auth/me` | GET | Get current user profile |
| `/api/auth/callback` | GET | OAuth callback handler |

#### 1.4 Auth Middleware

```typescript
// src/lib/supabase/middleware.ts
// Verify JWT token on protected routes
// Extract user info and role
// Attach to request context
```

#### 1.5 Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email/password + social login |
| Register (Vendor) | `/register/vendor` | Vendor registration form |
| Register (Customer) | `/register/customer` | Customer registration form |

### Phase 1 Test Cases

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| AUTH-001 | Register with valid email | User created, verification email sent |
| AUTH-002 | Register with existing email | Error: "Email already exists" |
| AUTH-003 | Login with correct credentials | JWT token returned, session created |
| AUTH-004 | Login with wrong password | Error: "Invalid credentials" |
| AUTH-005 | Access protected route without token | 401 Unauthorized |
| AUTH-006 | Access protected route with valid token | Request proceeds |
| AUTH-007 | Access vendor route as customer | 403 Forbidden |
| AUTH-008 | Logout | Session invalidated |

### Phase 1 Definition of Done

- [ ] Users can register as Vendor or Customer
- [ ] Users can login and receive JWT
- [ ] Protected routes require authentication
- [ ] Role-based access control works
- [ ] All test cases pass

---

## Phase 2: Vendor Core

**Goal:** Vendors can create their profile, services, and set availability.

### Tasks

#### 2.1 Database: Vendor Tables

```prisma
model Vendor {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])

  // Basic Info
  businessName    String
  slug            String    @unique  // URL-friendly name
  description     String?
  phone           String?
  email           String

  // Location
  address         String
  city            String
  state           String
  postalCode      String
  country         String
  location        Unsupported("geography(Point, 4326)")?  // PostGIS

  // Media
  logoUrl         String?
  coverImageUrl   String?

  // Settings
  timezone        String    @default("UTC")
  currency        String    @default("USD")
  isActive        Boolean   @default(true)

  // Relations
  services        Service[]
  availability    Availability[]
  bookings        Booking[]
  reviews         Review[]
  images          VendorImage[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Service {
  id              String    @id @default(uuid())
  vendorId        String
  vendor          Vendor    @relation(fields: [vendorId], references: [id])

  name            String
  description     String?
  duration        Int       // Minutes
  price           Decimal   @db.Decimal(10, 2)
  currency        String    @default("USD")

  isActive        Boolean   @default(true)

  bookings        Booking[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}

model Availability {
  id              String    @id @default(uuid())
  vendorId        String
  vendor          Vendor    @relation(fields: [vendorId], references: [id])

  dayOfWeek       Int       // 0 = Sunday, 6 = Saturday
  startTime       String    // "09:00" (24h format)
  endTime         String    // "17:00"

  isActive        Boolean   @default(true)

  @@unique([vendorId, dayOfWeek])
}

model VendorImage {
  id              String    @id @default(uuid())
  vendorId        String
  vendor          Vendor    @relation(fields: [vendorId], references: [id])

  url             String
  caption         String?
  order           Int       @default(0)

  createdAt       DateTime  @default(now())
}
```

#### 2.2 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/vendors` | POST | Vendor | Create vendor profile |
| `/api/vendors/me` | GET | Vendor | Get own vendor profile |
| `/api/vendors/me` | PUT | Vendor | Update own vendor profile |
| `/api/vendors/[id]` | GET | Public | Get vendor by ID (public view) |
| `/api/vendors/[slug]` | GET | Public | Get vendor by slug |
| `/api/vendors/me/services` | GET | Vendor | List own services |
| `/api/vendors/me/services` | POST | Vendor | Create service |
| `/api/vendors/me/services/[id]` | PUT | Vendor | Update service |
| `/api/vendors/me/services/[id]` | DELETE | Vendor | Delete service |
| `/api/vendors/me/availability` | GET | Vendor | Get availability |
| `/api/vendors/me/availability` | PUT | Vendor | Set weekly availability |
| `/api/vendors/me/images` | POST | Vendor | Upload image |
| `/api/vendors/me/images/[id]` | DELETE | Vendor | Delete image |

#### 2.3 Vendor Dashboard Pages

| Page | Route | Description |
|------|-------|-------------|
| Dashboard Home | `/vendor/dashboard` | Overview, stats |
| Profile | `/vendor/profile` | Edit business profile |
| Services | `/vendor/services` | Manage services |
| Availability | `/vendor/availability` | Set working hours |
| Bookings | `/vendor/bookings` | View/manage bookings |

#### 2.4 Image Upload Flow

```
1. Frontend requests signed upload URL from API
2. API generates Supabase Storage signed URL
3. Frontend uploads directly to Supabase Storage
4. Frontend sends image URL to API to save in database
```

### Phase 2 Test Cases

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| VEN-001 | Create vendor profile with valid data | Profile created |
| VEN-002 | Create vendor with duplicate slug | Error: "Slug already taken" |
| VEN-003 | Update vendor profile | Profile updated |
| VEN-004 | Create service with valid data | Service created |
| VEN-005 | Create service with negative price | Error: "Price must be positive" |
| VEN-006 | Create service with zero duration | Error: "Duration must be positive" |
| VEN-007 | Set availability for Monday 9-17 | Availability saved |
| VEN-008 | Set overlapping availability | Error or merged slots |
| VEN-009 | Upload image under 5MB | Image uploaded |
| VEN-010 | Upload image over 5MB | Error: "File too large" |
| VEN-011 | Delete service with existing bookings | Soft delete, future bookings cancelled |

### Phase 2 Definition of Done

- [ ] Vendors can create and edit their profile
- [ ] Vendors can CRUD services
- [ ] Vendors can set weekly availability
- [ ] Vendors can upload images
- [ ] Public vendor profile page works
- [ ] All test cases pass

---

## Phase 3: Booking Engine

**Goal:** Customers can view available slots and make bookings.

### Tasks

#### 3.1 Database: Booking Tables

```prisma
enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}

model Booking {
  id              String        @id @default(uuid())

  vendorId        String
  vendor          Vendor        @relation(fields: [vendorId], references: [id])

  serviceId       String
  service         Service       @relation(fields: [serviceId], references: [id])

  customerId      String
  customer        Customer      @relation(fields: [customerId], references: [id])

  // Time
  date            DateTime      @db.Date
  startTime       String        // "14:00"
  endTime         String        // "14:30"

  // Status
  status          BookingStatus @default(PENDING)

  // Customer info (denormalized for convenience)
  customerName    String
  customerEmail   String
  customerPhone   String?

  // Notes
  customerNotes   String?
  vendorNotes     String?

  // Cancellation
  cancelledAt     DateTime?
  cancelledBy     String?       // "vendor" | "customer"
  cancellationReason String?

  review          Review?

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([vendorId, date])
  @@index([customerId])
}

model Customer {
  id              String    @id @default(uuid())
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])

  name            String
  phone           String?

  bookings        Booking[]
  reviews         Review[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

#### 3.2 Time Slot Calculation Algorithm

```typescript
// src/lib/utils/slots.ts

/**
 * Calculate available time slots for a service on a given date
 *
 * Input:
 * - vendorId
 * - serviceId (for duration)
 * - date
 *
 * Process:
 * 1. Get vendor's availability for that day of week
 * 2. Get service duration
 * 3. Get existing bookings for that date
 * 4. Generate all possible slots based on availability
 * 5. Remove slots that overlap with existing bookings
 * 6. Remove slots in the past (if date is today)
 * 7. Apply buffer time between appointments (configurable)
 *
 * Output:
 * - Array of available slots: { startTime: "14:00", endTime: "14:30" }
 */
```

#### 3.3 Booking Creation Flow (Critical: Prevent Double-Booking)

```typescript
// Pseudocode for atomic booking creation

async function createBooking(data) {
  return prisma.$transaction(async (tx) => {
    // 1. Lock the vendor's bookings for this date (SELECT FOR UPDATE)
    const existingBookings = await tx.booking.findMany({
      where: { vendorId, date, status: { not: 'CANCELLED' } },
      // Use raw query with FOR UPDATE to lock rows
    });

    // 2. Check if requested slot is still available
    const isAvailable = checkSlotAvailable(existingBookings, requestedSlot);
    if (!isAvailable) {
      throw new Error('Slot no longer available');
    }

    // 3. Create the booking
    const booking = await tx.booking.create({ data });

    // 4. Return booking
    return booking;
  });
}
```

#### 3.4 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/bookings` | POST | Customer | Create booking |
| `/api/bookings/[id]` | GET | Owner | Get booking details |
| `/api/bookings/[id]/cancel` | POST | Owner | Cancel booking |
| `/api/vendors/[id]/slots` | GET | Public | Get available slots |
| `/api/customers/me/bookings` | GET | Customer | List my bookings |
| `/api/vendors/me/bookings` | GET | Vendor | List vendor's bookings |
| `/api/vendors/me/bookings/[id]/status` | PUT | Vendor | Update booking status |

#### 3.5 Slots API Request/Response

```typescript
// GET /api/vendors/[id]/slots?serviceId=xxx&date=2024-01-15

// Response
{
  "date": "2024-01-15",
  "timezone": "America/New_York",
  "slots": [
    { "startTime": "09:00", "endTime": "09:30", "available": true },
    { "startTime": "09:30", "endTime": "10:00", "available": true },
    { "startTime": "10:00", "endTime": "10:30", "available": false },
    // ...
  ]
}
```

### Phase 3 Test Cases

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| BOOK-001 | Get slots for future date | Available slots returned |
| BOOK-002 | Get slots for past date | Empty array or error |
| BOOK-003 | Get slots for day vendor is closed | Empty array |
| BOOK-004 | Create booking for available slot | Booking created |
| BOOK-005 | Create booking for unavailable slot | Error: "Slot not available" |
| BOOK-006 | Two users book same slot simultaneously | One succeeds, one fails |
| BOOK-007 | Cancel booking as customer | Status = CANCELLED |
| BOOK-008 | Cancel booking as vendor | Status = CANCELLED |
| BOOK-009 | View booking as owner | Booking details returned |
| BOOK-010 | View booking as non-owner | 403 Forbidden |
| BOOK-011 | Slots respect buffer time | No back-to-back if buffer set |

### Phase 3 Definition of Done

- [ ] Slot calculation works correctly
- [ ] Bookings can be created atomically
- [ ] Double-booking is prevented
- [ ] Customers can view and cancel bookings
- [ ] Vendors can view and manage bookings
- [ ] All test cases pass

---

## Phase 4: Customer & Discovery

**Goal:** Customers can search for vendors by location and browse services.

### Tasks

#### 4.1 Enable PostGIS in Supabase

```sql
-- Run in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### 4.2 Location Search Query

```typescript
// Find vendors within X kilometers of a point
const vendors = await prisma.$queryRaw`
  SELECT
    v.*,
    ST_Distance(
      v.location::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    ) / 1000 as distance_km
  FROM "Vendor" v
  WHERE
    v."isActive" = true
    AND ST_DWithin(
      v.location::geography,
      ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
      ${radiusMeters}
    )
  ORDER BY distance_km
  LIMIT ${limit}
`;
```

#### 4.3 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/search` | GET | Public | Search vendors by location |
| `/api/search/nearby` | GET | Public | Get vendors near coordinates |
| `/api/categories` | GET | Public | List all categories |
| `/api/vendors/[id]/services` | GET | Public | List vendor's services |

#### 4.4 Search Query Parameters

```
GET /api/search?
  lat=40.7128&
  lng=-74.0060&
  radius=10&           // km
  category=barber&
  query=haircut&
  minRating=4&
  sortBy=distance|rating|price&
  page=1&
  limit=20
```

#### 4.5 Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Search/Home | `/` or `/search` | Map + list of vendors |
| Vendor Profile | `/vendor/[slug]` | Vendor details, services |
| Service Detail | `/vendor/[slug]/[serviceId]` | Service + booking widget |

#### 4.6 Google Maps Integration (Web)

```typescript
// Components needed:
// - MapContainer: Renders Google Map
// - VendorMarker: Shows vendor location on map
// - SearchBox: Google Places autocomplete
// - CurrentLocationButton: Get user's location
```

### Phase 4 Test Cases

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| SRCH-001 | Search with valid coordinates | Vendors within radius returned |
| SRCH-002 | Search with 0km radius | Only exact location matches |
| SRCH-003 | Search with no results | Empty array, "No results" message |
| SRCH-004 | Filter by category | Only matching category returned |
| SRCH-005 | Filter by min rating | Only vendors >= rating returned |
| SRCH-006 | Sort by distance | Closest vendors first |
| SRCH-007 | Sort by rating | Highest rated first |
| SRCH-008 | Pagination works | Correct page returned |

### Phase 4 Definition of Done

- [ ] Location search returns nearby vendors
- [ ] Google Maps displays vendors
- [ ] Filters work correctly
- [ ] Sorting works correctly
- [ ] Vendor profile page loads correctly
- [ ] All test cases pass

---

## Phase 5: Reviews & Trust

**Goal:** Customers can leave reviews for completed bookings.

### Tasks

#### 5.1 Database: Review Table

```prisma
model Review {
  id              String    @id @default(uuid())

  bookingId       String    @unique
  booking         Booking   @relation(fields: [bookingId], references: [id])

  vendorId        String
  vendor          Vendor    @relation(fields: [vendorId], references: [id])

  customerId      String
  customer        Customer  @relation(fields: [customerId], references: [id])

  rating          Int       // 1-5
  comment         String?

  // Vendor response
  vendorResponse  String?
  respondedAt     DateTime?

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([vendorId])
}
```

#### 5.2 Rating Aggregation

```typescript
// Update vendor's average rating when review is created/updated
// Option 1: Computed on read (slower for reads)
// Option 2: Stored in Vendor table, updated via trigger (faster reads)

// Using Option 2: Add to Vendor model
model Vendor {
  // ... existing fields
  averageRating   Decimal?  @db.Decimal(2, 1)  // e.g., 4.5
  totalReviews    Int       @default(0)
}
```

#### 5.3 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/reviews` | POST | Customer | Create review |
| `/api/reviews/[id]` | PUT | Customer | Update own review |
| `/api/reviews/[id]` | DELETE | Customer | Delete own review |
| `/api/vendors/[id]/reviews` | GET | Public | Get vendor's reviews |
| `/api/reviews/[id]/response` | POST | Vendor | Vendor responds to review |

#### 5.4 Review Eligibility Check

```typescript
// A customer can only review if:
// 1. They have a COMPLETED booking with this vendor
// 2. They haven't already reviewed that booking
// 3. Booking was within last 30 days (configurable)

async function canReview(customerId, bookingId) {
  const booking = await prisma.booking.findFirst({
    where: {
      id: bookingId,
      customerId,
      status: 'COMPLETED',
      review: null,
      date: { gte: subDays(new Date(), 30) }
    }
  });
  return !!booking;
}
```

### Phase 5 Test Cases

| ID | Test Case | Expected Result |
|----|-----------|-----------------|
| REV-001 | Create review for completed booking | Review created |
| REV-002 | Create review for pending booking | Error: "Booking not completed" |
| REV-003 | Create second review for same booking | Error: "Already reviewed" |
| REV-004 | Create review with rating 0 | Error: "Rating must be 1-5" |
| REV-005 | Create review with rating 6 | Error: "Rating must be 1-5" |
| REV-006 | Vendor responds to review | Response saved |
| REV-007 | Average rating updates after new review | Correct average |
| REV-008 | Get vendor reviews | Paginated list returned |

### Phase 5 Definition of Done

- [ ] Customers can create reviews for completed bookings
- [ ] Vendors can respond to reviews
- [ ] Average rating is calculated correctly
- [ ] Reviews display on vendor profile
- [ ] All test cases pass

---

## Phase 6: Notifications

**Goal:** Users receive notifications for booking events.

### Tasks

#### 6.1 Notification Types

| Event | Recipients | Channels |
|-------|------------|----------|
| Booking Created | Vendor, Customer | Email |
| Booking Confirmed | Customer | Email |
| Booking Cancelled | Vendor, Customer | Email |
| Booking Reminder (24h before) | Customer | Email |
| New Review | Vendor | Email |

#### 6.2 Email Service Setup

**Option A: Supabase Edge Functions + Resend**
**Option B: Next.js API Routes + Resend**

Recommend Option B for simplicity.

```typescript
// src/lib/email/client.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);
```

#### 6.3 Email Templates

| Template | Variables |
|----------|-----------|
| booking-confirmation | customerName, vendorName, serviceName, date, time |
| booking-cancelled | customerName, vendorName, serviceName, date, cancelledBy |
| booking-reminder | customerName, vendorName, serviceName, date, time, address |
| new-review | vendorName, customerName, rating, comment |

#### 6.4 Scheduled Jobs (Reminders)

Options:
- Vercel Cron Jobs (Pro plan)
- Supabase Edge Functions with pg_cron
- External service (Inngest, Trigger.dev)

```typescript
// Cron job: Run every hour
// Find bookings starting in 23-24 hours
// Send reminder emails
// Mark as reminder_sent
```

### Phase 6 Definition of Done

- [ ] Booking confirmation emails send
- [ ] Cancellation emails send
- [ ] Reminder system works (if implemented)
- [ ] Emails render correctly
- [ ] Unsubscribe works (if required)

---

## Phase 7: iOS App

**Goal:** Native iOS app for customers (and later vendors).

### Tasks

#### 7.1 Xcode Project Setup

```
BookIt/
├── BookIt.xcodeproj
├── BookIt/
│   ├── App/
│   │   ├── BookItApp.swift
│   │   └── ContentView.swift
│   ├── Core/
│   │   ├── Network/
│   │   │   ├── APIClient.swift
│   │   │   └── Endpoints.swift
│   │   ├── Auth/
│   │   │   └── AuthManager.swift
│   │   └── Location/
│   │       └── LocationManager.swift
│   ├── Features/
│   │   ├── Auth/
│   │   │   ├── LoginView.swift
│   │   │   └── RegisterView.swift
│   │   ├── Discovery/
│   │   │   ├── DiscoveryView.swift
│   │   │   ├── MapView.swift
│   │   │   └── VendorListView.swift
│   │   ├── Vendor/
│   │   │   ├── VendorDetailView.swift
│   │   │   └── ServiceListView.swift
│   │   ├── Booking/
│   │   │   ├── SlotPickerView.swift
│   │   │   ├── BookingConfirmView.swift
│   │   │   └── BookingListView.swift
│   │   └── Profile/
│   │       └── ProfileView.swift
│   ├── Models/
│   │   ├── User.swift
│   │   ├── Vendor.swift
│   │   ├── Service.swift
│   │   └── Booking.swift
│   └── Resources/
│       └── Assets.xcassets
└── BookItTests/
```

#### 7.2 Dependencies

```swift
// Package.swift dependencies
- Supabase Swift SDK
- Google Maps iOS SDK
- Alamofire (or URLSession)
```

#### 7.3 Core Screens

| Screen | Priority | Description |
|--------|----------|-------------|
| Login | P0 | Email + Apple Sign-In |
| Register | P0 | Customer registration |
| Discovery (Map) | P0 | Map with vendor pins |
| Discovery (List) | P0 | List of nearby vendors |
| Vendor Detail | P0 | Vendor info + services |
| Slot Picker | P0 | Calendar + time slots |
| Booking Confirm | P0 | Confirm booking details |
| My Bookings | P0 | List of bookings |
| Booking Detail | P0 | Single booking view |
| Profile | P1 | User profile |

#### 7.4 API Integration

```swift
// Use same REST API as web
// Base URL: https://book-it.vercel.app/api
// Auth: Bearer token in header
```

### Phase 7 Definition of Done

- [ ] Users can register and login
- [ ] Map shows nearby vendors
- [ ] Users can browse vendor profiles
- [ ] Users can book appointments
- [ ] Users can view their bookings
- [ ] App submitted to TestFlight

---

## Phase 8: Polish & Launch

**Goal:** Production-ready release.

### Tasks

#### 8.1 Performance

- [ ] API response times < 200ms (p95)
- [ ] Database queries optimized (indexes)
- [ ] Images optimized (compression, lazy loading)
- [ ] Web app Lighthouse score > 90

#### 8.2 Security

- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (Prisma handles)
- [ ] XSS prevention
- [ ] Rate limiting on auth endpoints
- [ ] CORS configured correctly
- [ ] Environment variables secured

#### 8.3 Monitoring

- [ ] Error tracking (Sentry or similar)
- [ ] Basic analytics (Vercel Analytics)
- [ ] Uptime monitoring

#### 8.4 Documentation

- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guides (if needed)

#### 8.5 Launch Checklist

- [ ] All features tested
- [ ] Mobile app approved by Apple
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Database backups enabled
- [ ] Terms of Service & Privacy Policy

---

## Critical Considerations

### Things I Think Might Be Missing

These are important considerations that should be addressed:

#### 1. Timezone Handling (CRITICAL)

**Problem:** Vendors and customers may be in different timezones.

**Solution:**
- Store all times in UTC in database
- Store vendor's timezone in their profile
- Convert times for display based on viewer's timezone
- Slot calculation should happen in vendor's timezone

```typescript
// Example
vendor.timezone = "America/New_York"
booking.startTime = "14:00"  // This is 14:00 in vendor's timezone
booking.startTimeUtc = "2024-01-15T19:00:00Z"  // Stored in UTC
```

#### 2. Buffer Time Between Appointments

**Problem:** Vendors may need prep time between clients.

**Solution:**
- Add `bufferMinutes` field to Vendor or Service
- Include buffer when calculating available slots
- e.g., 30min service + 10min buffer = 40min blocks

#### 3. Booking Lead Time

**Problem:** Vendors shouldn't allow instant bookings.

**Solution:**
- Add `minLeadTimeHours` to Vendor (e.g., 2 hours)
- Don't show slots within that window
- Prevents "book for 5 minutes from now" chaos

#### 4. Cancellation Policy

**Problem:** Last-minute cancellations hurt vendors.

**Solution:**
- Add `cancellationWindowHours` to Vendor (e.g., 24 hours)
- Allow free cancellation before window
- Track cancellation reasons
- Consider penalty system (future)

#### 5. Exception Dates (Holidays, Vacations)

**Problem:** Regular availability doesn't account for holidays.

**Solution:**
```prisma
model VendorException {
  id          String   @id @default(uuid())
  vendorId    String
  vendor      Vendor   @relation(...)
  date        DateTime @db.Date
  isClosed    Boolean  @default(true)  // true = closed, false = special hours
  startTime   String?  // if special hours
  endTime     String?
  reason      String?  // "Holiday", "Vacation", etc.
}
```

#### 6. Soft Deletes

**Problem:** Hard-deleting vendors/services breaks booking history.

**Solution:**
- Add `deletedAt DateTime?` to Vendor, Service, Customer
- Filter out deleted records in normal queries
- Preserve for historical bookings

#### 7. Slug Generation

**Problem:** Need URL-friendly vendor names.

**Solution:**
```typescript
// "Joe's Barber Shop" -> "joes-barber-shop"
// Handle duplicates: "joes-barber-shop-2"
import slugify from 'slugify';

async function generateUniqueSlug(name: string) {
  let slug = slugify(name, { lower: true, strict: true });
  let counter = 1;
  while (await prisma.vendor.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }
  return slug;
}
```

#### 8. Search Performance

**Problem:** Full-text search on services/vendors.

**Solution:**
- Use PostgreSQL full-text search
- Or add search index (Algolia, Meilisearch) later
- For MVP, LIKE queries may suffice

#### 9. Image Optimization

**Problem:** Large images slow down the app.

**Solution:**
- Validate max file size (5MB)
- Resize on upload (max 1200px width)
- Serve via Supabase CDN
- Use Next.js Image component (automatic optimization)

#### 10. Rate Limiting

**Problem:** Prevent API abuse.

**Solution:**
```typescript
// Options:
// - Vercel Edge Middleware
// - Upstash Rate Limit
// - Simple in-memory (not for production)

// Critical endpoints to rate limit:
// - /api/auth/* (prevent brute force)
// - /api/bookings (prevent slot hogging)
// - /api/search (prevent scraping)
```

#### 11. Audit Logging

**Problem:** Need to know who changed what when.

**Solution (Future):**
```prisma
model AuditLog {
  id          String   @id @default(uuid())
  userId      String?
  action      String   // "CREATE", "UPDATE", "DELETE"
  entity      String   // "Booking", "Service", etc.
  entityId    String
  changes     Json?    // { before: {...}, after: {...} }
  ipAddress   String?
  createdAt   DateTime @default(now())
}
```

---

## Risk Areas

| Risk | Impact | Mitigation |
|------|--------|------------|
| Double-booking | High | Atomic transactions with row locking |
| Timezone bugs | High | Comprehensive timezone handling from day 1 |
| Performance at scale | Medium | Database indexes, caching strategy |
| Image storage costs | Medium | Compression, cleanup unused images |
| API abuse | Medium | Rate limiting, authentication |
| Data loss | High | Supabase automatic backups |
| App Store rejection | Medium | Follow Apple guidelines, test thoroughly |

---

## Open Questions

These need answers before/during implementation:

1. **Business Hours Granularity**
   - Fixed time slots (every 30min)?
   - Or flexible based on service duration?

2. **Multiple Staff Support**
   - MVP: Single staff per vendor?
   - Should data model support multiple from start?

3. **Guest Booking**
   - Allow booking without account?
   - Collect email/phone, create account post-booking?

4. **Deposit/Prepayment**
   - Required for MVP?
   - If yes, Stripe integration moves to earlier phase

5. **Service Categories**
   - Predefined list or free-form tags?
   - Hierarchical (Beauty > Hair > Haircut)?

6. **Vendor Verification**
   - Manual approval process?
   - Or anyone can register and go live?

7. **Search Radius Default**
   - What's a sensible default? 10km? 25km?
   - Should it vary by density?

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2024 | Initial implementation plan |

---

*Document maintained by: Book-iT Team*
*Last Updated: December 2024*
