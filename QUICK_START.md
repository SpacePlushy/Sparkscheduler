# Quick Start Guide - Spark Scheduler Pro

**Get the backend API running in 5 minutes!**

---

## ⚡ Super Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/SpacePlushy/Sparkscheduler.git
cd Sparkscheduler

# 2. Copy environment file
cp .env.example .env

# 3. Start all services with Docker
docker-compose up -d

# 4. Wait 10 seconds for databases to initialize, then check health
curl http://localhost:3000/health

# 5. You're ready! API is running on http://localhost:3000
```

---

## 📱 Test the API

### Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "SecurePass123!",
    "firstName": "Test",
    "lastName": "Driver",
    "city": "Scottsdale",
    "state": "AZ"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
      "email": "driver@example.com",
      "firstName": "Test",
      "subscriptionTier": "free"
    },
    "token": "eyJhbG...",
    "expiresAt": "2025-11-03T10:00:00Z"
  }
}
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "driver@example.com",
    "password": "SecurePass123!"
  }'
```

### Create a delivery zone

```bash
# Replace YOUR_TOKEN with the token from login/register
curl -X POST http://localhost:3000/api/zones \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "zoneName": "Scottsdale - Walmart Supercenter",
    "zoneType": "walmart_store",
    "address": "9841 E Bell Rd, Scottsdale, AZ 85260",
    "city": "Scottsdale",
    "state": "AZ",
    "latitude": 33.6407,
    "longitude": -111.8918,
    "radiusMiles": 10
  }'
```

### Log a trip

```bash
curl -X POST http://localhost:3000/api/earnings/trips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tripDate": "2025-11-02",
    "startTime": "2025-11-02T17:00:00Z",
    "endTime": "2025-11-02T17:30:00Z",
    "basePay": 12.50,
    "tipAmount": 5.00,
    "incentiveAmount": 0,
    "distanceMiles": 4.2,
    "tripType": "delivery"
  }'
```

### Get earnings summary

```bash
curl -X GET "http://localhost:3000/api/earnings/summary?from=2025-11-01&to=2025-11-30" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEarnings": 17.50,
    "totalTrips": 1,
    "totalHours": 0.5,
    "totalMiles": 4.2,
    "avgEarningsPerHour": 35.00,
    "avgEarningsPerTrip": 17.50,
    "breakdown": {
      "basePay": 12.50,
      "tips": 5.00,
      "incentives": 0
    }
  }
}
```

---

## 🔍 What's Running?

After `docker-compose up -d`, you have:

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Backend API | 3000 | http://localhost:3000 | Main API server |
| PostgreSQL | 5432 | localhost:5432 | Primary database |
| TimescaleDB | 5433 | localhost:5433 | Time-series data |
| Redis | 6379 | localhost:6379 | Cache |
| pgAdmin | 5050 | http://localhost:5050 | Database UI (optional) |

---

## 🛠️ Development Mode

For local development with hot reloading:

```bash
# Install dependencies
npm install
cd backend && npm install && cd ..

# Start infrastructure only
docker-compose up -d postgres timescaledb redis

# Run backend in development mode
npm run dev:backend
```

Now you can edit files in `backend/src/` and the server will auto-restart!

---

## 📊 Check Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f backend

# View last 50 lines
docker-compose logs --tail=50 backend
```

---

## 🗃️ Database Access

### Using psql (Command Line)

```bash
# PostgreSQL
docker exec -it spark-postgres psql -U sparkscheduler -d sparkscheduler_dev

# TimescaleDB
docker exec -it spark-timescaledb psql -U sparkscheduler -d sparkscheduler_timeseries
```

### Using pgAdmin (GUI)

1. Open http://localhost:5050
2. Login: `admin@sparkscheduler.local` / `admin`
3. Add server:
   - Host: `postgres` (or `timescaledb`)
   - Port: `5432`
   - Username: `sparkscheduler`
   - Password: `sparkscheduler_dev_password`

---

## 🧹 Reset Everything

```bash
# Stop and remove all containers + data
docker-compose down -v

# Start fresh
docker-compose up -d
```

---

## ✅ API Endpoints Available

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh token

### Users
- `GET /api/users/me` - Get profile
- `PATCH /api/users/me` - Update profile
- `DELETE /api/users/me` - Delete account

### Zones
- `GET /api/zones` - List zones
- `POST /api/zones` - Create zone
- `GET /api/zones/:id` - Get zone
- `PATCH /api/zones/:id` - Update zone
- `DELETE /api/zones/:id` - Delete zone

### Earnings/Trips
- `GET /api/earnings/trips` - List trips
- `POST /api/earnings/trips` - Log trip
- `GET /api/earnings/trips/:id` - Get trip
- `DELETE /api/earnings/trips/:id` - Delete trip
- `GET /api/earnings/summary` - Get summary

### System
- `GET /health` - Health check
- `GET /` - API info

---

## 📖 Next Steps

1. ✅ API is running!
2. Read the full [Development Guide](DEVELOPMENT.md)
3. Check [API Specification](docs/api/API_SPECIFICATION.md)
4. Review [Implementation Status](README_IMPLEMENTATION.md)
5. Start building the mobile app!

---

## 🐛 Troubleshooting

### Port already in use
```bash
# Find and kill process
lsof -ti:3000 | xargs kill -9
```

### Database connection error
```bash
# Restart services
docker-compose restart postgres timescaledb redis
```

### Clean install
```bash
# Remove everything
docker-compose down -v
rm -rf node_modules backend/node_modules

# Fresh start
npm install
cd backend && npm install && cd ..
docker-compose up -d
```

---

## 💡 Tips

- Use [Postman](https://www.postman.com/) or [Insomnia](https://insomnia.rest/) for easier API testing
- Check `docker-compose logs` if something isn't working
- The API validates all inputs - check error messages for details
- JWT tokens expire after 24 hours - use `/auth/refresh` to get new ones

---

**Happy coding! 🚀**

Need help? Check the [full documentation](docs/) or open an issue on GitHub.
