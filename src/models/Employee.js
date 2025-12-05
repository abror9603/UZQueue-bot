const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Employee = sequelize.define(
  "Employee",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    employeeId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      field: "employee_id",
    },
    orgId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "organizations",
        key: "org_id",
      },
      field: "org_id",
    },
    telegramId: {
      type: DataTypes.BIGINT,
      unique: true,
      allowNull: false,
      field: "telegram_id",
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "full_name",
    },
    role: {
      type: DataTypes.ENUM("admin", "staff"),
      defaultValue: "staff",
      allowNull: false,
    },
    position: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Lavozim",
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "joined_at",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "employees",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Employee;
