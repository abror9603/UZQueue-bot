const { v4: uuidv4 } = require('uuid');
const db = require('../../src/models');

class TestFactories {
  
  /**
   * Create a test user
   * @param {object} overrides - Override default values
   * @returns {Promise<object>} User instance
   */
  static async createTestUser(overrides = {}) {
    return await db.User.create({
      id: uuidv4(),
      telegramId: Math.floor(Math.random() * 1000000000),
      firstName: 'Test',
      lastName: 'User',
      username: 'testuser',
      language: 'uz',
      isPremium: false,
      points: 0,
      badgeId: 1,
      isBlocked: false,
      lastActiveAt: new Date(),
      ...overrides
    });
  }
  
  /**
   * Create a premium user with active subscription
   * @param {object} overrides - Override default values
   * @returns {Promise<object>} User instance
   */
  static async createPremiumUser(overrides = {}) {
    const user = await this.createTestUser({ 
      isPremium: true,
      ...overrides 
    });
    
    await db.Premium.create({
      userId: user.id,
      isActive: true,
      planType: 'monthly',
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
    });
    
    return user;
  }
  
  /**
   * Create a test organization
   * @param {object} overrides - Override default values
   * @returns {Promise<object>} Organization instance
   */
  static async createTestOrganization(overrides = {}) {
    return await db.Organization.create({
      id: uuidv4(),
      name: 'Test Organization',
      nameUz: 'Test Tashkilot',
      nameRu: 'Тестовая Организация',
      nameEn: 'Test Organization',
      category: 'mahalla',
      region: 'Toshkent',
      district: 'Chilonzor',
      telegramGroupId: null,
      adminTelegramId: null,
      rating: 4.5,
      avgResponseTime: 24, // hours
      ...overrides
    });
  }
  
  /**
   * Create a test application
   * @param {object} user - User instance
   * @param {object} organization - Organization instance
   * @param {object} overrides - Override default values
   * @returns {Promise<object>} Application instance
   */
  static async createTestApplication(user, organization, overrides = {}) {
    return await db.Application.create({
      id: uuidv4(),
      userId: user.id,
      organizationId: organization.id,
      category: 'mahalla',
      region: 'Toshkent',
      district: 'Chilonzor',
      applicantName: 'John Doe',
      applicantPhone: '+998901234567',
      text: 'Test application text',
      status: 'pending',
      priority: user.isPremium ? 'premium' : 'normal',
      createdAt: new Date(),
      ...overrides
    });
  }
  
  /**
   * Create a test payment
   * @param {object} user - User instance
   * @param {object} overrides - Override default values
   * @returns {Promise<object>} Payment instance
   */
  static async createTestPayment(user, overrides = {}) {
    return await db.Payment.create({
      id: uuidv4(),
      userId: user.id,
      amount: 3,
      currency: 'TON',
      planType: 'monthly',
      status: 'pending',
      createdAt: new Date(),
      ...overrides
    });
  }
  
  /**
   * Create a test template
   * @param {object} overrides - Override default values
   * @returns {Promise<object>} Template instance
   */
  static async createTestTemplate(overrides = {}) {
    return await db.Template.create({
      id: uuidv4(),
      category: 'mahalla',
      title: {
        uz: 'Test Shablon',
        ru: 'Тестовый Шаблон',
        en: 'Test Template'
      },
      content: {
        uz: 'Test mazmun',
        ru: 'Тестовое содержание',
        en: 'Test content'
      },
      usageCount: 0,
      isPremium: false,
      ...overrides
    });
  }
  
  /**
   * Create a test rating
   * @param {object} user - User instance
   * @param {object} organization - Organization instance
   * @param {object} application - Application instance
   * @param {object} overrides - Override default values
   * @returns {Promise<object>} Rating instance
   */
  static async createTestRating(user, organization, application, overrides = {}) {
    return await db.Rating.create({
      id: uuidv4(),
      userId: user.id,
      organizationId: organization.id,
      applicationId: application.id,
      rating: 5,
      responseTime: 24, // hours
      comment: 'Great service!',
      ...overrides
    });
  }
  
  /**
   * Clean up all test data
   * @returns {Promise<void>}
   */
  static async cleanup() {
    await db.Rating.destroy({ where: {}, truncate: true, cascade: true });
    await db.Application.destroy({ where: {}, truncate: true, cascade: true });
    await db.Payment.destroy({ where: {}, truncate: true, cascade: true });
    await db.Premium.destroy({ where: {}, truncate: true, cascade: true });
    await db.Template.destroy({ where: {}, truncate: true, cascade: true });
    await db.Organization.destroy({ where: {}, truncate: true, cascade: true });
    await db.User.destroy({ where: {}, truncate: true, cascade: true });
  }
}

module.exports = TestFactories;

