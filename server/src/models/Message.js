const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Message = sequelize.define('Message', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  type: {
    type: DataTypes.ENUM('text', 'image'),
    defaultValue: 'text',
  },
  imageUrl: {
    type: DataTypes.STRING(500),
    defaultValue: null,
  },
  senderAnonId: {
    type: DataTypes.STRING(36),
    allowNull: false,
  },
  senderAlias: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  room: {
    type: DataTypes.STRING(50),
    defaultValue: 'global',
  },
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    { fields: ['room'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = Message;
