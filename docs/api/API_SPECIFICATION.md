# API Specification - Spark Scheduler Pro

**Version:** 1.0
**Base URL:** `https://api.sparkschedulerpro.com/v1`
**Protocol:** HTTPS only
**Authentication:** JWT Bearer Token
**Last Updated:** November 2, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Common Patterns](#common-patterns)
4. [Auth Endpoints](#auth-endpoints)
5. [User Endpoints](#user-endpoints)
6. [Zone Endpoints](#zone-endpoints)
7. [Earnings Endpoints](#earnings-endpoints)
8. [Schedule Endpoints](#schedule-endpoints)
9. [Analytics Endpoints](#analytics-endpoints)
10. [Notification Endpoints](#notification-endpoints)
11. [Error Codes](#error-codes)

---

## Overview

### API Principles
- **RESTful design** - Resources accessed via standard HTTP methods
- **JSON format** - All requests and responses use JSON
- **Versioned** - API version in URL path (`/v1/`)
- **Stateless** - Each request contains all necessary information
- **Idempotent** - Safe to retry GET, PUT, DELETE requests

### Rate Limiting
- **Free tier:** 1,000 requests/hour
- **Pro tier:** 10,000 requests/hour
- **Burst limit:** 100 requests/minute

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 952
X-RateLimit-Reset: 1698765432
```

---

## Authentication

### JWT Bearer Token

All protected endpoints require a JWT token in the `Authorization` header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Structure
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "tier": "pro",
  "iat": 1698765432,
  "exp": 1698851832
}
```

Token expires after 24 hours. Refresh via `/auth/refresh` endpoint.

---

## Common Patterns

### Request Headers
```http
Content-Type: application/json
Authorization: Bearer <token>
X-Client-Version: 1.2.3
X-Platform: ios|android|web
```

### Standard Response Format

#### Success Response (200-299)
```json
{
  "success": true,
  "data": { /* response data */ },
  "meta": {
    "timestamp": "2025-11-02T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

#### Error Response (400-599)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  },
  "meta": {
    "timestamp": "2025-11-02T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

### Pagination
For list endpoints:
```json
{
  "success": true,
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

Query parameters: `?page=1&pageSize=20`

---

## Auth Endpoints

### POST /auth/register

Register a new user account.

**Public endpoint** - No authentication required

**Request:**
```json
{
  "email": "frankie@example.com",
  "password": "SecurePass123!",
  "firstName": "Frank",
  "lastName": "Palmisano",
  "city": "Scottsdale",
  "state": "AZ",
  "timezone": "America/Phoenix"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "frankie@example.com",
      "firstName": "Frank",
      "lastName": "Palmisano",
      "subscriptionTier": "free",
      "emailVerified": false
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-11-03T10:30:00Z"
  }
}
```

**Validation:**
- Email must be valid format and unique
- Password minimum 8 characters, requires uppercase, lowercase, number, special char
- Timezone must be valid IANA timezone

---

### POST /auth/login

Authenticate and receive JWT token.

**Public endpoint**

**Request:**
```json
{
  "email": "frankie@example.com",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "frankie@example.com",
      "firstName": "Frank",
      "subscriptionTier": "pro"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresAt": "2025-11-03T10:30:00Z"
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `403` - Account suspended

---

### POST /auth/refresh

Refresh JWT token before expiration.

**Requires:** Valid (even if near expiry) JWT token

**Request:**
```json
{
  "refreshToken": "current-token-here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "token": "new-token-here",
    "expiresAt": "2025-11-03T10:30:00Z"
  }
}
```

---

### POST /auth/forgot-password

Request password reset email.

**Public endpoint**

**Request:**
```json
{
  "email": "frankie@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "If the email exists, a reset link has been sent."
  }
}
```

---

### POST /auth/reset-password

Reset password with token from email.

**Public endpoint**

**Request:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "NewSecurePass123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Password successfully reset"
  }
}
```

---

## User Endpoints

### GET /users/me

Get current user profile.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "frankie@example.com",
    "firstName": "Frank",
    "lastName": "Palmisano",
    "phoneNumber": "+1-480-555-0123",
    "primaryCity": "Scottsdale",
    "primaryState": "AZ",
    "timezone": "America/Phoenix",
    "subscriptionTier": "pro",
    "emailVerified": true,
    "createdAt": "2025-10-01T08:00:00Z",
    "lastLoginAt": "2025-11-02T09:15:00Z"
  }
}
```

---

### PATCH /users/me

Update current user profile.

**Authentication:** Required

**Request:**
```json
{
  "firstName": "Frank",
  "lastName": "Palmisano",
  "phoneNumber": "+1-480-555-9999",
  "primaryCity": "Phoenix",
  "timezone": "America/Phoenix"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "firstName": "Frank",
    "lastName": "Palmisano",
    "phoneNumber": "+1-480-555-9999",
    "primaryCity": "Phoenix",
    "updatedAt": "2025-11-02T10:30:00Z"
  }
}
```

---

### GET /users/me/preferences

Get user preferences and settings.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "preferredStartTime": "08:00",
    "preferredEndTime": "18:00",
    "preferredDaysOfWeek": [1, 2, 3, 4, 5],
    "minHourlyTarget": 25.00,
    "maxDriveDistanceMiles": 15.0,
    "enableScheduleReminders": true,
    "enableIncentiveAlerts": true,
    "enableSpikeAlerts": true,
    "quietHoursStart": "22:00",
    "quietHoursEnd": "08:00",
    "preferredUnits": "imperial",
    "dashboardLayout": {
      "widgets": ["earnings", "schedule", "heatmap"]
    }
  }
}
```

---

### PATCH /users/me/preferences

Update user preferences.

**Authentication:** Required

**Request:**
```json
{
  "minHourlyTarget": 28.00,
  "enableSpikeAlerts": true,
  "preferredDaysOfWeek": [2, 3, 4, 5, 6]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "minHourlyTarget": 28.00,
    "enableSpikeAlerts": true,
    "preferredDaysOfWeek": [2, 3, 4, 5, 6],
    "updatedAt": "2025-11-02T10:30:00Z"
  }
}
```

---

### DELETE /users/me

Delete user account (GDPR compliance).

**Authentication:** Required

**Request:**
```json
{
  "password": "current-password",
  "confirmDeletion": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Account scheduled for deletion in 30 days",
    "deletionDate": "2025-12-02T10:30:00Z"
  }
}
```

---

## Zone Endpoints

### GET /zones

Get all zones for current user.

**Authentication:** Required

**Query Parameters:**
- `active` (boolean): Filter by active status

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "zone-uuid-1",
      "zoneName": "Scottsdale - Walmart Supercenter",
      "zoneType": "walmart_store",
      "storeId": "1234",
      "address": "9841 E Bell Rd, Scottsdale, AZ 85260",
      "city": "Scottsdale",
      "state": "AZ",
      "zipCode": "85260",
      "latitude": 33.6407,
      "longitude": -111.8918,
      "isPrimary": true,
      "isActive": true,
      "radiusMiles": 10.0,
      "createdAt": "2025-10-05T08:00:00Z"
    },
    {
      "id": "zone-uuid-2",
      "zoneName": "Fountain Hills Area",
      "zoneType": "custom_area",
      "address": "Fountain Hills, AZ",
      "city": "Fountain Hills",
      "state": "AZ",
      "latitude": 33.6119,
      "longitude": -111.7177,
      "isPrimary": false,
      "isActive": true,
      "radiusMiles": 15.0,
      "createdAt": "2025-10-10T12:00:00Z"
    }
  ]
}
```

---

### POST /zones

Create a new zone.

**Authentication:** Required

**Request:**
```json
{
  "zoneName": "Anthem - Walmart",
  "zoneType": "walmart_store",
  "storeId": "5678",
  "address": "40845 N 7th St, Phoenix, AZ 85086",
  "city": "Phoenix",
  "state": "AZ",
  "zipCode": "85086",
  "latitude": 33.8671,
  "longitude": -112.0893,
  "radiusMiles": 12.0,
  "isPrimary": false
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "zone-uuid-3",
    "zoneName": "Anthem - Walmart",
    "zoneType": "walmart_store",
    "storeId": "5678",
    "isActive": true,
    "createdAt": "2025-11-02T10:30:00Z"
  }
}
```

---

### PATCH /zones/:zoneId

Update zone details.

**Authentication:** Required

**Request:**
```json
{
  "zoneName": "Anthem - Walmart Supercenter",
  "radiusMiles": 15.0,
  "isActive": true
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "zone-uuid-3",
    "zoneName": "Anthem - Walmart Supercenter",
    "radiusMiles": 15.0,
    "updatedAt": "2025-11-02T10:35:00Z"
  }
}
```

---

### DELETE /zones/:zoneId

Delete a zone.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Zone deleted successfully"
  }
}
```

