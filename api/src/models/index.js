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
  email: { type: DataTypes.STRING, unique: true }
});

const Device = sequelize.define('Device', {
  ip: { type: DataTypes.STRING },
  mac: { type: DataTypes.STRING, unique: true },
  hostname: { type: DataTypes.STRING },
  vendor: { type: DataTypes.STRING },
  lastSeen: { type: DataTypes.DATE },
  status: { type: DataTypes.STRING }
});

const ScanHistory = sequelize.define('ScanHistory', {
  target: { type: DataTypes.STRING },
  deviceCount: { type: DataTypes.INTEGER },
  rawResults: { type: DataTypes.JSONB }
});

const Alert = sequelize.define('Alert', {
  severity: { type: DataTypes.STRING }, // Critical, High, Medium, Low
  message: { type: DataTypes.TEXT },
  status: { type: DataTypes.STRING, defaultValue: 'Active' }, // Active, Dismissed
  deviceId: { type: DataTypes.INTEGER }
});

// Relationships
Device.hasMany(Alert);
Alert.belongsTo(Device);

const initDb = async () => {
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
  } catch (error) {
    console.error('Unable to connect to the database:', error);
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
