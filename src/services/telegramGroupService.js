const { TelegramGroup } = require('../models');

class TelegramGroupService {
  /**
   * Find the appropriate Telegram group for routing an appeal
   * Based on: region + district + neighborhood + organization
   */
  async findGroupForAppeal(regionId, districtId, neighborhoodId, organizationId) {
    // Try to find exact match (region + district + neighborhood + organization)
    if (neighborhoodId) {
      const exactMatch = await TelegramGroup.findOne({
        where: {
          regionId,
          districtId,
          neighborhoodId,
          organizationId,
          isActive: true,
          subscriptionStatus: 'active' // Only active subscriptions
        }
      });
      if (exactMatch) return exactMatch;
    }

    // Try district-level match (region + district + organization)
    const districtMatch = await TelegramGroup.findOne({
      where: {
        regionId,
        districtId,
        neighborhoodId: null,
        organizationId,
        isActive: true,
        subscriptionStatus: 'active'
      }
    });
    if (districtMatch) return districtMatch;

    // Try region-level match (region + organization)
    const regionMatch = await TelegramGroup.findOne({
      where: {
        regionId,
        districtId: null,
        neighborhoodId: null,
        organizationId,
        isActive: true,
        subscriptionStatus: 'active'
      }
    });
    if (regionMatch) return regionMatch;

    // If no match found, return null
    return null;
  }

  async getGroupByChatId(chatId) {
    return await TelegramGroup.findOne({ where: { chatId, isActive: true } });
  }

  async isAdmin(chatId, userId) {
    try {
      // Convert chatId to string for comparison
      const chatIdStr = chatId.toString();
      const group = await TelegramGroup.findOne({ 
        where: { 
          chatId: chatIdStr, 
          isActive: true 
        } 
      });
      
      if (!group || !group.adminIds || !Array.isArray(group.adminIds)) {
        return false;
      }
      
      return group.adminIds.includes(parseInt(userId)) || group.adminIds.includes(userId);
    } catch (error) {
      console.error('isAdmin error:', error);
      return false;
    }
  }

  async createGroup(data) {
    return await TelegramGroup.create(data);
  }
}

module.exports = new TelegramGroupService();