---

### GET /zones/:zoneId/incentives

Get current and upcoming incentives for a zone.

**Authentication:** Required

**Query Parameters:**
- `from` (ISO date): Start date filter
- `to` (ISO date): End date filter

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "incentive-uuid-1",
      "zoneId": "zone-uuid-1",
      "incentiveType": "surge",
      "amount": 5.00,
      "description": "+$5 per trip surge",
      "validFrom": "2025-11-02T17:00:00Z",
      "validUntil": "2025-11-02T20:00:00Z",
      "isActive": true,
      "source": "api"
    }
  ]
}
```

---

### POST /zones/:zoneId/incentives

Add an incentive manually.

**Authentication:** Required (Pro tier only)

**Request:**
```json
{
  "incentiveType": "bonus",
  "amount": 10.00,
  "description": "Complete 5 trips, earn $10 bonus",
  "validFrom": "2025-11-03T06:00:00Z",
  "validUntil": "2025-11-03T12:00:00Z",
  "minTrips": 5,
  "timeWindowHours": 6
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "incentive-uuid-2",
    "zoneId": "zone-uuid-1",
    "incentiveType": "bonus",
    "amount": 10.00,
    "isActive": true,
    "createdAt": "2025-11-02T10:40:00Z"
  }
}
```

---

## Earnings Endpoints

### GET /earnings/trips

Get trip history.

**Authentication:** Required

**Query Parameters:**
- `from` (ISO date): Start date (default: 30 days ago)
- `to` (ISO date): End date (default: today)
- `zoneId` (UUID): Filter by zone
- `page` (int): Page number
- `pageSize` (int): Items per page (max 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "trip-uuid-1",
      "tripDate": "2025-11-02",
      "startTime": "2025-11-02T17:15:00Z",
      "endTime": "2025-11-02T17:45:00Z",
      "durationMinutes": 30,
      "tripType": "delivery",
      "orderCount": 1,
      "zoneId": "zone-uuid-1",
      "zoneName": "Scottsdale - Walmart Supercenter",
      "pickupAddress": "9841 E Bell Rd, Scottsdale, AZ",
      "dropoffAddress": "10234 E Via Linda, Scottsdale, AZ",
      "distanceMiles": 4.2,
      "basePay": 12.00,
      "tipAmount": 5.00,
      "incentiveAmount": 0.00,
      "totalEarnings": 17.00,
      "weatherCondition": "sunny",
      "temperatureF": 78,
      "dataSource": "manual"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 156,
    "totalPages": 8
  }
}
```

