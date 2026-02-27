const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Comment = sequelize.define('Comment', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  authorAnonId: {
    type: DataTypes.STRING(36),
    allowNull: false,
  },
  authorAlias: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  blogPostId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'comments',
  timestamps: true,
  indexes: [
    { fields: ['blogPostId'] },
    { fields: ['createdAt'] },
  ],
});

module.exports = Comment;
