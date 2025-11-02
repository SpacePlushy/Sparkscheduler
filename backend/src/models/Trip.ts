import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface TripAttributes {
  id: string;
  user_id: string;
  zone_id?: string;
  trip_date: Date;
  start_time: Date;
  end_time?: Date;
  duration_minutes?: number;
  trip_type: 'delivery' | 'shop_and_deliver' | 'express' | 'dotcom';
  order_count: number;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  dropoff_address?: string;
  dropoff_latitude?: number;
  dropoff_longitude?: number;
  distance_miles?: number;
  base_pay: number;
  tip_amount: number;
  incentive_amount: number;
  total_earnings: number;
  weather_condition?: string;
  temperature_f?: number;
  data_source: 'manual' | 'csv_import' | 'api';
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface TripCreationAttributes extends Optional<TripAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Trip extends Model<TripAttributes, TripCreationAttributes> implements TripAttributes {
  declare id: string;
  declare user_id: string;
  declare zone_id?: string;
  declare trip_date: Date;
  declare start_time: Date;
  declare end_time?: Date;
  declare duration_minutes?: number;
  declare trip_type: 'delivery' | 'shop_and_deliver' | 'express' | 'dotcom';
  declare order_count: number;
  declare pickup_address?: string;
  declare pickup_latitude?: number;
  declare pickup_longitude?: number;
  declare dropoff_address?: string;
  declare dropoff_latitude?: number;
  declare dropoff_longitude?: number;
  declare distance_miles?: number;
  declare base_pay: number;
  declare tip_amount: number;
  declare incentive_amount: number;
  declare total_earnings: number;
  declare weather_condition?: string;
  declare temperature_f?: number;
  declare data_source: 'manual' | 'csv_import' | 'api';
  declare notes?: string;
  declare created_at?: Date;
  declare updated_at?: Date;
}

Trip.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    zone_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'user_zones',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    trip_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    start_time: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    duration_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    trip_type: {
      type: DataTypes.ENUM('delivery', 'shop_and_deliver', 'express', 'dotcom'),
      defaultValue: 'delivery',
    },
    order_count: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    pickup_address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    pickup_latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    pickup_longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    dropoff_address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    dropoff_latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    dropoff_longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    distance_miles: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true,
    },
    base_pay: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    tip_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    incentive_amount: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    total_earnings: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    weather_condition: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    temperature_f: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    data_source: {
      type: DataTypes.ENUM('manual', 'csv_import', 'api'),
      defaultValue: 'manual',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'trips',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['zone_id'],
      },
      {
        fields: ['trip_date'],
      },
      {
        fields: ['start_time'],
      },
      {
        fields: ['user_id', 'trip_date'],
      },
    ],
    hooks: {
      beforeSave: (trip) => {
        // Auto-calculate total earnings
        trip.total_earnings = Number(trip.base_pay) + Number(trip.tip_amount) + Number(trip.incentive_amount);

        // Auto-calculate duration if end_time is provided
        if (trip.end_time && trip.start_time) {
          const duration = (trip.end_time.getTime() - trip.start_time.getTime()) / (1000 * 60);
          trip.duration_minutes = Math.round(duration);
        }
      },
    },
  }
);

export default Trip;