---

### POST /earnings/trips

Log a new trip.

**Authentication:** Required

**Request:**
```json
{
  "zoneId": "zone-uuid-1",
  "tripDate": "2025-11-02",
  "startTime": "2025-11-02T18:00:00Z",
  "endTime": "2025-11-02T18:25:00Z",
  "tripType": "delivery",
  "orderCount": 1,
  "pickupAddress": "9841 E Bell Rd, Scottsdale, AZ",
  "dropoffAddress": "15234 E Shea Blvd, Scottsdale, AZ",
  "distanceMiles": 5.8,
  "basePay": 14.00,
  "tipAmount": 8.00,
  "incentiveAmount": 5.00,
  "notes": "Customer requested contactless delivery"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "trip-uuid-2",
    "tripDate": "2025-11-02",
    "totalEarnings": 27.00,
    "durationMinutes": 25,
    "earningsPerHour": 64.80,
    "createdAt": "2025-11-02T18:30:00Z"
  }
}
```

---

### POST /earnings/trips/import

Import trips from CSV file.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**Request:**
```
file: trips.csv
zoneId: zone-uuid-1 (optional)
```

**CSV Format:**
```csv
date,start_time,end_time,trip_type,base_pay,tip,incentive,distance_miles,pickup,dropoff
2025-11-01,17:00,17:30,delivery,12.00,5.00,0,4.5,"123 Main St","456 Oak Ave"
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "imported": 47,
    "failed": 2,
    "errors": [
      {
        "row": 12,
        "error": "Invalid date format"
      },
      {
        "row": 23,
        "error": "Missing required field: base_pay"
      }
    ]
  }
}
```

---

### GET /earnings/summary

Get earnings summary for a time period.

**Authentication:** Required

