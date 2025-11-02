-- Initialize Spark Scheduler Pro database
-- This script runs on first docker-compose up

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS public;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE sparkscheduler_dev TO sparkscheduler;
GRANT ALL PRIVILEGES ON SCHEMA public TO sparkscheduler;

-- Create initial tables will be handled by Sequelize migrations
-- This file is mainly for extensions and schema setup

SELECT 'Database initialized successfully' AS status;
