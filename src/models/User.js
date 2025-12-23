const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: false, // Telegram user ID
    },
    telegramId: {
      type: DataTypes.BIGINT,
      unique: true,
      allowNull: false,
      field: "telegram_id",
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "last_name",
    },
    language: {
      type: DataTypes.STRING,
      defaultValue: "uz",
      allowNull: false,
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
    isPremium: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_premium",
    },
    premiumExpiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "premium_expires_at",
    },
  },
  {
    tableName: "users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = User;