**Query Parameters:**
- `from` (ISO date): Start date (required)
- `to` (ISO date): End date (required)
- `zoneId` (UUID): Filter by zone (optional)
- `groupBy` (string): `day`, `week`, `month` (default: `day`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalEarnings": 1245.50,
    "totalTrips": 87,
    "totalHours": 52.5,
    "totalMiles": 412.3,
    "avgEarningsPerHour": 23.72,
    "avgEarningsPerTrip": 14.32,
    "avgEarningsPerMile": 3.02,
    "breakdown": {
      "basePay": 892.00,
      "tips": 253.50,
      "incentives": 100.00
    },
    "byDate": [
      {
        "date": "2025-11-01",
        "earnings": 156.00,
        "trips": 11,
        "hours": 6.5
      },
      {
        "date": "2025-11-02",
        "earnings": 203.50,
        "trips": 14,
        "hours": 8.0
      }
    ]
  }
}
```

---

## Schedule Endpoints

### GET /schedule/predictions

Get ML-predicted optimal schedule.

**Authentication:** Required (Pro tier only)

**Query Parameters:**
- `date` (ISO date): Prediction date (default: tomorrow)
- `days` (int): Number of days to predict (1-7, default: 7)
- `zoneId` (UUID): Specific zone (optional, default: all zones)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "predictions": [
      {
        "date": "2025-11-03",
        "dayOfWeek": "Sunday",
        "timeSlots": [
          {
            "hour": 17,
            "hourRange": "5:00 PM - 6:00 PM",
            "zoneId": "zone-uuid-1",
            "zoneName": "Scottsdale - Walmart Supercenter",
            "predictedEarningsPerHour": 32.50,
            "predictedTripCount": 4,
            "confidenceScore": 0.89,
            "demandLevel": "high",
            "isHotZone": true,
            "weatherCondition": "sunny",
            "temperatureF": 75
          },
          {
            "hour": 18,
            "hourRange": "6:00 PM - 7:00 PM",
            "zoneId": "zone-uuid-1",
            "zoneName": "Scottsdale - Walmart Supercenter",
            "predictedEarningsPerHour": 28.00,
            "predictedTripCount": 3,
            "confidenceScore": 0.85,
            "demandLevel": "medium",
            "isHotZone": false
          }
        ],
        "bestHours": [17, 11, 18],
        "recommendedShift": {
          "start": "5:00 PM",
          "end": "8:00 PM",
          "estimatedEarnings": 87.50,
          "estimatedTrips": 10
        }
      }
    ],
    "modelVersion": "1.2.3",
    "generatedAt": "2025-11-02T10:00:00Z"
  }
}
```

---

### POST /schedule/export

Export schedule to calendar.

**Authentication:** Required (Pro tier only)

**Request:**
```json
{
  "date": "2025-11-03",
  "shifts": [
    {
      "start": "2025-11-03T17:00:00Z",
      "end": "2025-11-03T20:00:00Z",
      "zoneId": "zone-uuid-1"
    }
  ],
  "calendarType": "google",
  "includeReminders": true,
  "reminderMinutes": 30
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "exported": 1,
    "calendarEvents": [
      {
        "eventId": "google-event-id-123",
        "title": "Spark Delivery - Scottsdale",
        "start": "2025-11-03T17:00:00Z",
        "end": "2025-11-03T20:00:00Z",
        "calendarUrl": "https://calendar.google.com/..."
      }
    ]
  }
}
```

---

## Analytics Endpoints

### GET /analytics/heatmap

Get earnings heatmap data.

**Authentication:** Required

**Query Parameters:**
- `from` (ISO date): Start date (required)
- `to` (ISO date): End date (required)
- `zoneId` (UUID): Filter by zone (optional)
- `metric` (string): `earnings`, `trips`, `hourly_rate` (default: `earnings`)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "metric": "earnings",
    "heatmap": [
      {
        "dayOfWeek": 0,
        "dayName": "Sunday",
        "hours": [
          {"hour": 0, "value": 0},
          {"hour": 1, "value": 0},
          {"hour": 6, "value": 12.50},
          {"hour": 7, "value": 18.75},
          {"hour": 17, "value": 45.00},
          {"hour": 18, "value": 38.50}
        ]
      },
      {
        "dayOfWeek": 1,
        "dayName": "Monday",
        "hours": [
          {"hour": 11, "value": 28.00},
          {"hour": 12, "value": 32.50},
          {"hour": 17, "value": 42.00}
        ]
      }
    ],
    "summary": {
      "bestDay": "Tuesday",
      "bestHour": 17,
      "peakValue": 52.00
    }
  }
}
```

---

### GET /analytics/weekly-report

Get weekly performance report.

**Authentication:** Required

**Query Parameters:**
- `weekStart` (ISO date): Start of week (Monday)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "weekStart": "2025-10-28",
    "weekEnd": "2025-11-03",
    "summary": {
      "totalEarnings": 1456.75,
      "totalTrips": 98,
      "totalHours": 58.5,
      "totalMiles": 487.2,
      "avgHourlyRate": 24.90
    },
    "bestPerformance": {
      "bestDay": "2025-11-01",
      "bestZone": "zone-uuid-1",
      "bestHourRange": "5pm-7pm",
      "bestDayEarnings": 287.50
    },
    "comparison": {
      "earningsVsPrevWeek": 12.5,
      "tripsVsPrevWeek": 8.2,
      "hourlyRateVsPrevWeek": 4.1
    },
    "insights": [
      {
        "type": "peak_performance",
        "title": "Best Time Found",
        "message": "Your highest earnings were Tuesday 5-7pm at $34/hour"
      },
      {
        "type": "trend",
        "title": "Earnings Improving",
        "message": "Your hourly rate increased 12.5% this week"
      }
    ],
    "recommendations": [
      {
        "type": "schedule",
        "message": "Focus on Tuesday and Thursday evenings for best results"
      },
      {
        "type": "zone",
        "message": "Scottsdale zone consistently outperforms by 18%"
      }
    ]
  }
}
```

