# Book-iT: API Specification

**Version:** 1.0
**Date:** December 2024
**Base URL:** `https://book-it.vercel.app/api`

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Auth Endpoints](#auth-endpoints)
5. [Vendor Endpoints](#vendor-endpoints)
6. [Service Endpoints](#service-endpoints)
7. [Availability Endpoints](#availability-endpoints)
8. [Booking Endpoints](#booking-endpoints)
9. [Search Endpoints](#search-endpoints)
10. [Review Endpoints](#review-endpoints)
11. [Upload Endpoints](#upload-endpoints)

---

## Overview

### API Style

- RESTful JSON API
- All requests/responses use `Content-Type: application/json`
- Timestamps in ISO 8601 format (UTC)
- Pagination via `page` and `limit` query params

### Response Format

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human readable message",
    "details": { ... }  // Optional
  }
}
```

**Paginated Response:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Authentication

### Auth Header

```
Authorization: Bearer <jwt_token>
```

### Auth Levels

| Level | Description |
|-------|-------------|
| `public` | No authentication required |
| `authenticated` | Any logged-in user |
| `vendor` | Must be a vendor |
| `customer` | Must be a customer |
| `owner` | Must own the resource |
| `admin` | Admin users only |

---

## Error Handling

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `FORBIDDEN` | 403 | Not allowed to access resource |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `CONFLICT` | 409 | Resource already exists |
| `SLOT_UNAVAILABLE` | 409 | Time slot no longer available |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Auth Endpoints

### POST /api/auth/register

Register a new user.

**Auth:** `public`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "role": "VENDOR" | "CUSTOMER",
  "name": "John Doe"  // Required for CUSTOMER
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "CUSTOMER"
    },
    "message": "Verification email sent"
  }
}
```

**Errors:**
- `VALIDATION_ERROR` - Invalid email/password
- `CONFLICT` - Email already registered

---

### POST /api/auth/login

Login with email and password.

**Auth:** `public`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "role": "VENDOR"
    },
    "accessToken": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

**Errors:**
- `UNAUTHORIZED` - Invalid credentials

---

### POST /api/auth/logout

Logout current session.

**Auth:** `authenticated`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### GET /api/auth/me

Get current user profile.

**Auth:** `authenticated`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "VENDOR",
    "vendor": { ... } | null,
    "customer": { ... } | null
  }
}
```

---

### POST /api/auth/refresh

Refresh access token.

**Auth:** `public`

**Request Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "accessToken": "new_jwt_token"
  }
}
```

---

## Vendor Endpoints

### POST /api/vendors

Create vendor profile.

**Auth:** `vendor` (must have VENDOR role but no vendor profile yet)

**Request Body:**
```json
{
  "businessName": "Joe's Barber Shop",
  "description": "Best haircuts in town",
  "phone": "+1234567890",
  "email": "joe@barbershop.com",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "postalCode": "10001",
  "country": "USA",
  "timezone": "America/New_York",
  "currency": "USD"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "joes-barber-shop",
    "businessName": "Joe's Barber Shop",
    ...
  }
}
```

**Errors:**
- `CONFLICT` - Vendor profile already exists for this user

---

### GET /api/vendors/me

Get own vendor profile.

**Auth:** `vendor`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "joes-barber-shop",
    "businessName": "Joe's Barber Shop",
    "description": "Best haircuts in town",
    "phone": "+1234567890",
    "email": "joe@barbershop.com",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "postalCode": "10001",
    "country": "USA",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "timezone": "America/New_York",
    "currency": "USD",
    "logoUrl": "https://...",
    "coverImageUrl": "https://...",
    "averageRating": 4.5,
    "totalReviews": 42,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

---

### PUT /api/vendors/me

Update own vendor profile.

**Auth:** `vendor`

**Request Body:** (partial update allowed)
```json
{
  "businessName": "Joe's Premium Barber Shop",
  "description": "Updated description"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }  // Updated vendor
}
```

---

### GET /api/vendors/[id]

Get vendor by ID (public view).

**Auth:** `public`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "slug": "joes-barber-shop",
    "businessName": "Joe's Barber Shop",
    "description": "Best haircuts in town",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "location": {
      "lat": 40.7128,
      "lng": -74.0060
    },
    "logoUrl": "https://...",
    "coverImageUrl": "https://...",
    "averageRating": 4.5,
    "totalReviews": 42,
    "services": [ ... ],
    "images": [ ... ]
  }
}
```

---

### GET /api/vendors/slug/[slug]

Get vendor by slug (public view).

**Auth:** `public`

**Response:** Same as GET /api/vendors/[id]

---

## Service Endpoints

### GET /api/vendors/me/services

List vendor's own services.

**Auth:** `vendor`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Haircut",
      "description": "Classic men's haircut",
      "duration": 30,
      "price": 25.00,
      "currency": "USD",
      "isActive": true
    }
  ]
}
```

---

### POST /api/vendors/me/services

Create a new service.

**Auth:** `vendor`

**Request Body:**
```json
{
  "name": "Haircut",
  "description": "Classic men's haircut",
  "duration": 30,
  "price": 25.00
}
```

**Validation:**
- `name`: Required, 1-100 chars
- `duration`: Required, 5-480 minutes
- `price`: Required, >= 0

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Haircut",
    ...
  }
}
```

---

### PUT /api/vendors/me/services/[id]

Update a service.

**Auth:** `vendor` (owner)

**Request Body:** (partial update allowed)
```json
{
  "price": 30.00
}
```

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### DELETE /api/vendors/me/services/[id]

Delete a service (soft delete).

**Auth:** `vendor` (owner)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Service deleted"
  }
}
```

