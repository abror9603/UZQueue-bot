const User = require('./User');
const Application = require('./Application');
const Queue = require('./Queue');

// Define associations
User.hasMany(Application, { foreignKey: 'userId', sourceKey: 'telegramId' });
Application.belongsTo(User, { foreignKey: 'userId', targetKey: 'telegramId' });

User.hasMany(Queue, { foreignKey: 'userId', sourceKey: 'telegramId' });
Queue.belongsTo(User, { foreignKey: 'userId', targetKey: 'telegramId' });

module.exports = {
  User,
  Application,
  Queue,
  sequelize: require('../config/database')
};

