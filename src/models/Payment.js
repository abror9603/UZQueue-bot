const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Payment = sequelize.define(
  "Payment",
  {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: "user_id",
      references: {
        model: "users",
        key: "id",
      },
    },
    paymentMethod: {
      type: DataTypes.ENUM("telegram_wallet", "payme"),
      allowNull: false,
      field: "payment_method",
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    currency: {
      type: DataTypes.STRING(10),
      defaultValue: "TON",
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "success", "failed", "cancelled"),
      defaultValue: "pending",
      allowNull: false,
    },
    transactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
      field: "transaction_id",
    },
    comment: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    premiumDays: {
      type: DataTypes.INTEGER,
      defaultValue: 30,
      allowNull: false,
      field: "premium_days",
    },
    telegramInvoicePayload: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "telegram_invoice_payload",
    },
    telegramPreCheckoutQueryId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "telegram_pre_checkout_query_id",
    },
    paymeTransactionId: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "payme_transaction_id",
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    tableName: "payments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

module.exports = Payment;

