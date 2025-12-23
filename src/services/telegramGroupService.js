const { TelegramGroup } = require('../models');

class TelegramGroupService {
  /**
   * Find the appropriate Telegram group for routing an appeal
   * Based on: region + district + neighborhood + organization
   */
  async findGroupForAppeal(regionId, districtId, neighborhoodId, organizationId) {
    // Build where clause based on available location data
    const whereClause = {
      organizationId,
      isActive: true
    };

    // First, try to find group with active subscription
    // If no location specified, try to find group without location constraints
    if (!regionId && !districtId && !neighborhoodId) {
      // Try with active subscription first
      const noLocationMatchActive = await TelegramGroup.findOne({
        where: {
          ...whereClause,
          subscriptionStatus: 'active',
          regionId: null,
          districtId: null,
          neighborhoodId: null
        }
      });
      if (noLocationMatchActive) return noLocationMatchActive;
      
      // Try any group with this organization (for ministries/committees)
      // This allows finding groups that don't require location
      const anyGroupActive = await TelegramGroup.findOne({
        where: {
          ...whereClause,
          subscriptionStatus: 'active'
        }
      });
      if (anyGroupActive) return anyGroupActive;

      // If no active group found, try inactive groups (for debugging/testing)
      // This will be filtered later in appealHandlers
      const noLocationMatch = await TelegramGroup.findOne({
        where: {
          ...whereClause,
          regionId: null,
          districtId: null,
          neighborhoodId: null
        }
      });
      if (noLocationMatch) return noLocationMatch;
      
      const anyGroup = await TelegramGroup.findOne({
        where: whereClause
      });
      if (anyGroup) return anyGroup;
      
      return null;
    }

    // For location-based search, first try active subscriptions
    const activeWhereClause = {
      ...whereClause,
      subscriptionStatus: 'active'
    };

    // Try to find exact match (region + district + neighborhood + organization)
    if (regionId && districtId && neighborhoodId) {
      // First try with active subscription
      const exactMatchActive = await TelegramGroup.findOne({
        where: {
          ...activeWhereClause,
          regionId,
          districtId,
          neighborhoodId
        }
      });
      if (exactMatchActive) return exactMatchActive;

      // Then try without subscription filter (will be checked later)
      const exactMatch = await TelegramGroup.findOne({
        where: {
          ...whereClause,
          regionId,
          districtId,
          neighborhoodId
        }
      });
      if (exactMatch) return exactMatch;
    }

    // Try district-level match (region + district + organization)
    if (regionId && districtId) {
      // First try with active subscription
      const districtMatchActive = await TelegramGroup.findOne({
        where: {
          ...activeWhereClause,
          regionId,
          districtId,
          neighborhoodId: null
        }
      });
      if (districtMatchActive) return districtMatchActive;

      // Then try without subscription filter
      const districtMatch = await TelegramGroup.findOne({
        where: {
          ...whereClause,
          regionId,
          districtId,
          neighborhoodId: null
        }
      });
      if (districtMatch) return districtMatch;
    }

    // Try region-level match (region + organization)
    if (regionId) {
      // First try with active subscription
      const regionMatchActive = await TelegramGroup.findOne({
        where: {
          ...activeWhereClause,
          regionId,
          districtId: null,
          neighborhoodId: null
        }
      });
      if (regionMatchActive) return regionMatchActive;

      // Then try without subscription filter
      const regionMatch = await TelegramGroup.findOne({
        where: {
          ...whereClause,
          regionId,
          districtId: null,
          neighborhoodId: null
        }
      });
      if (regionMatch) return regionMatch;
    }

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

