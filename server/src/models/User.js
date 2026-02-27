const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  anonId: {
    type: DataTypes.STRING(36),
    allowNull: false,
    unique: true,
  },
  alias: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  tokenHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
  },
  recoveryPhrase: {
    type: DataTypes.STRING(500),
    defaultValue: null,
  },
  active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  lastSeen: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    { fields: ['anonId'] },
    { fields: ['tokenHash'] },
    { fields: ['lastSeen'] },
    { fields: ['active'] },
  ],
});

module.exports = User;