---

### GET /analytics/performance-trends

Get long-term performance trends.

**Authentication:** Required

**Query Parameters:**
- `metric` (string): `earnings`, `hourly_rate`, `trips` (required)
- `period` (string): `daily`, `weekly`, `monthly` (default: `weekly`)
- `from` (ISO date): Start date (default: 90 days ago)
- `to` (ISO date): End date (default: today)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "metric": "hourly_rate",
    "period": "weekly",
    "dataPoints": [
      {
        "periodStart": "2025-09-01",
        "periodEnd": "2025-09-07",
        "value": 22.50,
        "trips": 67,
        "hours": 42.0
      },
      {
        "periodStart": "2025-09-08",
        "periodEnd": "2025-09-14",
        "value": 23.75,
        "trips": 71,
        "hours": 44.5
      }
    ],
    "trend": {
      "direction": "increasing",
      "changePercent": 15.2,
      "average": 24.12
    }
  }
}
```

---

## Notification Endpoints

### GET /notifications

Get user notifications.

**Authentication:** Required

**Query Parameters:**
- `unread` (boolean): Filter unread only
- `type` (string): Filter by notification type
- `page` (int): Page number
- `pageSize` (int): Items per page

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "notif-uuid-1",
      "type": "spike_alert",
      "title": "High Demand Alert",
      "body": "Earnings in Scottsdale zone up 45% right now!",
      "actionUrl": "sparkscheduler://schedule/zone-uuid-1",
      "isRead": false,
      "priority": "high",
      "createdAt": "2025-11-02T17:00:00Z"
    },
    {
      "id": "notif-uuid-2",
      "type": "incentive_alert",
      "title": "New Incentive Available",
      "body": "$10 bonus for completing 5 trips between 6-10pm",
      "isRead": true,
      "readAt": "2025-11-02T17:05:00Z",
      "createdAt": "2025-11-02T16:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 47
  }
}
```

---

### PATCH /notifications/:notificationId/read

Mark notification as read.

**Authentication:** Required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "notif-uuid-1",
    "isRead": true,
    "readAt": "2025-11-02T18:00:00Z"
  }
}
```

---

### POST /notifications/register-device

Register device for push notifications.

**Authentication:** Required

**Request:**
```json
{
  "deviceToken": "fcm-token-here",
  "platform": "ios",
  "deviceId": "device-unique-id",
  "deviceName": "Frank's iPhone"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "registered": true,
    "deviceId": "device-unique-id"
  }
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

### Custom Error Codes

| Error Code | Description |
|------------|-------------|
| `VALIDATION_ERROR` | Input validation failed |
| `AUTH_FAILED` | Authentication failed |
| `TOKEN_EXPIRED` | JWT token expired |
| `INSUFFICIENT_TIER` | Feature requires Pro subscription |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `RESOURCE_NOT_FOUND` | Requested resource not found |
| `DUPLICATE_RESOURCE` | Resource already exists |
| `ML_SERVICE_UNAVAILABLE` | ML prediction service unavailable |
| `EXTERNAL_API_ERROR` | Third-party API error |
| `INVALID_CSV_FORMAT` | CSV import format invalid |

### Example Error Response

```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_TIER",
    "message": "This feature requires a Pro subscription",
    "details": {
      "requiredTier": "pro",
      "currentTier": "free",
      "upgradeUrl": "https://app.sparkschedulerpro.com/upgrade"
    }
  },
  "meta": {
    "timestamp": "2025-11-02T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

---

## Webhooks (Future Feature)

### POST /webhooks

Configure webhooks for events (Pro tier only).

**Events:**
- `trip.created` - New trip logged
- `schedule.generated` - New schedule predictions available
- `incentive.detected` - New incentive detected
- `report.generated` - Weekly report generated

---

**Document Owner:** API Team
**Review Cycle:** On API changes or monthly
