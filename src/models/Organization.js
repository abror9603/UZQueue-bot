const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Organization = sequelize.define(
  "Organization",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    orgId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      field: "org_id",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM("government", "private"),
      allowNull: false,
      defaultValue: "private",
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    owner: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Rahbar F.I.Sh",
    },
    telegramId: {
      type: DataTypes.BIGINT,
      allowNull: true,
      comment: "Tashkilot adminining Telegram ID",
      field: "telegram_id",
    },
    joinToken: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "join_token",
      comment: "Xodimlarni qo'shish uchun token",
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: "is_active",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment: "Qo'shimcha ma'lumotlar",
    },
  },
  {
    tableName: "organizations",
    timestamps: true,
    underscored: true,
  }
);

module.exports = Organization;
