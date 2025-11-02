// Model associations and exports

import User from './User';
import Zone from './Zone';
import Trip from './Trip';

// Define associations
User.hasMany(Zone, { foreignKey: 'user_id', as: 'zones' });
Zone.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Trip, { foreignKey: 'user_id', as: 'trips' });
Trip.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Zone.hasMany(Trip, { foreignKey: 'zone_id', as: 'trips' });
Trip.belongsTo(Zone, { foreignKey: 'zone_id', as: 'zone' });

export { User, Zone, Trip };
