const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'motomoto',
  process.env.DB_USER || 'moto_user',
  process.env.DB_PASSWORD || 'moto_password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: false, // Set to console.log if you want to see SQL queries
  }
);

const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.STRING, defaultValue: 'Viewer' },
  fullName: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true },
  resetPasswordToken: { type: DataTypes.STRING },
  resetPasswordExpires: { type: DataTypes.DATE }
});

const Device = sequelize.define('Device', {
  ip: { type: DataTypes.STRING },
  mac: { type: DataTypes.STRING },
  hostname: { type: DataTypes.STRING },
  vendor: { type: DataTypes.STRING },
  lastSeen: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING },
  userId: { type: DataTypes.INTEGER, allowNull: false } // Mandatory
}, {
  indexes: [
    { fields: ['userId'] },
    { fields: ['ip'] },
    { fields: ['mac'] }
  ]
});

const ScanHistory = sequelize.define('ScanHistory', {
  target: { type: DataTypes.STRING },
  deviceCount: { type: DataTypes.INTEGER },
  rawResults: { type: DataTypes.JSONB },
  userId: { type: DataTypes.INTEGER, allowNull: false } // Mandatory
}, {
  indexes: [
    { fields: ['userId'] }
  ]
});

const Alert = sequelize.define('Alert', {
  severity: { type: DataTypes.STRING }, // Critical, High, Medium, Low
  message: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'Active' }, // Active, Dismissed
  deviceId: { type: DataTypes.INTEGER },
  userId: { type: DataTypes.INTEGER, allowNull: false } // Mandatory
}, {
  indexes: [
    { fields: ['userId'] }
  ]
});

// Relationships
User.hasMany(Device, { foreignKey: 'userId' });
Device.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(ScanHistory, { foreignKey: 'userId' });
ScanHistory.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Alert, { foreignKey: 'userId' });
Alert.belongsTo(User, { foreignKey: 'userId' });

Device.hasMany(Alert);
Alert.belongsTo(Device);

const initDb = async (retries = 5) => {
  while (retries) {
    try {
      await sequelize.authenticate();
      console.log('Database connection established successfully.');
      
      // Sync models (creates tables if they don't exist)
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized.');

      // Create default admin if no users exist
      const adminCount = await User.count({ where: { username: 'admin' } });
      if (adminCount === 0) {
        const bcrypt = require('bcryptjs');
        await User.create({
          username: 'admin',
          passwordHash: bcrypt.hashSync('password', 10),
          role: 'Admin',
          fullName: 'System Administrator',
          email: 'admin@moto-moto.local'
        });
        console.log('Default admin user created.');
      }
      
      break; // Success, exit retry loop
    } catch (error) {
      console.error(`Unable to connect to the database. Retries left: ${retries - 1}`, error.message);
      retries -= 1;
      // Wait for 5 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
      if (retries === 0) {
        console.error('Failed to connect to the database after all retries.');
      }
    }
  }
};

module.exports = {
  sequelize,
  User,
  Device,
  ScanHistory,
  Alert,
  initDb
};
