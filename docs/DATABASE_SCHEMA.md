# Book-iT: Database Schema

**Version:** 1.0
**Date:** December 2024
**Database:** PostgreSQL (via Supabase)
**ORM:** Prisma

---

## Table of Contents

1. [Overview](#overview)
2. [Entity Relationship Diagram](#entity-relationship-diagram)
3. [Prisma Schema](#prisma-schema)
4. [Table Descriptions](#table-descriptions)
5. [Indexes](#indexes)
6. [PostGIS Setup](#postgis-setup)
7. [Migrations Strategy](#migrations-strategy)

---

## Overview

### Design Principles

1. **Relational Integrity** - Foreign keys enforce data relationships
2. **Soft Deletes** - Important records have `deletedAt` for audit trail
3. **Timestamps** - All tables have `createdAt` and `updatedAt`
4. **UUID Primary Keys** - No sequential IDs exposed
5. **Timezone Aware** - Times stored in UTC, vendor timezone stored
6. **Geospatial Ready** - PostGIS for location queries

### Core Entities

| Entity | Description |
|--------|-------------|
| User | Authentication account |
| Vendor | Business profile |
| Customer | Customer profile |
| Service | Bookable service |
| Availability | Weekly schedule |
| VendorException | Holiday/vacation overrides |
| Booking | Appointment |
| Review | Customer review |
| VendorImage | Gallery images |
| Category | Service categories |

---

## Entity Relationship Diagram

```
┌─────────────┐
│    User     │
│─────────────│
│ id (PK)     │
│ email       │
│ role        │
└──────┬──────┘
       │
       │ 1:1
       ▼
┌──────┴──────┐       ┌─────────────┐
│   Vendor    │───────│   Service   │
│─────────────│  1:N  │─────────────│
│ id (PK)     │       │ id (PK)     │
│ userId (FK) │       │ vendorId(FK)│
│ businessName│       │ name        │
│ location    │       │ duration    │
│ timezone    │       │ price       │
└──────┬──────┘       └──────┬──────┘
       │                     │
       │ 1:N                 │
       ▼                     │
┌─────────────┐              │
│ Availability│              │
│─────────────│              │
│ vendorId(FK)│              │
│ dayOfWeek   │              │
│ startTime   │              │
│ endTime     │              │
└─────────────┘              │
       │                     │
       │                     │
┌──────┴──────┐              │
│   Booking   │◄─────────────┘
│─────────────│
│ id (PK)     │
│ vendorId(FK)│
│ serviceId(FK)│
│ customerId(FK)│
│ date        │
│ startTime   │
│ status      │
└──────┬──────┘
       │
       │ 1:1
       ▼
┌─────────────┐
│   Review    │
│─────────────│
│ bookingId(FK)│
│ rating      │
│ comment     │
└─────────────┘

┌─────────────┐
│  Customer   │
│─────────────│
│ id (PK)     │
│ userId (FK) │
│ name        │
│ phone       │
└─────────────┘
```

---

## Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [postgis]
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  VENDOR
  CUSTOMER
  ADMIN
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}

// ============================================
// USER & AUTH
// ============================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  role      UserRole

  // Soft delete
  deletedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  vendor    Vendor?
  customer  Customer?

  @@map("users")
}

// ============================================
// VENDOR
// ============================================

model Vendor {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Basic Info
  businessName String
  slug         String  @unique
  description  String?
  phone        String?
  email        String

  // Location
  address    String
  city       String
  state      String
  postalCode String
  country    String  @default("USA")

  // PostGIS Point - Will be created via raw SQL
  // Latitude and Longitude stored separately for easy access
  latitude  Float?
  longitude Float?

  // Settings
  timezone          String @default("UTC")
  currency          String @default("USD")
  bufferMinutes     Int    @default(0)   // Time between appointments
  minLeadTimeHours  Int    @default(2)   // Minimum booking notice
  maxAdvanceDays    Int    @default(30)  // How far ahead can book

  // Media
  logoUrl       String?
  coverImageUrl String?

  // Computed (updated via trigger or application)
  averageRating Float? @default(0)
  totalReviews  Int    @default(0)

  // Status
  isActive  Boolean   @default(true)
  deletedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  services     Service[]
  availability Availability[]
  exceptions   VendorException[]
  bookings     Booking[]
  reviews      Review[]
  images       VendorImage[]
  categories   CategoriesOnVendors[]

  @@index([city, isActive])
  @@index([slug])
  @@map("vendors")
}

// ============================================
// SERVICE
// ============================================

model Service {
  id       String @id @default(uuid())
  vendorId String
  vendor   Vendor @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  name        String
  description String?
  duration    Int     // Minutes (5-480)
  price       Decimal @db.Decimal(10, 2)
  currency    String  @default("USD")

  // Status
  isActive  Boolean   @default(true)
  deletedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  bookings Booking[]

  @@index([vendorId, isActive])
  @@map("services")
}

// ============================================
// AVAILABILITY
// ============================================

model Availability {
  id       String @id @default(uuid())
  vendorId String
  vendor   Vendor @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  dayOfWeek Int     // 0 = Sunday, 6 = Saturday
  startTime String  // "09:00" (24h format)
  endTime   String  // "17:00"
  isActive  Boolean @default(true)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([vendorId, dayOfWeek])
  @@map("availability")
}

// ============================================
// VENDOR EXCEPTIONS (Holidays, Vacations)
// ============================================

model VendorException {
  id       String @id @default(uuid())
  vendorId String
  vendor   Vendor @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  date      DateTime @db.Date
  isClosed  Boolean  @default(true) // true = closed all day
  startTime String?  // If not closed, special hours
  endTime   String?
  reason    String?  // "Holiday", "Vacation", etc.

  createdAt DateTime @default(now())

  @@unique([vendorId, date])
  @@index([vendorId, date])
  @@map("vendor_exceptions")
}

// ============================================
// CUSTOMER
// ============================================

model Customer {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  name  String
  phone String?

  // Soft delete
  deletedAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  bookings Booking[]
  reviews  Review[]

  @@map("customers")
}

// ============================================
// BOOKING
// ============================================

model Booking {
  id String @id @default(uuid())

  vendorId   String
  vendor     Vendor   @relation(fields: [vendorId], references: [id])
  serviceId  String
  service    Service  @relation(fields: [serviceId], references: [id])
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])

  // Time (stored in vendor's timezone context)
  date      DateTime @db.Date
  startTime String   // "14:00"
  endTime   String   // "14:30"

  // UTC timestamps for accurate comparison
  startTimeUtc DateTime?
  endTimeUtc   DateTime?

  // Status
  status BookingStatus @default(CONFIRMED)

  // Customer info (denormalized for convenience/history)
  customerName  String
  customerEmail String
  customerPhone String?

  // Notes
  customerNotes String?
  vendorNotes   String?

  // Cancellation
  cancelledAt        DateTime?
  cancelledBy        String?   // "vendor" | "customer"
  cancellationReason String?

  // Reminders
  reminderSentAt DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  review Review?

  @@index([vendorId, date])
  @@index([customerId])
  @@index([status])
  @@map("bookings")
}

// ============================================
// REVIEW
// ============================================

model Review {
  id String @id @default(uuid())

  bookingId String  @unique
  booking   Booking @relation(fields: [bookingId], references: [id])

  vendorId   String
  vendor     Vendor   @relation(fields: [vendorId], references: [id])
  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])

  rating  Int     // 1-5
  comment String?

  // Vendor response
  vendorResponse String?
  respondedAt    DateTime?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([vendorId])
  @@map("reviews")
}

// ============================================
// VENDOR IMAGES
// ============================================

model VendorImage {
  id       String @id @default(uuid())
  vendorId String
  vendor   Vendor @relation(fields: [vendorId], references: [id], onDelete: Cascade)

  url     String
  caption String?
  order   Int    @default(0)

  createdAt DateTime @default(now())

  @@index([vendorId])
  @@map("vendor_images")
}

// ============================================
// CATEGORIES
// ============================================

model Category {
  id   String @id @default(uuid())
  name String @unique
  slug String @unique
  icon String? // Icon name or URL

  createdAt DateTime @default(now())

  vendors CategoriesOnVendors[]

  @@map("categories")
}

model CategoriesOnVendors {
  vendorId   String
  vendor     Vendor   @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  categoryId String
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  assignedAt DateTime @default(now())

  @@id([vendorId, categoryId])
  @@map("categories_on_vendors")
}
```

---

## Table Descriptions

### User

Authentication account. Links to either Vendor or Customer profile based on role.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | String | Unique email (from Supabase Auth) |
| role | Enum | VENDOR, CUSTOMER, or ADMIN |
| deletedAt | DateTime? | Soft delete timestamp |

### Vendor

Business profile for service providers.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | FK to User |
| businessName | String | Display name |
| slug | String | URL-friendly identifier |
| description | String? | Business description |
| address, city, state, postalCode, country | String | Location |
| latitude, longitude | Float? | Coordinates for map |
| timezone | String | IANA timezone (e.g., "America/New_York") |
| currency | String | Default currency code |
| bufferMinutes | Int | Gap between appointments |
| minLeadTimeHours | Int | Minimum notice for booking |
| maxAdvanceDays | Int | Max days ahead to book |
| logoUrl | String? | Business logo |
| coverImageUrl | String? | Cover/banner image |
| averageRating | Float? | Cached average (1-5) |
| totalReviews | Int | Cached count |
| isActive | Boolean | Can be found in search |

### Service

A bookable offering from a vendor.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| vendorId | UUID | FK to Vendor |
| name | String | Service name |
| description | String? | Details |
| duration | Int | Duration in minutes |
| price | Decimal | Price amount |
| currency | String | Currency code |
| isActive | Boolean | Available for booking |

### Availability

Weekly recurring schedule.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| vendorId | UUID | FK to Vendor |
| dayOfWeek | Int | 0-6 (Sunday-Saturday) |
| startTime | String | Opening time "HH:mm" |
| endTime | String | Closing time "HH:mm" |
| isActive | Boolean | Is this day available |

### VendorException

Overrides for specific dates (holidays, vacations).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| vendorId | UUID | FK to Vendor |
| date | Date | The specific date |
| isClosed | Boolean | Closed all day? |
| startTime, endTime | String? | Special hours if not closed |
| reason | String? | Why (for vendor reference) |

### Customer

Customer profile.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| userId | UUID | FK to User |
| name | String | Full name |
| phone | String? | Phone number |

### Booking

An appointment.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| vendorId | UUID | FK to Vendor |
| serviceId | UUID | FK to Service |
| customerId | UUID | FK to Customer |
| date | Date | Booking date |
| startTime | String | Start time "HH:mm" |
| endTime | String | End time "HH:mm" |
| startTimeUtc | DateTime? | UTC start (for queries) |
| endTimeUtc | DateTime? | UTC end (for queries) |
| status | Enum | PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW |
| customerName | String | Denormalized customer name |
| customerEmail | String | Denormalized email |
| customerPhone | String? | Denormalized phone |
| customerNotes | String? | Notes from customer |
| vendorNotes | String? | Notes from vendor |
| cancelledAt | DateTime? | When cancelled |
| cancelledBy | String? | "vendor" or "customer" |
| cancellationReason | String? | Why cancelled |
| reminderSentAt | DateTime? | When reminder was sent |

### Review

Customer review for a completed booking.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| bookingId | UUID | FK to Booking (unique) |
| vendorId | UUID | FK to Vendor |
| customerId | UUID | FK to Customer |
| rating | Int | 1-5 stars |
| comment | String? | Review text |
| vendorResponse | String? | Vendor's reply |
| respondedAt | DateTime? | When vendor replied |

### Category

Service categories for filtering.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | String | Display name |
| slug | String | URL-friendly |
| icon | String? | Icon identifier |

---

## Indexes

### Performance Indexes

```sql
-- Vendor search by location (requires PostGIS)
CREATE INDEX idx_vendors_location ON vendors USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
);

