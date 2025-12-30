# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Book-iT** is a universal appointment booking marketplace connecting customers with any time-based service provider (barbershops, doctors, gaming cafes, studios, etc.). The goal is to be the "Google Maps of Appointments" - one platform for all schedulable services.

## Project Status

Currently in **Planning Phase** (Stage 1). No code has been written yet.

## Documentation

| Document | Description |
|----------|-------------|
| `docs/PROJECT_VISION.md` | Full roadmap, MVP phases, feature breakdown |
| `docs/MARKET_ANALYSIS.md` | Competitive landscape and market research |
| `docs/TECH_STACK.md` | Tech stack analysis and decision rationale |
| `docs/IMPLEMENTATION_PLAN.md` | Detailed implementation phases and tasks |
| `docs/API_SPECIFICATION.md` | Complete REST API specification |
| `docs/DATABASE_SCHEMA.md` | Prisma schema and database design |
| `docs/TESTING_STRATEGY.md` | Testing approach, tools, and test cases |

## Tech Stack (Finalized)

| Layer | Technology | Hosting |
|-------|------------|---------|
| iOS App | Swift + SwiftUI | App Store |
| Web App | Next.js 14 + TypeScript + Tailwind | Vercel |
| API | Next.js API Routes + Zod | Vercel |
| Database | PostgreSQL + PostGIS | Supabase |
| ORM | Prisma | - |
| Auth | Supabase Auth | Supabase |
| Storage | Supabase Storage | Supabase |
| Maps | Google Maps (iOS SDK + JS API) | Google Cloud |

## Architecture

```
iOS App (SwiftUI) ─────┐
                       ├──► Next.js API Routes ──► Supabase PostgreSQL
Web App (Next.js) ─────┘         │
                                 ├──► Supabase Auth
                                 └──► Supabase Storage
```

## Key Design Decisions

- **Google Maps** for both iOS and Web (universal, familiar UX)
- **Supabase** handles infrastructure (DB, Auth, Storage) - reduces complexity
- **Next.js API Routes** handle business logic (booking, availability) - testable, centralized
- **Prisma ORM** for type-safe database access
- **Native iOS (SwiftUI)** for best UX on primary platform
- **Web for Android** users initially, native Android later

## Key Domain Concepts

- **Vendor:** Business offering schedulable services
- **Customer:** User booking appointments
- **Service:** A bookable offering with name, duration, price
- **Availability:** Vendor's working hours and breaks
- **Booking:** A confirmed appointment for a service
- **TimeSlot:** A specific bookable time period

## MVP Phases

1. **MVP-1:** Vendor core (registration, services, availability, basic bookings)
2. **MVP-2:** Customer discovery (location search, Google Maps, booking flow)
3. **MVP-3:** Trust layer (reviews, notifications, reminders)
4. **MVP-4:** Business tools (staff management, analytics, calendar sync)
5. **MVP-5:** Payments (Stripe integration, payouts)

## Project Structure (Planned)

```
book-it/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (web)/             # Web pages
│   │   └── api/               # API routes (backend)
│   ├── components/            # React components
│   └── lib/                   # Shared utilities
├── prisma/
│   └── schema.prisma          # Database schema
├── ios/                       # iOS Xcode project
└── docs/                      # Documentation
```

## Services & Accounts

| Service | Purpose |
|---------|---------|
| Supabase | Database, Auth, Storage |
| Vercel | Web + API hosting |
| Google Cloud | Maps APIs |
| Apple Developer | App Store ($99/year) |
