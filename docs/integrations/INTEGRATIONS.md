# External Integrations - Spark Scheduler Pro

**Version:** 1.0
**Last Updated:** November 2, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Maps Integration (Google Maps / Mapbox)](#maps-integration)
3. [Calendar Integration (Google Calendar)](#calendar-integration)
4. [Weather Integration (OpenWeatherMap)](#weather-integration)
5. [Push Notifications (Firebase FCM)](#push-notifications)
6. [Payment Processing (Stripe)](#payment-processing)
7. [Future Integrations](#future-integrations)

---

## Overview

Spark Scheduler Pro integrates with several third-party services to provide core functionality. This document outlines integration specifications, API usage, error handling, and fallback strategies.

### Integration Summary

| Service | Provider | Purpose | Tier | Cost |
|---------|----------|---------|------|------|
| Maps API | Google Maps | Distance calculation, geocoding | Both | $0.005/request |
| Calendar | Google Calendar API | Schedule export | Pro | Free |
| Weather | OpenWeatherMap | Weather forecasting | Both | Free (1M calls/mo) |
| Push Notifications | Firebase FCM | Mobile notifications | Both | Free |
| Email | SendGrid | Transactional emails | Both | $0.0003/email |
| Payments | Stripe | Subscription billing | Pro | 2.9% + $0.30 |

---

## Maps Integration

### Primary: Google Maps API

**Documentation:** https://developers.google.com/maps

**APIs Used:**
1. Geocoding API - Convert addresses to coordinates
2. Distance Matrix API - Calculate travel distances
3. Places API - Search for Walmart stores

### Configuration

```javascript
// Environment variables
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// SDK initialization
import { Client } from '@googlemaps/google-maps-services-js';

const mapsClient = new Client({});
```

### 1. Geocoding API

**Use Case:** Convert user-entered addresses to lat/long coordinates

**Endpoint:** `https://maps.googleapis.com/maps/api/geocode/json`

**Request:**
```javascript
async function geocodeAddress(address) {
    const response = await mapsClient.geocode({
        params: {
            address: address,
            key: GOOGLE_MAPS_API_KEY
        }
    });

    if (response.data.status === 'OK') {
        const location = response.data.results[0].geometry.location;
        return {
            latitude: location.lat,
            longitude: location.lng,
            formattedAddress: response.data.results[0].formatted_address
        };
    } else {
        throw new Error(`Geocoding failed: ${response.data.status}`);
    }
}
```

**Example:**
```javascript
const result = await geocodeAddress('9841 E Bell Rd, Scottsdale, AZ 85260');
// Returns: { latitude: 33.6407, longitude: -111.8918, ... }
```

**Rate Limits:** 50 requests/second
**Cost:** $5 per 1,000 requests
**Caching:** Cache results for 30 days (address → coordinates mapping)

---

### 2. Distance Matrix API

**Use Case:** Calculate drive distance and time between pickup and dropoff

**Endpoint:** `https://maps.googleapis.com/maps/api/distancematrix/json`

**Request:**
```javascript
async function calculateDistance(origin, destination) {
    const response = await mapsClient.distancematrix({
        params: {
            origins: [origin],
            destinations: [destination],
            mode: 'driving',
            units: 'imperial',
            key: GOOGLE_MAPS_API_KEY
        }
    });

    if (response.data.status === 'OK') {
        const element = response.data.rows[0].elements[0];

        return {
            distanceMiles: element.distance.value / 1609.34, // meters to miles
            durationMinutes: element.duration.value / 60,    // seconds to minutes
            distanceText: element.distance.text,
            durationText: element.duration.text
        };
    } else {
        throw new Error(`Distance calculation failed: ${response.data.status}`);
    }
}
```

**Example:**
```javascript
const distance = await calculateDistance(
    '33.6407,-111.8918',  // Pickup
    '33.6119,-111.7177'   // Dropoff
);
// Returns: { distanceMiles: 8.3, durationMinutes: 15, ... }
```

**Rate Limits:** 100 requests/second
**Cost:** $5 per 1,000 requests
**Caching:** Cache results for common routes (7 days)

---

### 3. Places API

**Use Case:** Find nearby Walmart stores for zone creation

**Endpoint:** `https://maps.googleapis.com/maps/api/place/nearbysearch/json`

**Request:**
```javascript
async function findNearbyWalmarts(latitude, longitude, radiusMiles = 25) {
    const radiusMeters = radiusMiles * 1609.34;

    const response = await mapsClient.placesNearby({
        params: {
            location: `${latitude},${longitude}`,
            radius: radiusMeters,
            keyword: 'Walmart Supercenter',
            key: GOOGLE_MAPS_API_KEY
        }
    });

    if (response.data.status === 'OK') {
        return response.data.results.map(place => ({
            name: place.name,
            address: place.vicinity,
            placeId: place.place_id,
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
            rating: place.rating,
            isOpen: place.opening_hours?.open_now
        }));
    }

    return [];
}
```

**Example:**
```javascript
const stores = await findNearbyWalmarts(33.6407, -111.8918, 15);
// Returns array of nearby Walmart locations
```

**Rate Limits:** 100 requests/second
**Cost:** $17 per 1,000 requests (higher tier)
**Caching:** Cache store locations for 7 days

---

### Alternative: Mapbox API

**Why:** Lower cost ($0.0006 vs $0.005 per request for geocoding)

**Configuration:**
```javascript
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const mapboxClient = require('@mapbox/mapbox-sdk/services/geocoding');
const geocodingService = mapboxClient({ accessToken: MAPBOX_ACCESS_TOKEN });
```

**Geocoding:**
```javascript
async function geocodeWithMapbox(address) {
    const response = await geocodingService.forwardGeocode({
        query: address,
        limit: 1
    }).send();

    const feature = response.body.features[0];
    return {
        latitude: feature.geometry.coordinates[1],
        longitude: feature.geometry.coordinates[0],
        formattedAddress: feature.place_name
    };
}
```

---

### Error Handling

```javascript
class MapsError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = 'MapsError';
    }
}

async function geocodeWithRetry(address, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await geocodeAddress(address);
        } catch (error) {
            if (error.response?.status === 429) {
                // Rate limit exceeded - exponential backoff
                await sleep(Math.pow(2, attempt) * 1000);
            } else if (error.response?.status >= 500) {
                // Server error - retry
                await sleep(1000 * attempt);
            } else {
                // Client error - don't retry
                throw new MapsError(error.response?.status, error.message);
            }
        }
    }
    throw new Error('Max retries exceeded for geocoding');
}
```

---

## Calendar Integration

### Google Calendar API

**Documentation:** https://developers.google.com/calendar

**OAuth 2.0 Scopes Required:**
- `https://www.googleapis.com/auth/calendar.events` - Create/read/update events

### Authentication Flow

```javascript
import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
);

// Step 1: Generate auth URL
function getAuthUrl() {
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar.events'],
        prompt: 'consent'
    });
}

// Step 2: Exchange code for tokens
async function getTokens(authCode) {
    const { tokens } = await oauth2Client.getToken(authCode);
    oauth2Client.setCredentials(tokens);

    // Store refresh_token in database
    await storeUserTokens(userId, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date
    });

    return tokens;
}

// Step 3: Refresh access token when expired
async function refreshAccessToken(userId) {
    const userTokens = await getUserTokens(userId);

    oauth2Client.setCredentials({
        refresh_token: userTokens.refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update stored tokens
    await updateUserTokens(userId, {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date
    });

    return credentials.access_token;
}
```

### Create Calendar Event

```javascript
async function createScheduleEvent(userId, shift) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        summary: `Spark Delivery - ${shift.zoneName}`,
        description: `
            Predicted Earnings: $${shift.estimatedEarnings}
            Estimated Trips: ${shift.estimatedTrips}
            Zone: ${shift.zoneName}

            Generated by Spark Scheduler Pro
        `.trim(),
        start: {
            dateTime: shift.startTime, // ISO 8601 format
            timeZone: shift.timezone
        },
        end: {
            dateTime: shift.endTime,
            timeZone: shift.timezone
        },
        location: shift.address,
        reminders: {
            useDefault: false,
            overrides: [
                { method: 'popup', minutes: 30 },
                { method: 'notification', minutes: 15 }
            ]
        },
        colorId: '9', // Blue color for work events
        extendedProperties: {
            private: {
                sparkSchedulerProId: shift.id,
                zoneId: shift.zoneId
            }
        }
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event
        });

        return {
            eventId: response.data.id,
            htmlLink: response.data.htmlLink
        };
    } catch (error) {
        if (error.code === 401) {
            // Token expired, refresh and retry
            await refreshAccessToken(userId);
            return createScheduleEvent(userId, shift);
        }
        throw error;
    }
}
```

### Update Event

```javascript
async function updateScheduleEvent(userId, eventId, updates) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: updates
    });
}
```

### Delete Event

```javascript
async function deleteScheduleEvent(userId, eventId) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId
    });
}
```

### Batch Create Events

```javascript
async function batchCreateEvents(userId, shifts) {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const batch = shifts.map(shift => ({
        method: 'POST',
        path: '/calendar/v3/calendars/primary/events',
        body: createEventBody(shift)
    }));

    const response = await calendar.batch.execute({ requests: batch });

    return response.map((res, index) => ({
        shiftId: shifts[index].id,
        eventId: res.data.id,
        success: res.status === 200
    }));
}
```

**Rate Limits:** 1,000 queries per 100 seconds per user
**Cost:** Free
**Quota:** 1,000,000 requests/day

---

## Weather Integration

### OpenWeatherMap API

**Documentation:** https://openweathermap.org/api

**API Plan:** Free tier (1,000,000 calls/month)

### Configuration

```javascript
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

const axios = require('axios');
```

### 1. Current Weather

**Use Case:** Get current weather for trip logging

**Endpoint:** `/weather`

```javascript
async function getCurrentWeather(latitude, longitude) {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/weather`, {
        params: {
            lat: latitude,
            lon: longitude,
            appid: OPENWEATHER_API_KEY,
            units: 'imperial' // Fahrenheit
        }
    });

    const data = response.data;

    return {
        condition: data.weather[0].main.toLowerCase(), // sunny, rainy, snowy
        description: data.weather[0].description,
        temperatureF: Math.round(data.main.temp),
        feelsLikeF: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        windSpeedMph: Math.round(data.wind.speed),
        timestamp: new Date(data.dt * 1000)
    };
}
```

**Example:**
```javascript
const weather = await getCurrentWeather(33.6407, -111.8918);
// Returns: { condition: 'clear', temperatureF: 78, ... }
```

---

### 2. Hourly Forecast (48 hours)

**Use Case:** Weather predictions for ML model

**Endpoint:** `/forecast`

```javascript
async function getHourlyForecast(latitude, longitude) {
    const response = await axios.get(`${OPENWEATHER_BASE_URL}/forecast`, {
        params: {
            lat: latitude,
            lon: longitude,
            appid: OPENWEATHER_API_KEY,
            units: 'imperial',
            cnt: 40 // 40 x 3-hour intervals = 5 days
        }
    });

    return response.data.list.map(item => ({
        timestamp: new Date(item.dt * 1000),
        condition: item.weather[0].main.toLowerCase(),
        temperatureF: Math.round(item.main.temp),
        humidity: item.main.humidity,
        precipitationMm: item.rain?.['3h'] || 0,
        windSpeedMph: Math.round(item.wind.speed)
    }));
}
```

---

### 3. Daily Forecast (7 days)

**Use Case:** Weekly schedule planning

**Endpoint:** `/forecast/daily` (Paid tier) or use `/forecast` and aggregate

```javascript
async function getDailyForecast(latitude, longitude, days = 7) {
    // Free tier: Use 3-hour forecast and aggregate to daily
    const hourlyData = await getHourlyForecast(latitude, longitude);

    const dailyData = {};

    hourlyData.forEach(hour => {
        const date = hour.timestamp.toISOString().split('T')[0];

        if (!dailyData[date]) {
            dailyData[date] = {
                date: date,
                temps: [],
                conditions: [],
                precipitation: 0
            };
        }

        dailyData[date].temps.push(hour.temperatureF);
        dailyData[date].conditions.push(hour.condition);
        dailyData[date].precipitation += hour.precipitationMm;
    });

    return Object.values(dailyData).map(day => ({
        date: day.date,
        avgTempF: Math.round(day.temps.reduce((a, b) => a + b) / day.temps.length),
        maxTempF: Math.max(...day.temps),
        minTempF: Math.min(...day.temps),
        condition: getMostFrequent(day.conditions),
        totalPrecipitation: day.precipitation
    })).slice(0, days);
}

function getMostFrequent(arr) {
    return arr.sort((a, b) =>
        arr.filter(v => v === a).length - arr.filter(v => v === b).length
    ).pop();
}
```

---

### Weather Data Caching

```javascript
// Cache weather data to minimize API calls
const WEATHER_CACHE_TTL = 30 * 60; // 30 minutes

async function getCachedWeather(latitude, longitude) {
    const cacheKey = `weather:${latitude.toFixed(2)}:${longitude.toFixed(2)}`;

    // Try cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }

    // Fetch fresh data
    const weather = await getCurrentWeather(latitude, longitude);

    // Store in cache
    await redis.setex(cacheKey, WEATHER_CACHE_TTL, JSON.stringify(weather));

    return weather;
}
```

---

### Weather Condition Normalization

```javascript
// Normalize weather conditions for ML model
function normalizeWeatherCondition(apiCondition) {
    const conditionMap = {
        'clear': 'sunny',
        'clouds': 'cloudy',
        'rain': 'rainy',
        'drizzle': 'rainy',
        'thunderstorm': 'stormy',
        'snow': 'snowy',
        'mist': 'foggy',
        'fog': 'foggy',
        'haze': 'hazy'
    };

    return conditionMap[apiCondition.toLowerCase()] || 'other';
}
```

**Rate Limits:** 60 calls/minute (free tier)
**Cost:** Free up to 1M calls/month
**Caching Strategy:** 30-minute cache for current weather, 6-hour cache for forecasts

---

## Push Notifications

### Firebase Cloud Messaging (FCM)

**Documentation:** https://firebase.google.com/docs/cloud-messaging

**Platform Support:** iOS, Android, Web

### Configuration

```javascript
import admin from 'firebase-admin';

admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    })
});

