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
    const parts = [];
    
    if (regionId) {
      const region = await this.getRegionById(regionId);
      if (region) {
        parts.push(this._getName(region, language));
      }
    }
    
    if (districtId) {
      const district = await this.getDistrictById(districtId);
      if (district) {
        parts.push(this._getName(district, language));
      }
    }
    
    if (neighborhoodId) {
      const neighborhood = await this.getNeighborhoodById(neighborhoodId);
      if (neighborhood) {
        parts.push(this._getName(neighborhood, language));
      }
    }
    
    if (parts.length === 0) {
      return language === 'ru' ? 'Худуд не указан' : language === 'en' ? 'Location not specified' : 'Hudud ko\'rsatilmagan';
    }
    
    return parts.join(' → ');
  }

  _getName(entity, language) {
    if (!entity) return '';
    if (language === 'ru') return entity.nameRu || '';
    if (language === 'en') return entity.nameEn || '';
    return entity.nameUz || '';
  }
}

module.exports = new LocationService();

