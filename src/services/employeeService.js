// Employee Service
// Handles employee registration and management

const { Employee, Organization } = require("../models");
const organizationService = require("./organizationService");

class EmployeeService {
  /**
   * Register employee using join code
   * @param {string} joinCode - Join code (JOIN-ORG-3-92838192)
   * @param {number} telegramId - Employee Telegram ID
   * @param {Object} employeeData - Additional employee data
   * @returns {Promise<Object>} - Created employee with employee_id
   */
  async registerEmployee(joinCode, telegramId, employeeData = {}) {
    try {
      // Verify join code
      const org = await organizationService.verifyJoinCode(joinCode);

      if (!org) {
        throw new Error("Noto'g'ri join code");
      }

      // Check if employee already exists
      const existingEmployee = await Employee.findOne({
        where: { telegramId },
      });

      if (existingEmployee) {
        return {
          employee_id: existingEmployee.employeeId,
          org_id: existingEmployee.orgId,
          role: existingEmployee.role,
          status: "already_registered",
        };
      }

      // Generate employee_id
      const employeeId = await this.generateEmployeeId(org.orgId);

      // Determine role (first employee in org becomes admin)
      const employeeCount = await Employee.count({
        where: { orgId: org.orgId },
      });
      const role = employeeCount === 0 ? "admin" : "staff";

      // Create employee
      const employee = await Employee.create({
        employeeId,
        orgId: org.orgId,
        telegramId,
        fullName: employeeData.fullName || null,
        role,
        position: employeeData.position || null,
        phone: employeeData.phone || null,
        isActive: true,
        joinedAt: new Date(),
      });

      return {
        employee_id: employee.employeeId,
        org_id: employee.orgId,
        role: employee.role,
        status: "success",
      };
    } catch (error) {
      console.error("Error registering employee:", error);
      throw error;
    }
  }

  /**
   * Generate unique employee ID for organization
   * @param {number} orgId - Organization ID
   * @returns {Promise<number>} - Unique employee_id
   */
  async generateEmployeeId(orgId) {
    try {
      const lastEmployee = await Employee.findOne({
        where: { orgId },
        order: [["employee_id", "DESC"]],
      });

      return lastEmployee ? lastEmployee.employeeId + 1 : 1;
    } catch (error) {
      return 1;
    }
  }

  /**
   * Get employee by Telegram ID
   * @param {number} telegramId - Employee Telegram ID
   * @returns {Promise<Object>} - Employee data
   */
  async getEmployee(telegramId) {
    try {
      const employee = await Employee.findOne({
        where: { telegramId, isActive: true },
        include: [Organization],
      });
      return employee;
    } catch (error) {
      console.error("Error getting employee:", error);
      return null;
    }
  }

  /**
   * Get employee by employee_id and org_id
   * @param {number} employeeId - Employee ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<Object>} - Employee data
   */
  async getEmployeeById(employeeId, orgId) {
    try {
      const employee = await Employee.findOne({
        where: { employeeId, orgId, isActive: true },
        include: [Organization],
      });
      return employee;
    } catch (error) {
      console.error("Error getting employee by ID:", error);
      return null;
    }
  }

  /**
   * Get all employees for an organization
   * @param {number} orgId - Organization ID
   * @returns {Promise<Array>} - List of employees
   */
  async getOrganizationEmployees(orgId) {
    try {
      return await Employee.findAll({
        where: { orgId, isActive: true },
        order: [["employee_id", "ASC"]],
        include: [Organization],
      });
    } catch (error) {
      console.error("Error getting organization employees:", error);
      return [];
    }
  }

  /**
   * Check if user is employee
   * @param {number} telegramId - User Telegram ID
   * @returns {Promise<boolean>} - True if user is employee
   */
  async isEmployee(telegramId) {
    try {
      const employee = await this.getEmployee(telegramId);
      return employee !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user is admin of organization
   * @param {number} telegramId - User Telegram ID
   * @param {number} orgId - Organization ID
   * @returns {Promise<boolean>} - True if user is admin
   */
  async isAdmin(telegramId, orgId) {
    try {
      const employee = await Employee.findOne({
        where: { telegramId, orgId, role: "admin", isActive: true },
      });
      return employee !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update employee information
   * @param {number} employeeId - Employee ID
   * @param {number} orgId - Organization ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} - Updated employee
   */
  async updateEmployee(employeeId, orgId, updateData) {
    try {
      const employee = await this.getEmployeeById(employeeId, orgId);
      if (!employee) {
        throw new Error("Xodim topilmadi");
      }

      await employee.update(updateData);
      return employee;
    } catch (error) {
      console.error("Error updating employee:", error);
      throw error;
    }
  }
}

module.exports = new EmployeeService();
