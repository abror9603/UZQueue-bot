const User = require("./User");
const Application = require("./Application");
const Queue = require("./Queue");
const Organization = require("./Organization");
const Employee = require("./Employee");
const UserRequest = require("./UserRequest");

// Define associations
User.hasMany(Application, { foreignKey: "userId", sourceKey: "telegramId" });
Application.belongsTo(User, { foreignKey: "userId", targetKey: "telegramId" });

User.hasMany(Queue, { foreignKey: "userId", sourceKey: "telegramId" });
Queue.belongsTo(User, { foreignKey: "userId", targetKey: "telegramId" });

// Organization associations
Organization.hasMany(Employee, { foreignKey: "orgId", sourceKey: "orgId" });
Employee.belongsTo(Organization, { foreignKey: "orgId", targetKey: "orgId" });

Organization.hasMany(Application, { foreignKey: "orgId", sourceKey: "orgId" });
Application.belongsTo(Organization, {
  foreignKey: "orgId",
  targetKey: "orgId",
});

Organization.hasMany(Queue, { foreignKey: "orgId", sourceKey: "orgId" });
Queue.belongsTo(Organization, { foreignKey: "orgId", targetKey: "orgId" });

Organization.hasMany(UserRequest, { foreignKey: "orgId", sourceKey: "orgId" });
UserRequest.belongsTo(Organization, {
  foreignKey: "orgId",
  targetKey: "orgId",
});

User.hasMany(UserRequest, { foreignKey: "userId", sourceKey: "telegramId" });
UserRequest.belongsTo(User, { foreignKey: "userId", targetKey: "telegramId" });

module.exports = {
  User,
  Application,
  Queue,
  Organization,
  Employee,
  UserRequest,
  sequelize: require("../config/database"),
};