**Note:** If service has future bookings, they will be cancelled and customers notified.

---

### GET /api/vendors/[vendorId]/services

List vendor's public services.

**Auth:** `public`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Haircut",
      "description": "Classic men's haircut",
      "duration": 30,
      "price": 25.00,
      "currency": "USD"
    }
  ]
}
```

---

## Availability Endpoints

### GET /api/vendors/me/availability

Get vendor's weekly availability.

**Auth:** `vendor`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "timezone": "America/New_York",
    "bufferMinutes": 10,
    "minLeadTimeHours": 2,
    "schedule": [
      { "dayOfWeek": 0, "startTime": null, "endTime": null, "isActive": false },
      { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "isActive": true },
      { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00", "isActive": true },
      { "dayOfWeek": 3, "startTime": "09:00", "endTime": "17:00", "isActive": true },
      { "dayOfWeek": 4, "startTime": "09:00", "endTime": "17:00", "isActive": true },
      { "dayOfWeek": 5, "startTime": "09:00", "endTime": "17:00", "isActive": true },
      { "dayOfWeek": 6, "startTime": "10:00", "endTime": "14:00", "isActive": true }
    ]
  }
}
```

---

### PUT /api/vendors/me/availability

Set vendor's weekly availability.

**Auth:** `vendor`

**Request Body:**
```json
{
  "bufferMinutes": 10,
  "minLeadTimeHours": 2,
  "schedule": [
    { "dayOfWeek": 1, "startTime": "09:00", "endTime": "17:00", "isActive": true },
    { "dayOfWeek": 2, "startTime": "09:00", "endTime": "17:00", "isActive": true }
    // ... other days
  ]
}
```

**Validation:**
- `startTime` and `endTime` in 24h format "HH:mm"
- `endTime` must be after `startTime`
- `bufferMinutes`: 0-60
- `minLeadTimeHours`: 0-168 (1 week)

**Response (200):**
```json
{
  "success": true,
  "data": { ... }
}
```

---

### GET /api/vendors/[vendorId]/slots

Get available booking slots.

**Auth:** `public`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `serviceId` | string | Yes | Service UUID |
| `date` | string | Yes | Date in YYYY-MM-DD format |

**Example:** `GET /api/vendors/abc123/slots?serviceId=xyz789&date=2024-01-15`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "date": "2024-01-15",
    "timezone": "America/New_York",
    "service": {
      "id": "xyz789",
      "name": "Haircut",
      "duration": 30
    },
    "slots": [
      { "startTime": "09:00", "endTime": "09:30", "available": true },
      { "startTime": "09:30", "endTime": "10:00", "available": true },
      { "startTime": "10:00", "endTime": "10:30", "available": false },
      { "startTime": "10:30", "endTime": "11:00", "available": true }
    ]
  }
}
```

**Notes:**
- Slots marked `available: false` are already booked
- Past time slots not returned for today's date
- Respects vendor's `minLeadTimeHours` setting

---

## Booking Endpoints

### POST /api/bookings

Create a new booking.

**Auth:** `customer`

**Request Body:**
```json
{
  "vendorId": "vendor-uuid",
  "serviceId": "service-uuid",
  "date": "2024-01-15",
  "startTime": "14:00",
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "+1234567890",
  "customerNotes": "First time customer"
}
```

**Validation:**
- `date`: Must be today or future
- `startTime`: Must be within vendor's availability
- Slot must be available (checked atomically)

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "booking-uuid",
    "vendor": {
      "id": "vendor-uuid",
      "businessName": "Joe's Barber Shop",
      "address": "123 Main St"
    },
    "service": {
      "id": "service-uuid",
      "name": "Haircut",
      "duration": 30,
      "price": 25.00
    },
    "date": "2024-01-15",
    "startTime": "14:00",
    "endTime": "14:30",
    "status": "CONFIRMED",
    "customerName": "John Doe",
    "createdAt": "2024-01-10T12:00:00Z"
  }
}
```

