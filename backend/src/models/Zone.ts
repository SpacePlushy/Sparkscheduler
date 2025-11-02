import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface ZoneAttributes {
  id: string;
  user_id: string;
  zone_name: string;
  zone_type: string;
  store_id?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  is_primary: boolean;
  is_active: boolean;
  radius_miles: number;
  created_at?: Date;
  updated_at?: Date;
}

interface ZoneCreationAttributes extends Optional<ZoneAttributes, 'id' | 'created_at' | 'updated_at'> {}

class Zone extends Model<ZoneAttributes, ZoneCreationAttributes> implements ZoneAttributes {
  declare id: string;
  declare user_id: string;
  declare zone_name: string;
  declare zone_type: string;
  declare store_id?: string;
  declare address?: string;
  declare city?: string;
  declare state?: string;
  declare zip_code?: string;
  declare latitude?: number;
  declare longitude?: number;
  declare is_primary: boolean;
  declare is_active: boolean;
  declare radius_miles: number;
  declare created_at?: Date;
  declare updated_at?: Date;
}

Zone.init(
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
    zone_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    zone_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'walmart_store',
    },
    store_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    state: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    zip_code: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      allowNull: true,
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      allowNull: true,
    },
    is_primary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    radius_miles: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 10.0,
    },
  },
  {
    sequelize,
    tableName: 'user_zones',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        unique: true,
        fields: ['user_id', 'zone_name'],
      },
    ],
  }
);

export default Zone;
