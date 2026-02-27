const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Resource = sequelize.define('Resource', {
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  url: {
    type: DataTypes.STRING(2000),
    defaultValue: null,
  },
  fileUrl: {
    type: DataTypes.STRING(500),
    defaultValue: null,
  },
  fileName: {
    type: DataTypes.STRING(255),
    defaultValue: null,
  },
  fileSize: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Stored as JSON array: ["privacy", "tools"]
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  authorAnonId: {
    type: DataTypes.STRING(36),
    allowNull: false,
  },
  authorAlias: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  reports: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Stored as JSON array of anonIds
  reportedBy: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  hidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'resources',
  timestamps: true,
  indexes: [
    { fields: ['createdAt'] },
    { fields: ['views'] },
    { fields: ['hidden'] },
    { type: 'FULLTEXT', fields: ['title', 'description'] },
  ],
});

module.exports = Resource;