-- Booking lookup by vendor and date
CREATE INDEX idx_bookings_vendor_date ON bookings (vendor_id, date);

-- Booking lookup by customer
CREATE INDEX idx_bookings_customer ON bookings (customer_id);

-- Review lookup by vendor
CREATE INDEX idx_reviews_vendor ON reviews (vendor_id);

-- Service lookup by vendor
CREATE INDEX idx_services_vendor ON services (vendor_id, is_active);

-- Vendor lookup by slug
CREATE INDEX idx_vendors_slug ON vendors (slug);

-- Vendor search by city
CREATE INDEX idx_vendors_city ON vendors (city, is_active);
```

---

## PostGIS Setup

### Enable Extension

Run in Supabase SQL Editor:

```sql
-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- Add geography column to vendors (after Prisma migration)
ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

-- Create spatial index
CREATE INDEX IF NOT EXISTS idx_vendors_location
ON vendors USING GIST (location);

-- Create function to update location from lat/lng
CREATE OR REPLACE FUNCTION update_vendor_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER vendor_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON vendors
FOR EACH ROW
EXECUTE FUNCTION update_vendor_location();
```

### Query Nearby Vendors

```sql
-- Find vendors within 10km of a point
SELECT
  v.*,
  ST_Distance(v.location, ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography) / 1000 as distance_km