const messaging = admin.messaging();
```

### Send Push Notification

```javascript
async function sendPushNotification(userId, notification) {
    // Get user's FCM token(s) from database
    const deviceTokens = await getUserDeviceTokens(userId);

    if (deviceTokens.length === 0) {
        return { success: false, reason: 'No device tokens' };
    }

    const message = {
        notification: {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.imageUrl
        },
        data: {
            type: notification.type,
            actionUrl: notification.actionUrl,
            notificationId: notification.id
        },
        tokens: deviceTokens,
        apns: {
            payload: {
                aps: {
                    sound: 'default',
                    badge: notification.badge || 1,
                    category: notification.type
                }
            }
        },
        android: {
            priority: 'high',
            notification: {
                sound: 'default',
                channelId: 'alerts',
                color: '#007AFF'
            }
        }
    };

    try {
        const response = await messaging.sendMulticast(message);

        // Log results
        await logNotificationDelivery({
            notificationId: notification.id,
            successCount: response.successCount,
            failureCount: response.failureCount,
            responses: response.responses
        });

        // Remove invalid tokens
        const invalidTokens = response.responses
            .map((resp, idx) => resp.success ? null : deviceTokens[idx])
            .filter(token => token !== null);

        if (invalidTokens.length > 0) {
            await removeDeviceTokens(userId, invalidTokens);
        }

        return {
            success: true,
            delivered: response.successCount,
            failed: response.failureCount
        };

    } catch (error) {
        console.error('FCM Error:', error);
        return { success: false, error: error.message };
    }
}
```

### Notification Types

```javascript
// Spike Alert
await sendPushNotification(userId, {
    id: notificationId,
    type: 'spike_alert',
    title: 'High Demand Alert! 🔥',
    body: 'Earnings in Scottsdale zone up 45% right now',
    actionUrl: 'sparkscheduler://schedule/zone-uuid',
    badge: 1
});

