const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserRequest = sequelize.define(
  "UserRequest",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      references: {
        model: "users",
        key: "telegramId",
      },
      field: "user_id",
    },
    orgId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "organizations",
        key: "org_id",
      },
      field: "org_id",
    },
    requestNumber: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
      field: "request_number",
    },
    // User Information
    fullName: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "full_name",
    },
    region: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    district: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Request Details
    requestText: {
      type: DataTypes.TEXT,
      allowNull: false,
      field: "request_text",
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Routing Information
    responsibleOrganization: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "responsible_organization",
    },
    alternativeOrganizations: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: "alternative_organizations",
    },
    confidenceScore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "confidence_score",
    },
    // Status
    status: {
      type: DataTypes.ENUM(
        "collecting_info",
        "analyzing",
        "ready",
        "sent",
        "processing",
        "completed",
        "rejected"
      ),
      defaultValue: "collecting_info",
      allowNull: false,
    },
    // Metadata
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "user_requests",
    timestamps: true,
    underscored: true,
  }
);

module.exports = UserRequest;

