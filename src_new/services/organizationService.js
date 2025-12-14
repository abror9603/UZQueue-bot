const { Organization } = require('../models');

class OrganizationService {
  async getAllOrganizations(language = 'uz') {
    const orgs = await Organization.findAll({ where: { isActive: true } });
    return orgs.map(org => ({
      id: org.id,
      name: this._getName(org, language),
      code: org.code,
      type: org.type
    }));
  }

  async getOrganizationById(organizationId) {
    return await Organization.findByPk(organizationId);
  }

  _getName(org, language) {
    if (language === 'ru') return org.nameRu;
    if (language === 'en') return org.nameEn;
    return org.nameUz;
  }
}

module.exports = new OrganizationService();

