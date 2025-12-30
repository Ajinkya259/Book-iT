# Book-iT: Tech Stack Decision Document

**Version:** 1.0
**Date:** December 2024
**Status:** Finalized

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Technical Requirements](#technical-requirements)
3. [Database Layer](#database-layer)
4. [Backend Layer](#backend-layer)
5. [API Hosting](#api-hosting)
6. [ORM Selection](#orm-selection)
7. [Authentication](#authentication)
8. [Image Storage](#image-storage)
9. [Maps Integration](#maps-integration)
10. [Final Architecture](#final-architecture)
11. [Cost Analysis](#cost-analysis)

---

## Executive Summary

### Final Tech Stack

| Layer | Technology | Hosting |
|-------|------------|---------|
| **iOS App** | Swift + SwiftUI | App Store |
| **Web App** | Next.js 14 + TypeScript + Tailwind | Vercel |
| **API** | Next.js API Routes + Zod | Vercel |
| **Database** | PostgreSQL + PostGIS | Supabase |
| **ORM** | Prisma | - |
| **Auth** | Supabase Auth | Supabase |
| **Storage** | Supabase Storage | Supabase |
| **Maps** | Google Maps | Google Cloud |

### Why This Stack

1. **Minimal services to manage** - Only 4 accounts (Supabase, Vercel, Google Cloud, Apple Developer)
2. **Free tier friendly** - $0/month to start, scales affordably
3. **One codebase for web + API** - Next.js handles both
4. **Native iOS experience** - SwiftUI for best UX on primary platform
5. **Production-ready** - All battle-tested technologies

---

## Technical Requirements

### What Book-iT Needs

| Requirement | Why | Technical Implication |
|-------------|-----|----------------------|
| **Prevent double-bookings** | Core business logic | ACID transactions required |
| **Location-based search** | "Find services near me" | Geospatial queries (PostGIS) |
| **Fast availability checks** | Critical for UX | Efficient time-slot queries |
| **Image delivery** | Shop photos, avatars | CDN-backed storage |
| **Two user types** | Vendor + Customer | Role-based authentication |
| **Cross-platform** | iOS primary, Web for Android | Shared backend API |

### Data Relationships

```
Vendor (1) ──────► (N) Service
Service (1) ──────► (N) TimeSlot
Customer (1) ──────► (N) Booking
Booking (N) ◄────── (1) Service
Booking (1) ──────► (1) Review
Vendor (1) ──────► (N) Image
```

This relational structure requires a relational database with strong transaction support.

---

## Database Layer

### Options Considered

| Database | Type | Relational | Geospatial | ACID Transactions |
|----------|------|------------|------------|-------------------|
| **PostgreSQL** | SQL | Excellent | PostGIS (best) | Full support |
| MySQL | SQL | Good | Limited | Good |
| MongoDB | NoSQL | Document-based | Basic | Limited |
| Firestore | NoSQL | Document-based | None | Limited |

### Decision: PostgreSQL

**Reasons:**
1. **Relational data model** - Booking systems are inherently relational (vendors have services, services have slots, slots have bookings)
2. **PostGIS extension** - Industry-standard geospatial queries for "find near me" functionality
3. **ACID transactions** - Critical for preventing double-bookings (atomic slot reservation)
4. **Mature ecosystem** - Best tooling, ORMs, and hosting options

### PostgreSQL Hosting Options

| Provider | Free Tier | PostGIS | Extras | Decision |
|----------|-----------|---------|--------|----------|
| **Supabase** | 500MB | Yes | Auth, Storage, Realtime | **Selected** |
| Neon | 512MB | Yes | Branching, serverless | Good alternative |
| Railway | $5 credit | Yes | Nothing extra | More DIY |
| Vercel Postgres | 256MB | No | Vercel integration | Too limited |

### Decision: Supabase

**Reasons:**
1. **All-in-one platform** - Database + Auth + Storage + Realtime in one service
2. **Generous free tier** - 500MB database, 1GB storage, 50K monthly active users
3. **PostGIS included** - Geospatial queries work out of the box
4. **SDKs for both platforms** - Swift SDK for iOS, JS SDK for web
5. **Reduces complexity** - One service instead of three (DB + Auth + Storage separately)

---

## Backend Layer

### Options Considered

| Approach | Description | Pros | Cons |
|----------|-------------|------|------|
| **BaaS Only** | Supabase handles everything, clients talk directly | Fast development, no backend code | Less control, business logic scattered |
| **Custom API Only** | Full custom backend, Supabase just for DB | Full control, testable | More work, another deployment |
| **Hybrid** | Supabase for infrastructure, custom API for logic | Best of both worlds | Slightly more complex |

### Decision: Hybrid Approach

**Architecture:**
```
iOS App ─────┐
             │
             ├──► Next.js API Routes (Business Logic)
             │              │
Web App ─────┘              │
                            ▼
                    Supabase (Infrastructure)
                    ├── PostgreSQL (Data)
                    ├── Auth (Authentication)
                    └── Storage (Images)
```

**Reasons:**
1. **Business logic centralized** - All booking logic in one place (Next.js API routes)
2. **Easier testing** - API routes can be unit tested
3. **Supabase for infrastructure** - Don't reinvent auth, storage, realtime
4. **Type safety** - TypeScript end-to-end in API layer
5. **Atomic transactions** - Complex booking operations handled server-side

### Why Not Pure BaaS (Supabase Only)?

Booking creation requires:
```
1. Check if slot is available
2. Lock the slot (prevent race condition)
3. Create booking record
4. Update availability
5. Send confirmation notification
6. All in one atomic transaction
```

This is easier to implement, test, and debug in a proper API layer than in Supabase Edge Functions.

---

## API Hosting

### Options Considered

| Platform | Cold Start | Timeout (Free) | Free Tier | Deployment |
|----------|------------|----------------|-----------|------------|
| **Vercel** | 1-3s | 10s | 100GB bandwidth | Git push |
| Railway | None | None | $5 credit/month | Git push |
| Fly.io | None | None | 3 small VMs | CLI |
| Render | 30s+ | None | Sleeps after inactivity | Git push |
| Cloudflare Workers | None | 30s | 100K requests/day | CLI |

### Decision: Vercel

**Reasons:**
1. **Next.js is made by Vercel** - Best possible integration and performance
2. **One deployment** - Web app + API routes deploy together
3. **Zero configuration** - Just push to GitHub, it deploys
4. **Generous free tier** - 100GB bandwidth, unlimited deployments
5. **Automatic HTTPS** - SSL certificates handled automatically
6. **Global CDN** - Static assets served from edge

### Addressing Cold Start Concerns

Cold starts (1-3s on first request after ~15min idle) are acceptable because:
- Only affects first request, subsequent requests are <100ms
- Booking operations complete in <1 second
- For MVP traffic levels, this is negligible
- Can upgrade to Pro ($20/mo) later for faster cold starts

---

## ORM Selection

### Options Considered

| ORM | Type Safety | Migrations | Learning Curve | Supabase Compatible |
|-----|-------------|------------|----------------|---------------------|
| **Prisma** | Excellent | Built-in | Medium | Yes |
| Drizzle | Excellent | Built-in | Medium | Yes |
| Kysely | Good | External | Low | Yes |
| Supabase JS | Basic | Dashboard | Low | Native |
| Raw SQL | None | Manual | High | Yes |

### Decision: Prisma

**Reasons:**
1. **Industry standard** - Most popular TypeScript ORM
2. **Type generation** - Auto-generates TypeScript types from schema
3. **Migration system** - Version-controlled database migrations
4. **Query builder** - Type-safe queries prevent runtime errors
5. **Portability** - Not locked to Supabase (could migrate to any PostgreSQL)
6. **Excellent docs** - Large community, many tutorials

### Prisma + Supabase Integration

Prisma connects to Supabase PostgreSQL using the connection string:
```
DATABASE_URL="postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

This gives us:
- Supabase manages the database infrastructure
- Prisma handles schema and queries in our code
- Best of both worlds

---

## Authentication

### Options Considered

| Service | Free Tier | Apple Sign-In | iOS SDK | Web SDK |
|---------|-----------|---------------|---------|---------|
| **Supabase Auth** | 50K MAU | Yes | Swift | JS |
| NextAuth.js | Unlimited | Yes | No | JS |
| Clerk | 10K MAU | Yes | Yes | JS |
| Firebase Auth | 50K MAU | Yes | Yes | JS |
| Auth0 | 7K MAU | Yes | Yes | JS |

### Decision: Supabase Auth

**Reasons:**
1. **Already using Supabase** - No additional service to manage
2. **Swift SDK** - Native iOS integration
3. **Apple Sign-In** - Required for iOS App Store if offering social login
4. **JWT-based** - Standard tokens that work with our API
5. **Row Level Security** - Can secure database directly (optional)
6. **50K free MAU** - More than enough for MVP and growth

### Auth Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     AUTHENTICATION FLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  iOS App                              Web App                │
│     │                                    │                   │
│     ▼                                    ▼                   │
│  Supabase Swift SDK              Supabase JS SDK             │
│     │                                    │                   │
│     └──────────────┬─────────────────────┘                   │
│                    │                                         │
│                    ▼                                         │
│             Supabase Auth                                    │
│        (Returns JWT Token)                                   │
│                    │                                         │
│                    ▼                                         │
│           Next.js API Routes                                 │
│         (Validates JWT Token)                                │
│                    │                                         │
│                    ▼                                         │
│           Database Operations                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Image Storage

### Options Considered

| Service | Free Tier | CDN | Transformations | Integration |
|---------|-----------|-----|-----------------|-------------|
| **Supabase Storage** | 1GB | Yes | Basic resize | Native |
| Cloudinary | 25GB | Yes | Advanced | API |
| AWS S3 | 5GB (12mo) | Via CloudFront | None | Complex |
| Uploadthing | 2GB | Yes | None | Simple |
| Vercel Blob | 256MB | Yes | None | Native |

### Decision: Supabase Storage

**Reasons:**
1. **Already using Supabase** - Single platform
2. **1GB free storage** - Plenty for MVP (shop photos, avatars)
3. **CDN included** - Fast global delivery
4. **Direct uploads** - iOS and Web can upload directly
5. **Access control** - Public buckets for images, private for sensitive files
6. **Image transformations** - Basic resize/crop built-in

### Storage Structure

```
supabase-storage/
├── vendor-logos/          # Business logos (public)
├── shop-photos/           # Shop/location images (public)
├── service-images/        # Service thumbnails (public)
├── staff-avatars/         # Staff photos (public)
└── customer-avatars/      # Customer profile pics (public)
```

---

## Maps Integration

### Options Considered

| Service | iOS SDK | Web SDK | Free Tier | Data Quality |
|---------|---------|---------|-----------|--------------|
| **Google Maps** | Yes | Yes | $200/mo credit | Best |
| Mapbox | Yes | Yes | 100K loads/mo | Very good |
| Apple MapKit | iOS only | MapKit JS (limited) | Unlimited | Good |
| OpenStreetMap | Via libs | Leaflet | Free | Variable |

### Decision: Google Maps

**Reasons:**
1. **Universal availability** - Same APIs on iOS and Web
2. **Best data quality** - Most accurate, up-to-date maps globally
3. **Familiar to users** - Everyone knows Google Maps interface
4. **$200 free credit** - ~28,000 map loads per month (plenty for MVP)
5. **Places API** - Address autocomplete, place details
6. **Geocoding** - Convert addresses to coordinates

### Google Maps APIs Needed

| API | Purpose | Free Tier |
|-----|---------|-----------|
| Maps SDK for iOS | Display maps in iOS app | Included in $200 |
| Maps JavaScript API | Display maps on web | Included in $200 |
| Places API | Address autocomplete | Included in $200 |
| Geocoding API | Address to coordinates | Included in $200 |

### Why Not Apple MapKit?

- No web SDK (MapKit JS is very limited)
- Would need different map solution for web
- Less familiar to non-Apple users
- Google Maps has better global coverage

### Why Not Mapbox?

- Google Maps is more familiar to users
- Google's free tier ($200 credit) is more flexible
- Google Places API is better for address autocomplete
- Mapbox would be a good alternative if costs become issue

---

## Final Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BOOK-IT ARCHITECTURE                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│   iOS APP                              WEB APP                        │
│   ┌──────────────────────┐            ┌──────────────────────┐       │
│   │ Swift + SwiftUI      │            │ Next.js 14           │       │
│   │                      │            │ TypeScript           │       │
│   │ • Google Maps iOS SDK│            │ Tailwind CSS         │       │
│   │ • Supabase Swift SDK │            │ Google Maps JS API   │       │
│   │   (Auth + Storage)   │            │ Supabase JS SDK      │       │
│   └──────────┬───────────┘            └──────────┬───────────┘       │
│              │                                   │                    │
│              │         REST API (JSON)           │                    │
│              └─────────────────┬─────────────────┘                    │
│                                │                                      │
│                                ▼                                      │
│               ┌────────────────────────────────┐                      │
│               │      NEXT.JS API ROUTES        │                      │
│               │         (on Vercel)            │                      │
│               │                                │                      │
│               │  • /api/auth/*     (auth)      │                      │
│               │  • /api/vendors/*  (CRUD)      │                      │
│               │  • /api/services/* (CRUD)      │                      │
│               │  • /api/bookings/* (CRUD)      │                      │
│               │  • /api/reviews/*  (CRUD)      │                      │
│               │  • /api/search/*   (discovery) │                      │
│               │                                │                      │
│               │  Prisma ORM + Zod Validation   │                      │
│               └────────────────┬───────────────┘                      │
│                                │                                      │
│                                ▼                                      │
│               ┌────────────────────────────────┐                      │
│               │          SUPABASE              │                      │
│               │                                │                      │
│               │  ┌──────────┐  ┌──────────┐   │                      │
│               │  │PostgreSQL│  │ Storage  │   │                      │
│               │  │ + PostGIS│  │ (Images) │   │                      │
│               │  └──────────┘  └──────────┘   │                      │
│               │                                │                      │
│               │  ┌──────────┐  ┌──────────┐   │                      │
│               │  │   Auth   │  │ Realtime │   │                      │
│               │  │  (JWT)   │  │(optional)│   │                      │
│               │  └──────────┘  └──────────┘   │                      │
│               └────────────────────────────────┘                      │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Cost Analysis

### Free Tier Limits

| Service | Free Tier | Limit |
|---------|-----------|-------|
| **Supabase** | Database | 500MB storage |
| **Supabase** | Auth | 50,000 MAU |
| **Supabase** | Storage | 1GB files |
| **Vercel** | Hosting | 100GB bandwidth |
| **Google Maps** | APIs | $200 credit/month (~28K loads) |

### Monthly Cost Projection

| Stage | Users | Supabase | Vercel | Google Maps | Total |
|-------|-------|----------|--------|-------------|-------|
| MVP | 0-100 | $0 | $0 | $0 | **$0** |
| Early Growth | 100-1K | $0 | $0 | $0 | **$0** |
| Growth | 1K-10K | $25 | $0 | $0 | **$25** |
| Scale | 10K-50K | $25 | $20 | ~$50 | **~$95** |

### One-Time Costs

| Item | Cost | Required For |
|------|------|--------------|
| Apple Developer Account | $99/year | App Store submission |
| Google Cloud Account | $0 | Maps API (free credit) |

---

## Services Summary

| Service | Purpose | Account URL |
|---------|---------|-------------|
| **Supabase** | Database, Auth, Storage | supabase.com |
| **Vercel** | Web + API Hosting | vercel.com |
| **Google Cloud** | Maps APIs | console.cloud.google.com |
| **Apple Developer** | iOS App Store | developer.apple.com |

**Total accounts to manage: 4**

---

## Technology Versions (Recommended)

| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 14.x | App Router |
| TypeScript | 5.x | Strict mode |
| React | 18.x | Via Next.js |
| Prisma | 5.x | Latest stable |
| Tailwind CSS | 3.x | Latest stable |
| Swift | 5.9+ | Latest stable |
| SwiftUI | iOS 17+ | Latest features |
| Xcode | 15+ | Latest stable |

---

## Alternatives Considered But Not Chosen

### Backend Alternatives

| Alternative | Why Not Chosen |
|-------------|----------------|
| Express.js on Railway | Separate deployment, more complexity |
| FastAPI on Fly.io | Different language (Python), separate deployment |
| Supabase Edge Functions only | Deno runtime, harder to test, scattered logic |
| tRPC | iOS can't use it (TypeScript only) |

### Database Alternatives

| Alternative | Why Not Chosen |
|-------------|----------------|
| MongoDB | Not ideal for relational booking data |
| PlanetScale | MySQL, no PostGIS |
| Neon | Good option, but Supabase adds Auth+Storage |
| Firebase Firestore | NoSQL, limited transactions |

### Auth Alternatives

| Alternative | Why Not Chosen |
|-------------|----------------|
| NextAuth.js | No iOS SDK |
| Clerk | Paid after 10K users, separate service |
| Firebase Auth | Mixing Firebase + Supabase adds complexity |
| Custom JWT | More work, reinventing the wheel |

### Maps Alternatives

| Alternative | Why Not Chosen |
|-------------|----------------|
| Apple MapKit | No proper web SDK |
| Mapbox | Less familiar to users, similar cost |
| OpenStreetMap | Variable data quality, more setup |

---

*Document maintained by: Book-iT Team*
*Last Updated: December 2024*
