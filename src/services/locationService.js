const { Region, District, Neighborhood } = require('../models');

class LocationService {
  async getAllRegions(language = 'uz') {
    const regions = await Region.findAll({ where: { isActive: true } });
    return regions.map(r => ({
      id: r.id,
      name: this._getName(r, language),
      code: r.code
    }));
  }

  async getDistrictsByRegion(regionId, language = 'uz') {
    const districts = await District.findAll({
      where: { regionId, isActive: true }
    });
    return districts.map(d => ({
      id: d.id,
      name: this._getName(d, language),
      code: d.code,
      regionId: d.regionId
    }));
  }

  async getNeighborhoodsByDistrict(districtId, language = 'uz') {
    const neighborhoods = await Neighborhood.findAll({
      where: { districtId, isActive: true }
    });
    return neighborhoods.map(n => ({
      id: n.id,
      name: this._getName(n, language),
      code: n.code,
      districtId: n.districtId
    }));
  }

  async getRegionById(regionId) {
    return await Region.findByPk(regionId);
  }

  async getDistrictById(districtId) {
    return await District.findByPk(districtId);
  }

  async getNeighborhoodById(neighborhoodId) {
    return await Neighborhood.findByPk(neighborhoodId);
  }

  async getLocationString(regionId, districtId, neighborhoodId, language = 'uz') {
    const region = await this.getRegionById(regionId);
    const district = await this.getDistrictById(districtId);
    
    let location = `${this._getName(region, language)} → ${this._getName(district, language)}`;
    
    if (neighborhoodId) {
      const neighborhood = await this.getNeighborhoodById(neighborhoodId);
      location += ` → ${this._getName(neighborhood, language)}`;
    }
    
    return location;
  }

  _getName(entity, language) {
    if (language === 'ru') return entity.nameRu;
    if (language === 'en') return entity.nameEn;
    return entity.nameUz;
  }
}

module.exports = new LocationService();

