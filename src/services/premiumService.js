const User = require("../models/User");
const Payment = require("../models/Payment");

class PremiumService {
  /**
   * Check if user has active premium subscription
   */
  async isPremium(userId) {
    const user = await User.findByPk(userId);
    if (!user || !user.isPremium) {
      return false;
    }

    // Check if premium has expired
    if (user.premiumExpiresAt && new Date() > new Date(user.premiumExpiresAt)) {
      // Premium expired, update user
      await user.update({
        isPremium: false,
        premiumExpiresAt: null,
      });
      return false;
    }

    return true;
  }

  /**
   * Get premium expiration date
   */
  async getPremiumExpiresAt(userId) {
    const user = await User.findByPk(userId);
    if (!user) return null;
    return user.premiumExpiresAt;
  }

  /**
   * Activate premium for user
   * @param {Number} userId - User ID
   * @param {Number} days - Number of days to add (default: 30)
   * @param {Number} paymentId - Payment ID that activated premium
   */
  async activatePremium(userId, days = 30, paymentId = null) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const now = new Date();
    let expiresAt = new Date(now);

    // If user already has premium, extend from expiration date
    if (user.isPremium && user.premiumExpiresAt && new Date(user.premiumExpiresAt) > now) {
      expiresAt = new Date(user.premiumExpiresAt);
    }

    // Add days
    expiresAt.setDate(expiresAt.getDate() + days);

    await user.update({
      isPremium: true,
      premiumExpiresAt: expiresAt,
    });

    // Update payment status if paymentId provided
    if (paymentId) {
      await Payment.update(
        { status: "success" },
        { where: { id: paymentId } }
      );
    }

    return {
      isPremium: true,
      expiresAt: expiresAt,
    };
  }

  /**
   * Deactivate premium (for testing or admin actions)
   */
  async deactivatePremium(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    await user.update({
      isPremium: false,
      premiumExpiresAt: null,
    });

    return true;
  }

  /**
   * Get premium status info
   */
  async getPremiumInfo(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
      return {
        isPremium: false,
        expiresAt: null,
        daysLeft: 0,
      };
    }

    const isPremium = await this.isPremium(userId);
    const expiresAt = user.premiumExpiresAt;

    let daysLeft = 0;
    if (isPremium && expiresAt) {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diffTime = expiry - now;
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    return {
      isPremium,
      expiresAt,
      daysLeft: Math.max(0, daysLeft),
    };
  }

  /**
   * Check and update expired premium subscriptions (cron job)
   */
  async checkExpiredPremiums() {
    const now = new Date();
    const expiredUsers = await User.findAll({
      where: {
        isPremium: true,
        premiumExpiresAt: {
          [require("sequelize").Op.lt]: now,
        },
      },
    });

    for (const user of expiredUsers) {
      await user.update({
        isPremium: false,
        premiumExpiresAt: null,
      });
    }

    return expiredUsers.length;
  }
}

module.exports = new PremiumService();

