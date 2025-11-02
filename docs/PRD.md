# Product Requirements Document (PRD)

**Project Title:** Spark Scheduler Pro

**Author:** Frank Palmisano

**Date:** November 1, 2025

**Version:** 1.0

---

## 1. Overview

### Goal
Create an intelligent scheduling and analytics app for Walmart Spark drivers (and compatible gig platforms) that automatically determines the most profitable times and places to drive based on real-time and historical data.

### Purpose
Help users (like Frankie) maximize hourly earnings by recommending optimal shift windows, store zones, and break times—based on demand patterns, incentive timing, location heatmaps, and personal performance data.

### Core Idea

> "Stop guessing when to drive—let AI tell you the best time to log on."

---

## 2. Target Users

| Segment | Description | Core Needs |
|---------|-------------|------------|
| New Drivers | Recently joined Spark or DoorDash; unfamiliar with optimal hours | Simple setup, basic recommendations |
| Active Drivers | Experienced gig workers looking to increase hourly pay | Predictive insights, historical earnings analysis |
| Data-Driven Drivers | Trackers and optimizers | Advanced analytics, custom schedule exports |

### Example Persona
- **Name:** Frankie
- **Location:** Scottsdale / Fountain Hills, AZ
- **Goal:** Make $150+ per day efficiently without trial and error
- **Pain Points:** Inconsistent demand, wasted idle time, overlapping incentives

---

## 3. Problem Statement

Walmart Spark and similar apps lack built-in schedule optimization. Drivers rely on trial-and-error or online chatter to determine "hot" times. There's no unified tool that:
- Aggregates local historical data
- Tracks personal earnings patterns
- Predicts best shift times automatically

---

## 4. Key Features & Requirements

### 4.1 Core Features

| Feature | Description | Priority |
|---------|-------------|----------|
| Smart Scheduler (AI Core) | Uses machine learning to suggest the best daily windows (by store & time) based on past Spark activity and community trends. | ★★★★★ |
| Real-Time Incentive Tracker | Pulls live Spark incentives (via API or manual input) and dynamically updates recommended shifts. | ★★★★★ |
| Earnings Tracker & Heatmap | Visualizes earnings/hour, trips, and miles by time slot, weekday, and location. | ★★★★☆ |
| Calendar Sync | Exports suggested shifts to Google/Apple calendar with reminders. | ★★★☆☆ |
| Multi-Zone Planning | Supports multiple home/store zones (e.g., Anthem + Scottsdale). | ★★★☆☆ |
| Offline Mode | Saves last 7 days of data for reference when no network is available. | ★★★☆☆ |
| Notifications & Alerts | Push alerts for new bonuses or when hourly rates spike in nearby zones. | ★★★★☆ |

### 4.2 Optional / Future Features
- Integration with Gridwise, Para, or DoorDash for cross-platform optimization
- Fuel cost and mileage tracking to calculate true net hourly rate
- AI Assistant "Ella Drive" to chat, ask questions, and auto-schedule shifts
- Community Dashboard for comparing earnings anonymously by ZIP code

---

## 5. User Experience (UX) Flow

1. **Sign-Up:** Create account → input city → connect Spark account or manually log earnings
2. **Learning Phase:** 7-day passive data collection → app identifies patterns
3. **Optimization Phase:** Dashboard displays "Best Times" and "Hot Zones"
4. **Automation Phase:** User enables "Auto-Schedule," app pushes next week's optimized shifts to Calendar
5. **Review Phase:** Weekly report summarizing earnings, idle time, and trend predictions

---

## 6. Data Inputs

| Source | Data Type | Collection Method |
|--------|-----------|-------------------|
| Spark App | Delivery logs, incentives, tips | Manual upload / API (if permitted) |
| GPS / Maps | Drive time, distance, location heatmaps | Background tracking |
| Calendar | Availability windows | User input |
| Earnings History | $/trip, $/hour | User entry or CSV import |
| Weather Data | Rain, heat, etc. | API integration (affects demand) |

---

## 7. Technical Architecture (High-Level)

- **Frontend:** React Native (cross-platform mobile) or Swift/Flutter for mobile-first design
- **Backend:** Node.js + Express with Firebase or AWS DynamoDB
- **Machine Learning:**
  - Regression model + time-series forecasting for demand prediction
  - Optional reinforcement learning layer to refine personalized suggestions
- **Integrations:**
  - Google Calendar API
  - Walmart Spark (if public API is accessible) or manual CSV imports
  - Mapbox or Google Maps API for route mapping

---

## 8. Success Metrics

| KPI | Target |
|-----|--------|
| Increase average hourly earnings | +15–25% after 30 days |
| Reduce idle time per shift | −30% |
| Daily app engagement | 3+ opens per day |
| Weekly retention | 80% after 4 weeks |

---

## 9. Competitive Landscape

| Competitor | Focus | Weakness |
|------------|-------|----------|
| Gridwise | Multi-app analytics | No predictive AI scheduling |
| Para | Pay transparency | Focused on DoorDash/Uber, not Spark |
| Solo | Pay guarantees | Limited market coverage |
| Spark Scheduler Pro | AI + localized schedule optimization | Built for Spark first |

---

## 10. Timeline (MVP Launch Plan)

| Phase | Deliverable | ETA |
|-------|-------------|-----|
| Discovery & Design | Wireframes, API research | 2 weeks |
| MVP Build | Core Scheduler, Manual Data Input, Dashboard | 6 weeks |
| Beta Testing | Invite local AZ Spark drivers | 2 weeks |
| Launch (v1.0) | iOS + Android | ~10 weeks total |
| Post-Launch | Calendar sync, notifications, AI fine-tuning | +3 weeks |

---

## 11. Monetization Model

- **Free Tier:** Basic scheduling, manual data input, 7-day reports
- **Pro Tier ($4.99/month):**
  - Live incentive tracking
  - AI-powered optimization
  - Calendar sync
  - Personalized insights
- **Affiliate Revenue:** Optional referrals (fuel apps, insurance, etc.)

---

## 12. Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| Spark API access limitations | Manual CSV imports / scraping incentive emails |
| Low data volume per user | Hybrid model using community heatmaps |
| User privacy | Data anonymization + local storage encryption |
| Platform ToS conflicts | Strict adherence to non-automation guidelines |

---

## 13. Future Roadmap

- Integration with Apple Watch / CarPlay for real-time driving alerts
- Predictive surge notifications ("Expect +25% pay at 5:30pm")
- Community benchmarks (compare by city)
- Voice assistant support ("Hey Ella, when should I drive today?")
