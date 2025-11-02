# Development Guide - Spark Scheduler Pro

**Quick start guide for developers**

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ (LTS)
- **npm** 9+
- **Docker** & **Docker Compose**
- **Python** 3.11+ (for ML service)
- **Git**

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/SpacePlushy/Sparkscheduler.git
cd Sparkscheduler
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install && cd ..

# Install Python dependencies for ML service
cd ml-service && pip install -r requirements.txt && cd ..
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# At minimum, set:
# - JWT_SECRET (generate with: openssl rand -hex 32)
# - ENCRYPTION_KEY (generate with: openssl rand -hex 64)
```

### 4. Start Infrastructure

```bash
# Start PostgreSQL, TimescaleDB, and Redis
docker-compose up -d postgres timescaledb redis

# Wait for databases to be ready (about 10 seconds)
docker-compose ps
```

### 5. Run Database Migrations

```bash
# Run migrations
npm run migrate

# (Optional) Seed with sample data
npm run seed
```

### 6. Start Development Servers

```bash
# Option 1: Start all services
npm run dev

# Option 2: Start services individually
npm run dev:backend  # Backend API on port 3000
npm run dev:ml       # ML service on port 8001
```

---

## Development Workflow

### Project Structure

```
Sparkscheduler/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Database, Redis config
│   │   ├── middleware/     # Auth, validation, etc.
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API route handlers
│   │   ├── services/       # Business logic
│   │   └── utils/          # Helper functions
│   ├── tests/              # Unit & integration tests
│   └── package.json
│
├── ml-service/             # Python + FastAPI ML service
│   ├── models/             # ML models
│   ├── api/                # FastAPI routes
│   └── utils/              # Feature engineering
│
├── mobile/                 # React Native app
│   └── src/
│
├── docs/                   # Technical documentation
├── scripts/                # Utility scripts
└── docker-compose.yml
```

### Running Tests

```bash
# Backend tests
cd backend && npm test

# Backend tests with coverage
cd backend && npm test -- --coverage

# ML service tests
cd ml-service && pytest

# Watch mode for TDD
cd backend && npm run test:watch
```

### Linting & Formatting

```bash
# Lint all code
npm run lint

# Format all code
npm run format
```

---

## API Development

### Creating a New Endpoint

1. **Create Model** (if needed)
   ```typescript
   // backend/src/models/YourModel.ts
   import { DataTypes, Model } from 'sequelize';
   import { sequelize } from '../config/database';

   class YourModel extends Model {
     // Define model
   }

   YourModel.init({ /* schema */ }, { sequelize });
   export default YourModel;
   ```

2. **Create Route Handler**
   ```typescript
   // backend/src/routes/yourRoute.ts
   import express from 'express';
   import { authenticateJWT } from '../middleware/auth';

   const router = express.Router();

   router.get('/', authenticateJWT, async (req, res) => {
     // Handle request
   });

   export default router;
   ```

3. **Register Route**
   ```typescript
   // backend/src/index.ts
   import yourRoutes from './routes/yourRoute';
   app.use('/api/your-endpoint', yourRoutes);
   ```

### Authentication

All protected endpoints require JWT authentication:

```typescript
import { authenticateJWT, AuthRequest } from '../middleware/auth';

router.get('/protected', authenticateJWT, async (req: AuthRequest, res) => {
  const userId = req.user!.id; // Access authenticated user
});
```

### Validation

Use Joi schemas for input validation:

```typescript
import { validate, schemas } from '../middleware/validation';

router.post('/create', validate(schemas.yourSchema), async (req, res) => {
  // req.body is validated and sanitized
});
```

---

## Database Operations

### Accessing Databases

```bash
# PostgreSQL
docker exec -it spark-postgres psql -U sparkscheduler -d sparkscheduler_dev

# TimescaleDB
docker exec -it spark-timescaledb psql -U sparkscheduler -d sparkscheduler_timeseries

# Redis CLI
docker exec -it spark-redis redis-cli -a sparkscheduler_redis_password
```

### Creating Migrations

```bash
cd backend
npx sequelize-cli migration:generate --name your-migration-name
```

### Reset Database

```bash
# Stop containers
docker-compose down

# Remove volumes
docker volume rm sparkscheduler_postgres_data sparkscheduler_timescale_data

# Restart and migrate
docker-compose up -d
npm run migrate
```

---

## API Testing

### Using cURL

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#","firstName":"Test"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Get profile (with token)
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Using Postman

Import the Postman collection (coming soon): `docs/postman/spark-scheduler-pro.json`

---

## Environment Variables

Key environment variables for development:

```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://sparkscheduler:sparkscheduler_dev_password@localhost:5432/sparkscheduler_dev
TIMESCALE_URL=postgresql://sparkscheduler:sparkscheduler_dev_password@localhost:5433/sparkscheduler_timeseries
REDIS_URL=redis://:sparkscheduler_redis_password@localhost:6379

# JWT
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRY=24h

# Logging
LOG_LEVEL=debug
```

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 <PID>
```

### Database Connection Errors

```bash
# Check if containers are running
docker-compose ps

# View logs
docker-compose logs postgres
docker-compose logs timescaledb
docker-compose logs redis

# Restart services
docker-compose restart postgres timescaledb redis
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules backend/node_modules
npm install
cd backend && npm install
```

---

## Code Style

### TypeScript

- Use strict typing
- No `any` types (use `unknown` if necessary)
- Prefer interfaces over types for objects
- Use async/await over promises

### Naming Conventions

- **Files**: camelCase for utilities, PascalCase for models/components
- **Variables**: camelCase
- **Constants**: UPPER_SNAKE_CASE
- **Classes**: PascalCase
- **Database columns**: snake_case

### Commit Messages

Follow conventional commits:

```
feat(api): add trip export endpoint
fix(auth): correct token expiration logic
docs(readme): update installation steps
test(trips): add integration tests for trip creation
```

---

## Useful Commands

```bash
# View all containers
docker-compose ps

# View logs
docker-compose logs -f backend

# Access container shell
docker exec -it spark-backend sh

# Run specific test
cd backend && npm test -- trips.test.ts

# Check TypeScript errors
cd backend && npx tsc --noEmit

# Database backup
docker exec spark-postgres pg_dump -U sparkscheduler sparkscheduler_dev > backup.sql
```

---

## Next Steps

1. ✅ Set up local environment
2. ✅ Run backend API
3. 📝 Create your first endpoint
4. 📝 Write tests for your endpoint
5. 📝 Review documentation in `/docs`
6. 📝 Start building features!

---

## Getting Help

- **Documentation**: See `/docs` folder
- **API Spec**: [docs/api/API_SPECIFICATION.md](docs/api/API_SPECIFICATION.md)
- **Architecture**: [docs/architecture/SYSTEM_ARCHITECTURE.md](docs/architecture/SYSTEM_ARCHITECTURE.md)
- **Issues**: [GitHub Issues](https://github.com/SpacePlushy/Sparkscheduler/issues)

---

**Happy coding! 🚀**
