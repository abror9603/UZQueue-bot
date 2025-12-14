const { Appeal, AppealFile, AppealStatusLog } = require('../models');
const { Op } = require('sequelize');

class AppealService {
  async generateAppealId() {
    const year = new Date().getFullYear();
    const prefix = `UZQ-${year}-`;
    
    const lastAppeal = await Appeal.findOne({
      where: {
        appealId: {
          [Op.like]: `${prefix}%`
        }
      },
      order: [['id', 'DESC']]
    });

    let sequence = 1;
    if (lastAppeal) {
      const lastSequence = parseInt(lastAppeal.appealId.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(6, '0')}`;
  }

  async createAppeal(data) {
    const appealId = await this.generateAppealId();
    
    const appeal = await Appeal.create({
      ...data,
      appealId,
      status: 'pending'
    });

    // Create initial status log
    await AppealStatusLog.create({
      appealId: appeal.id,
      oldStatus: null,
      newStatus: 'pending',
      changedBy: null,
      comment: 'Murojaat yaratildi'
    });

    return appeal;
  }

  async addFile(appealId, fileData) {
    return await AppealFile.create({
      appealId,
      ...fileData
    });
  }

  async getAppealByAppealId(appealId) {
    return await Appeal.findOne({
      where: { appealId },
      include: [
        { association: 'region' },
        { association: 'district' },
        { association: 'neighborhood' },
        { association: 'organization' },
        { association: 'telegramGroup' },
        { association: 'files' },
        { association: 'statusLogs' }
      ]
    });
  }

  async getUserAppeals(userId) {
    return await Appeal.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      include: [
        { association: 'region' },
        { association: 'district' },
        { association: 'organization' }
      ]
    });
  }

  async updateStatus(appealId, newStatus, changedBy, comment = null) {
    const appeal = await Appeal.findByPk(appealId);
    if (!appeal) throw new Error('Appeal not found');

    const oldStatus = appeal.status;
    
    await appeal.update({ status: newStatus });
    
    await AppealStatusLog.create({
      appealId,
      oldStatus,
      newStatus,
      changedBy,
      comment
    });

    return appeal;
  }
}

module.exports = new AppealService();

