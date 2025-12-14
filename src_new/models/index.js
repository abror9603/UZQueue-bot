const User = require('./User');
const Region = require('./Region');
const District = require('./District');
const Neighborhood = require('./Neighborhood');
const Organization = require('./Organization');
const TelegramGroup = require('./TelegramGroup');
const Appeal = require('./Appeal');
const AppealFile = require('./AppealFile');
const AppealStatusLog = require('./AppealStatusLog');
const AiLog = require('./AiLog');

// Region relationships
Region.hasMany(District, { foreignKey: 'regionId', as: 'districts' });
District.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });

// District relationships
District.hasMany(Neighborhood, { foreignKey: 'districtId', as: 'neighborhoods' });
Neighborhood.belongsTo(District, { foreignKey: 'districtId', as: 'district' });

// TelegramGroup relationships
TelegramGroup.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
TelegramGroup.belongsTo(District, { foreignKey: 'districtId', as: 'district' });
TelegramGroup.belongsTo(Neighborhood, { foreignKey: 'neighborhoodId', as: 'neighborhood' });
TelegramGroup.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });

// Appeal relationships
Appeal.belongsTo(User, { foreignKey: 'userId', targetKey: 'telegramId', as: 'user' });
Appeal.belongsTo(Region, { foreignKey: 'regionId', as: 'region' });
Appeal.belongsTo(District, { foreignKey: 'districtId', as: 'district' });
Appeal.belongsTo(Neighborhood, { foreignKey: 'neighborhoodId', as: 'neighborhood' });
Appeal.belongsTo(Organization, { foreignKey: 'organizationId', as: 'organization' });
Appeal.belongsTo(TelegramGroup, { foreignKey: 'telegramGroupId', as: 'telegramGroup' });
Appeal.hasMany(AppealFile, { foreignKey: 'appealId', as: 'files' });
Appeal.hasMany(AppealStatusLog, { foreignKey: 'appealId', as: 'statusLogs' });

AppealFile.belongsTo(Appeal, { foreignKey: 'appealId', as: 'appeal' });
AppealStatusLog.belongsTo(Appeal, { foreignKey: 'appealId', as: 'appeal' });
AiLog.belongsTo(Appeal, { foreignKey: 'appealId', as: 'appeal' });

module.exports = {
  User,
  Region,
  District,
  Neighborhood,
  Organization,
  TelegramGroup,
  Appeal,
  AppealFile,
  AppealStatusLog,
  AiLog
};