**Errors:**
- `SLOT_UNAVAILABLE` - Slot was booked by someone else
- `VALIDATION_ERROR` - Invalid data

---

### GET /api/bookings/[id]

Get booking details.

**Auth:** `owner` (vendor or customer who owns the booking)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "booking-uuid",
    "vendor": { ... },
    "service": { ... },
    "customer": { ... },  // Only for vendor view
    "date": "2024-01-15",
    "startTime": "14:00",
    "endTime": "14:30",
    "status": "CONFIRMED",
    "customerName": "John Doe",
    "customerNotes": "First time customer",
    "vendorNotes": null,
    "createdAt": "2024-01-10T12:00:00Z"
  }
}
```

---

### POST /api/bookings/[id]/cancel

Cancel a booking.

**Auth:** `owner` (vendor or customer)

**Request Body:**
```json
{
  "reason": "Schedule conflict"  // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "booking-uuid",
    "status": "CANCELLED",
    "cancelledAt": "2024-01-12T10:00:00Z",
    "cancelledBy": "customer",
    "cancellationReason": "Schedule conflict"
  }
}
```

**Errors:**
- `VALIDATION_ERROR` - Booking already cancelled/completed

---

### GET /api/customers/me/bookings

List customer's bookings.

**Auth:** `customer`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `status` | string | all | Filter by status |
| `upcoming` | boolean | false | Only future bookings |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-uuid",
      "vendor": {
        "id": "vendor-uuid",
        "businessName": "Joe's Barber Shop",
        "slug": "joes-barber-shop"
      },
      "service": {
        "name": "Haircut",
        "duration": 30
      },
      "date": "2024-01-15",
      "startTime": "14:00",
      "status": "CONFIRMED"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET /api/vendors/me/bookings

List vendor's bookings.

**Auth:** `vendor`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `date` | string | - | Filter by specific date |
| `dateFrom` | string | - | Start of date range |
| `dateTo` | string | - | End of date range |
| `status` | string | all | Filter by status |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "booking-uuid",
      "customer": {
        "id": "customer-uuid",
        "name": "John Doe"
      },
      "service": {
        "name": "Haircut",
        "duration": 30
      },
      "date": "2024-01-15",
      "startTime": "14:00",
      "endTime": "14:30",
      "status": "CONFIRMED",
      "customerName": "John Doe",
      "customerPhone": "+1234567890"
    }
  ],
  "pagination": { ... }
}
```

---

### PUT /api/vendors/me/bookings/[id]/status

Update booking status (vendor only).

**Auth:** `vendor` (owner)

**Request Body:**
```json
{
  "status": "COMPLETED" | "NO_SHOW",
  "vendorNotes": "Client was 10 min late"  // Optional
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "booking-uuid",
    "status": "COMPLETED"
  }
}
```

---

## Search Endpoints

### GET /api/search

Search vendors by location and filters.

**Auth:** `public`

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `lat` | number | Yes | Latitude |
| `lng` | number | Yes | Longitude |
| `radius` | number | No | Radius in km (default: 10) |
| `query` | string | No | Search text |
| `category` | string | No | Category filter |
| `minRating` | number | No | Minimum rating (1-5) |
| `sortBy` | string | No | `distance`, `rating`, `reviews` (default: distance) |
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20, max: 50) |