// Incentive Alert
await sendPushNotification(userId, {
    type: 'incentive_alert',
    title: 'New Bonus Available 💰',
    body: '$10 bonus for 5 trips between 6-10pm',
    actionUrl: 'sparkscheduler://incentives/incentive-uuid'
});

// Schedule Reminder
await sendPushNotification(userId, {
    type: 'schedule_reminder',
    title: 'Shift Starting Soon',
    body: 'Your optimal shift starts in 30 minutes',
    actionUrl: 'sparkscheduler://schedule'
});
```

### Topic-Based Notifications

```javascript
// Subscribe user to topics (e.g., zone-specific alerts)
async function subscribeToTopic(deviceToken, topic) {
    await messaging.subscribeToTopic([deviceToken], topic);
}

// Send to all users in a zone
async function sendZoneAlert(zoneId, message) {
    await messaging.send({
        notification: message,
        topic: `zone_${zoneId}`
    });
}
```

**Rate Limits:** No hard limit (reasonable use)
**Cost:** Free
**Delivery Rate:** ~99% for active devices

---

## Payment Processing

### Stripe API

**Documentation:** https://stripe.com/docs/api

**Use Cases:**
- Subscription management (Free → Pro upgrade)
- Payment processing
- Billing portal

### Configuration

```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

