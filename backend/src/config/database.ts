import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Primary PostgreSQL database
export const sequelize = new Sequelize(
  process.env.DATABASE_URL || '',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);

// TimescaleDB for time-series data
export const timescaleDB = new Sequelize(
  process.env.TIMESCALE_URL || '',
  {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: false,
      underscored: true,
    },
  }
);

export async function connectDatabases() {
  try {
    await sequelize.authenticate();
    console.log('✅ PostgreSQL connection established successfully');

    await timescaleDB.authenticate();
    console.log('✅ TimescaleDB connection established successfully');

    // Sync models in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('✅ Database models synchronized');
    }
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}

export async function closeDatabases() {
  await sequelize.close();
  await timescaleDB.close();
  console.log('Database connections closed');
}