**Example:** `GET /api/search?lat=40.7128&lng=-74.0060&radius=5&category=barber&sortBy=rating`

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "vendor-uuid",
      "slug": "joes-barber-shop",
      "businessName": "Joe's Barber Shop",
      "description": "Best haircuts in town",
      "address": "123 Main St",
      "city": "New York",
      "location": {
        "lat": 40.7128,
        "lng": -74.0060
      },
      "distance": 0.5,  // km from search point
      "logoUrl": "https://...",
      "averageRating": 4.5,
      "totalReviews": 42,
      "services": [
        { "name": "Haircut", "price": 25.00, "duration": 30 }
      ]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "totalPages": 1
  }
}
```

---

## Review Endpoints

### POST /api/reviews

Create a review for a completed booking.

**Auth:** `customer`

**Request Body:**
```json
{
  "bookingId": "booking-uuid",
  "rating": 5,
  "comment": "Great haircut, very professional!"
}
```

**Validation:**
- Booking must be COMPLETED
- Booking must belong to the customer
- Booking must not already have a review
- Rating must be 1-5

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "review-uuid",
    "bookingId": "booking-uuid",
    "vendorId": "vendor-uuid",
    "rating": 5,
    "comment": "Great haircut, very professional!",
    "createdAt": "2024-01-16T10:00:00Z"
  }
}
```

---

### GET /api/vendors/[vendorId]/reviews

Get vendor's reviews.

**Auth:** `public`

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `sortBy` | string | newest | `newest`, `oldest`, `highest`, `lowest` |
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |

**Response (200):**
```json
{
  "success": true,
  "data": {
    "summary": {
      "averageRating": 4.5,
      "totalReviews": 42,
      "distribution": {
        "5": 25,
        "4": 10,
        "3": 5,
        "2": 1,
        "1": 1
      }
    },
    "reviews": [
      {
        "id": "review-uuid",
        "rating": 5,
        "comment": "Great haircut!",
        "customerName": "John D.",  // First name + last initial
        "vendorResponse": "Thanks for visiting!",
        "respondedAt": "2024-01-17T10:00:00Z",
        "createdAt": "2024-01-16T10:00:00Z"
      }
    ]
  },
  "pagination": { ... }
}
```

---

### POST /api/reviews/[id]/response

Vendor responds to a review.

**Auth:** `vendor` (owner of the reviewed vendor)

**Request Body:**
```json
{
  "response": "Thanks for your kind words!"
}
```

**Validation:**
- Only one response allowed per review
- Max 500 characters

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "review-uuid",
    "vendorResponse": "Thanks for your kind words!",
    "respondedAt": "2024-01-17T10:00:00Z"
  }
}
```

---

## Upload Endpoints

### POST /api/upload/signed-url

Get a signed URL for uploading to Supabase Storage.

**Auth:** `vendor`

**Request Body:**
```json
{
  "fileName": "shop-photo.jpg",
  "fileType": "image/jpeg",
  "folder": "shop-photos"  // vendor-logos, shop-photos, service-images
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "signedUrl": "https://xxx.supabase.co/storage/v1/upload/sign/...",
    "path": "shop-photos/vendor-uuid/shop-photo.jpg",
    "publicUrl": "https://xxx.supabase.co/storage/v1/object/public/..."
  }
}
```

**Upload Flow:**
1. Client requests signed URL
2. Client uploads file directly to signed URL (PUT request)
3. Client saves publicUrl to relevant record via another API call

---

### POST /api/vendors/me/images

Save uploaded image reference.

**Auth:** `vendor`

**Request Body:**
```json
{
  "url": "https://xxx.supabase.co/storage/v1/object/public/...",
  "caption": "Our waiting area",
  "order": 1
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "image-uuid",
    "url": "https://...",
    "caption": "Our waiting area",
    "order": 1
  }
}
```

---

### DELETE /api/vendors/me/images/[id]

Delete an image.

**Auth:** `vendor` (owner)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Image deleted"
  }
}
```

---

## Rate Limits

| Endpoint Group | Limit |
|----------------|-------|
| Auth endpoints | 10 requests/minute |
| Search endpoints | 60 requests/minute |
| Booking creation | 10 requests/minute |
| Other endpoints | 100 requests/minute |

Rate limit headers included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

---

## Webhook Events (Future)

For integrations, we'll provide webhooks for:

| Event | Payload |
|-------|---------|
| `booking.created` | Booking object |
| `booking.cancelled` | Booking object with cancellation info |
| `booking.completed` | Booking object |
| `review.created` | Review object |

---

*Document maintained by: Book-iT Team*
*Last Updated: December 2024*