### Create Subscription

```javascript
async function createSubscription(userId, email) {
    // 1. Create Stripe customer
    const customer = await stripe.customers.create({
        email: email,
        metadata: { userId: userId }
    });

    // 2. Create subscription
    const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
            { price: process.env.STRIPE_PRO_PRICE_ID } // $4.99/month
        ],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 7 // 7-day free trial
    });

    // 3. Store in database
    await storeSubscription({
        userId: userId,
        stripeCustomerId: customer.id,
        stripeSubscriptionId: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });

    return {
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
    };
}
```

### Handle Webhooks

```javascript
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        switch (event.type) {
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;

            case 'customer.subscription.deleted':
                await handleSubscriptionCancelled(event.data.object);
                break;

            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object);
                break;

            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object);
                break;
        }

        res.json({ received: true });
    } catch (err) {
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
});

async function handleSubscriptionUpdated(subscription) {
    await updateUserSubscription(subscription.metadata.userId, {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    });

    if (subscription.status === 'active') {
        await upgradeUserTier(subscription.metadata.userId, 'pro');
    }
}
```

**Rate Limits:** 100 requests/second
**Cost:** 2.9% + $0.30 per transaction
**Security:** Verify webhook signatures

---

## Future Integrations

### 1. Walmart Spark API (if available)

```javascript
// Hypothetical integration if Walmart provides API
async function fetchSparkIncentives(driverId) {
    // Would fetch real-time incentives directly from Spark
}
```

### 2. Apple Calendar (CalDAV)

For iOS users who prefer Apple Calendar over Google.

### 3. Waze Traffic API

Real-time traffic data to improve drive time predictions.

### 4. Twilio SMS

SMS notifications for users who prefer texts over push notifications.

### 5. Zapier Integration

Allow users to create custom automations (e.g., "When hot zone alert → Send Slack message").

---

**Document Owner:** Integrations Team
**Review Cycle:** Quarterly or on integration changes
