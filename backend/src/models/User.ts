import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import bcrypt from 'bcrypt';

interface UserAttributes {
  id: string;
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  account_status: 'active' | 'suspended' | 'deleted';
  email_verified: boolean;
  phone_verified: boolean;
  primary_city?: string;
  primary_state?: string;
  timezone: string;
  spark_driver_id?: string;
  subscription_tier: 'free' | 'pro';
  created_at?: Date;
  updated_at?: Date;
  last_login_at?: Date;
  google_id?: string;
  apple_id?: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'created_at' | 'updated_at'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  declare id: string;
  declare email: string;
  declare password_hash: string;
  declare first_name?: string;
  declare last_name?: string;
  declare phone_number?: string;
  declare account_status: 'active' | 'suspended' | 'deleted';
  declare email_verified: boolean;
  declare phone_verified: boolean;
  declare primary_city?: string;
  declare primary_state?: string;
  declare timezone: string;
  declare spark_driver_id?: string;
  declare subscription_tier: 'free' | 'pro';
  declare created_at?: Date;
  declare updated_at?: Date;
  declare last_login_at?: Date;
  declare google_id?: string;
  declare apple_id?: string;

  // Instance methods
  async comparePassword(candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password_hash);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password_hash;
    return values;
  }

  // Static methods
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  static async findByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email: email.toLowerCase() } });
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      set(value: string) {
        this.setDataValue('email', value.toLowerCase());
      },
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone_number: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    account_status: {
      type: DataTypes.ENUM('active', 'suspended', 'deleted'),
      defaultValue: 'active',
      allowNull: false,
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    phone_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    primary_city: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    primary_state: {
      type: DataTypes.STRING(2),
      allowNull: true,
    },
    timezone: {
      type: DataTypes.STRING(50),
      defaultValue: 'America/Phoenix',
    },
    spark_driver_id: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    subscription_tier: {
      type: DataTypes.ENUM('free', 'pro'),
      defaultValue: 'free',
      allowNull: false,
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    google_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    apple_id: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'users',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        fields: ['account_status'],
      },
      {
        fields: ['subscription_tier'],
      },
    ],
  }
);

export default User;
