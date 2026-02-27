const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Idea = sequelize.define('Idea', {
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  category: {
    type: DataTypes.ENUM('security', 'privacy', 'tools', 'network', 'crypto', 'social', 'other'),
    defaultValue: 'other',
  },
  howIBuiltThis: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  authorAnonId: {
    type: DataTypes.STRING(36),
    allowNull: false,
  },
  authorAlias: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  upvotedBy: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  savedBy: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  reports: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  reportedBy: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  hidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'ideas',
  timestamps: true,
  indexes: [
    { fields: ['createdAt'] },
    { fields: ['upvotes'] },
    { fields: ['category'] },
    { fields: ['hidden'] },
    { type: 'FULLTEXT', fields: ['title', 'description'] },
  ],
});

module.exports = Idea;