FROM vendors v
WHERE
  v.is_active = true
  AND ST_DWithin(
    v.location,
    ST_SetSRID(ST_MakePoint(-74.0060, 40.7128), 4326)::geography,
    10000  -- 10km in meters
  )
ORDER BY distance_km
LIMIT 20;
```

---

## Migrations Strategy

### Development Workflow

```bash
# After modifying schema.prisma
npx prisma migrate dev --name descriptive_name

# This will:
# 1. Generate migration SQL
# 2. Apply to development database
# 3. Regenerate Prisma Client
```

### Production Deployment

```bash
# Apply pending migrations
npx prisma migrate deploy

# This runs in CI/CD before deployment
```

### Migration Naming Convention

```
YYYYMMDDHHMMSS_description
Example: 20240115120000_add_vendor_buffer_minutes
```

### Seed Data

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default categories
  const categories = [
    { name: 'Barber', slug: 'barber', icon: 'scissors' },
    { name: 'Salon', slug: 'salon', icon: 'spa' },
    { name: 'Spa', slug: 'spa', icon: 'leaf' },
    { name: 'Healthcare', slug: 'healthcare', icon: 'heart' },
    { name: 'Fitness', slug: 'fitness', icon: 'dumbbell' },
    { name: 'Gaming', slug: 'gaming', icon: 'gamepad' },
    { name: 'Photography', slug: 'photography', icon: 'camera' },
    { name: 'Consulting', slug: 'consulting', icon: 'briefcase' },
    { name: 'Education', slug: 'education', icon: 'book' },
    { name: 'Other', slug: 'other', icon: 'star' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }

  console.log('Seed data created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

Run seed:
```bash
npx prisma db seed
```

---

## Database Triggers

### Update Vendor Rating

```sql
-- Function to update vendor average rating
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors
  SET
    average_rating = (
      SELECT AVG(rating)::numeric(2,1)
      FROM reviews
      WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE vendor_id = COALESCE(NEW.vendor_id, OLD.vendor_id)
    )
  WHERE id = COALESCE(NEW.vendor_id, OLD.vendor_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger on review insert/update/delete
CREATE TRIGGER review_rating_trigger
AFTER INSERT OR UPDATE OR DELETE ON reviews
FOR EACH ROW
EXECUTE FUNCTION update_vendor_rating();
```

---

*Document maintained by: Book-iT Team*
*Last Updated: December 2024*
