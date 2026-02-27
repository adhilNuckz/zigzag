const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const BlogPost = sequelize.define('BlogPost', {
  title: {
    type: DataTypes.STRING(300),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT('long'), // ~50KB markdown
    allowNull: false,
  },
  excerpt: {
    type: DataTypes.STRING(500),
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
  // Stored as JSON array: ["privacy", "crypto"]
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  upvotes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // JSON array of anonIds who upvoted
  upvotedBy: {
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
  tableName: 'blog_posts',
  timestamps: true,
  indexes: [
    { fields: ['createdAt'] },
    { fields: ['upvotes'] },
    { fields: ['hidden'] },
    { type: 'FULLTEXT', fields: ['title', 'content'] },
  ],
});

module.exports = BlogPost;
