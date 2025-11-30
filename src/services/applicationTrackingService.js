// Application Tracking Service
// TODO: Integrate with government services API
// For demo: returns mock tracking data

const { Application } = require('../models');

class ApplicationTrackingService {
  async trackApplication(applicationNumber) {
    try {
      const application = await Application.findOne({
        where: { applicationNumber }
      });

      if (!application) {
        return null;
      }

      // Simulate status progression
      // In production, this would fetch from government API:
      // const response = await fetch(`GOV_API_ENDPOINT/applications/${applicationNumber}`);
      // const data = await response.json();

      const statusInfo = this.getStatusInfo(application.status);

      return {
        applicationNumber: application.applicationNumber,
        organization: application.organization,
        department: application.department,
        serviceType: application.serviceType,
        status: application.status,
        statusInfo: statusInfo,
        nextStep: statusInfo.nextStep,
        estimatedCompletionTime: application.estimatedCompletionTime || this.calculateEstimatedTime(application.createdAt),
        submittedAt: application.createdAt,
        updatedAt: application.updatedAt
      };
    } catch (error) {
      console.error('Error tracking application:', error);
      return null;
    }
  }

  getStatusInfo(status) {
    const statusMap = {
      pending: {
        name: 'Ko\'rib chiqilmoqda',
        nameRu: 'На рассмотрении',
        nameEn: 'Under Review',
        nextStep: 'Hujjatlar tekshirilmoqda',
        nextStepRu: 'Документы проверяются',
        nextStepEn: 'Documents are being reviewed'
      },
      processing: {
        name: 'Qayta ishlanmoqda',
        nameRu: 'В обработке',
        nameEn: 'Processing',
        nextStep: 'Xulosa tayyorlanmoqda',
        nextStepRu: 'Подготавливается заключение',
        nextStepEn: 'Conclusion is being prepared'
      },
      approved: {
        name: 'Tasdiqlandi',
        nameRu: 'Одобрено',
        nameEn: 'Approved',
        nextStep: 'Hujjatlar tayyor',
        nextStepRu: 'Документы готовы',
        nextStepEn: 'Documents ready'
      },
      rejected: {
        name: 'Rad etildi',
        nameRu: 'Отклонено',
        nameEn: 'Rejected',
        nextStep: 'Sababni bilib oling',
        nextStepRu: 'Узнайте причину',
        nextStepEn: 'Find out the reason'
      }
    };

    return statusMap[status] || statusMap.pending;
  }

  calculateEstimatedTime(createdAt) {
    const days = 5; // Default 5 days
    const estimatedDate = new Date(createdAt);
    estimatedDate.setDate(estimatedDate.getDate() + days);
    return estimatedDate;
  }

  async createApplication(userId, applicationData) {
    try {
      const applicationNumber = this.generateApplicationNumber();
      const application = await Application.create({
        userId,
        applicationNumber,
        ...applicationData,
        status: 'pending'
      });
      return application;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  generateApplicationNumber() {
    const prefix = 'UZQ';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }
}

module.exports = new ApplicationTrackingService();

