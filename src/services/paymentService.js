const Payment = require("../models/Payment");
const premiumService = require("./premiumService");
const crypto = require("crypto");

class PaymentService {
  /**
   * Create payment record
   */
  async createPayment(userId, paymentMethod, amount, premiumDays = 30) {
    // Generate unique comment for transaction tracking
    const comment = `premium_${userId}_${premiumDays}d_${Date.now()}`;

    const payment = await Payment.create({
      userId,
      paymentMethod,
      amount,
      currency: paymentMethod === "telegram_wallet" ? "TON" : "UZS",
      status: "pending",
      comment,
      premiumDays,
      metadata: {
        createdAt: new Date().toISOString(),
      },
    });

    return payment;
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(paymentId, status, transactionId = null) {
    const updateData = { status };
    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    await Payment.update(updateData, {
      where: { id: paymentId },
    });

    return true;
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(paymentId) {
    return await Payment.findByPk(paymentId);
  }

  /**
   * Get payment by transaction ID
   */
  async getPaymentByTransactionId(transactionId) {
    return await Payment.findOne({
      where: { transactionId },
    });
  }

  /**
   * Get payment by Telegram invoice payload
   */
  async getPaymentByInvoicePayload(payload) {
    return await Payment.findOne({
      where: { telegramInvoicePayload: payload },
    });
  }

  /**
   * Process successful payment
   */
  async processSuccessfulPayment(paymentId, transactionId = null) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    if (payment.status === "success") {
      // Already processed
      return payment;
    }

    // Update payment status
    await this.updatePaymentStatus(paymentId, "success", transactionId);

    // Activate premium
    await premiumService.activatePremium(
      payment.userId,
      payment.premiumDays,
      paymentId
    );

    return payment;
  }

  /**
   * Process failed payment
   */
  async processFailedPayment(paymentId, reason = null) {
    const payment = await Payment.findByPk(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }

    await Payment.update(
      {
        status: "failed",
        metadata: {
          ...payment.metadata,
          failureReason: reason,
          failedAt: new Date().toISOString(),
        },
      },
      {
        where: { id: paymentId },
      }
    );

    return payment;
  }

  /**
   * Generate Telegram invoice payload
   */
  generateInvoicePayload(paymentId) {
    // Generate unique payload for Telegram invoice
    return `premium_${paymentId}_${crypto.randomBytes(16).toString("hex")}`;
  }

  /**
   * Get user payment history
   */
  async getUserPayments(userId, limit = 10) {
    return await Payment.findAll({
      where: { userId },
      order: [["created_at", "DESC"]],
      limit,
    });
  }
}

module.exports = new PaymentService();

