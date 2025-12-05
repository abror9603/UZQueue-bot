// Organization Service
// Handles organization registration and management

const { Organization, Employee } = require("../models");
const { askAI } = require("./ai/aiHelper");

class OrganizationService {
  /**
   * Register a new organization
   * @param {Object} orgData - Organization data
   * @returns {Promise<Object>} - Created organization with org_id
   */
  async registerOrganization(orgData) {
    try {
      // Generate unique org_id
      const orgId = await this.generateOrgId();

      // Generate join token
      const joinToken = this.generateJoinToken();

      const organization = await Organization.create({
        orgId,
        name: orgData.name,
        type: orgData.type || "private",
        address: orgData.address,
        phone: orgData.phone,
        owner: orgData.owner,
        telegramId: orgData.telegramId,
        joinToken,
        isActive: true,
      });

      return {
        org_id: organization.orgId,
        status: "success",
        join_code: `JOIN-ORG-${organization.orgId}-${joinToken}`,
      };
    } catch (error) {
      console.error("Error registering organization:", error);
      throw error;
    }
  }

  /**
   * Generate unique organization ID
   * @returns {Promise<number>} - Unique org_id
   */
  async generateOrgId() {
    try {
      const lastOrg = await Organization.findOne({
        order: [["org_id", "DESC"]],
      });

      return lastOrg ? lastOrg.orgId + 1 : 1;
    } catch (error) {
      // If no organizations exist, start from 1
      return 1;
    }
  }

  /**
   * Generate join token for employees
   * @returns {string} - Random token
   */
  generateJoinToken() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }

  /**
   * Get organization by ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<Object>} - Organization data
   */
  async getOrganization(orgId) {
    try {
      const org = await Organization.findOne({
        where: { orgId, isActive: true },
      });
      return org;
    } catch (error) {
      console.error("Error getting organization:", error);
      return null;
    }
  }

  /**
   * Get organization by Telegram ID (admin)
   * @param {number} telegramId - Admin Telegram ID
   * @returns {Promise<Object>} - Organization data
   */
  async getOrganizationByAdmin(telegramId) {
    try {
      const org = await Organization.findOne({
        where: { telegramId, isActive: true },
      });
      return org;
    } catch (error) {
      console.error("Error getting organization by admin:", error);
      return null;
    }
  }

  /**
   * Parse join code
   * @param {string} joinCode - Join code (JOIN-ORG-3-92838192)
   * @returns {Object|null} - Parsed code {orgId, token} or null
   */
  parseJoinCode(joinCode) {
    try {
      const match = joinCode.match(/^JOIN-ORG-(\d+)-([A-Z0-9]+)$/);
      if (match) {
        return {
          orgId: parseInt(match[1]),
          token: match[2],
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Verify join code
   * @param {string} joinCode - Join code
   * @returns {Promise<Object|null>} - Organization data if valid, null otherwise
   */
  async verifyJoinCode(joinCode) {
    try {
      const parsed = this.parseJoinCode(joinCode);
      if (!parsed) {
        return null;
      }

      const org = await Organization.findOne({
        where: {
          orgId: parsed.orgId,
          joinToken: parsed.token,
          isActive: true,
        },
      });

      return org;
    } catch (error) {
      console.error("Error verifying join code:", error);
      return null;
    }
  }

  /**
   * Get user's current organization context
   * @param {number} telegramId - User Telegram ID
   * @returns {Promise<number|null>} - Current org_id or null
   */
  async getUserOrgContext(telegramId) {
    try {
      // First check if user is an employee
      const employee = await Employee.findOne({
        where: { telegramId, isActive: true },
        include: [Organization],
      });

      if (employee) {
        return employee.orgId;
      }

      // Check if user is an organization admin
      const org = await this.getOrganizationByAdmin(telegramId);
      if (org) {
        return org.orgId;
      }

      return null;
    } catch (error) {
      console.error("Error getting user org context:", error);
      return null;
    }
  }

  /**
   * Get all organizations (for admin/stats)
   * @returns {Promise<Array>} - List of organizations
   */
  async getAllOrganizations() {
    try {
      return await Organization.findAll({
        where: { isActive: true },
        order: [["org_id", "ASC"]],
      });
    } catch (error) {
      console.error("Error getting all organizations:", error);
      return [];
    }
  }
}

module.exports = new OrganizationService();
