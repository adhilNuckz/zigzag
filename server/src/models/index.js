const { sequelize } = require('../config/db');
const User = require('./User');
const Message = require('./Message');
const Resource = require('./Resource');
const BlogPost = require('./BlogPost');
const Comment = require('./Comment');
const Idea = require('./Idea');

// === Associations ===
BlogPost.hasMany(Comment, { foreignKey: 'blogPostId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(BlogPost, { foreignKey: 'blogPostId' });

/**
 * Sync all models with the database.
 * alter: true will adjust columns without dropping data.
 */
const syncDB = async () => {
  await sequelize.sync({ alter: true });
};

module.exports = {
  sequelize,
  syncDB,
  User,
  Message,
  Resource,
  BlogPost,
  Comment,
  Idea,
};
