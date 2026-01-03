const db = require('../../../src/models');
const applicationController = require('../../../src/controllers/applicationController');
const TestFactories = require('../../helpers/factories');

describe('Application Flow Integration', () => {
  
  let testUser;
  let testOrganization;
  
  beforeAll(async () => {
    await db.sequelize.sync({ force: false });
  });
  
  beforeEach(async () => {
    testUser = await TestFactories.createTestUser();
    testOrganization = await TestFactories.createTestOrganization();
  });
  
  afterEach(async () => {
    await TestFactories.cleanup();
  });
  
  afterAll(async () => {
    await db.sequelize.close();
  });
  
  describe('Application Creation', () => {
    it('should create application successfully', async () => {
      // Arrange
      const applicationData = {
        organizationId: testOrganization.id,
        category: 'mahalla',
        region: 'Toshkent',
        district: 'Chilonzor',
        applicantName: 'John Doe',
        applicantPhone: '+998901234567',
        text: 'Test application text'
      };
      
      // Act
      const application = await applicationController.createApplication(
        applicationData,
        testUser.id,
        testUser.isPremium
      );
      
      // Assert
      expect(application).toBeTruthy();
      expect(application.userId).toBe(testUser.id);
      expect(application.organizationId).toBe(testOrganization.id);
      expect(application.status).toBe('pending');
      expect(application.priority).toBe('normal');
    });
    
    it('should set premium priority for premium users', async () => {
      // Arrange
      const premiumUser = await TestFactories.createPremiumUser();
      const applicationData = {
        organizationId: testOrganization.id,
        text: 'Test'
      };
      
      // Act
      const application = await applicationController.createApplication(
        applicationData,
        premiumUser.id,
        premiumUser.isPremium
      );
      
      // Assert
      expect(application.priority).toBe('premium');
    });
  });
  
  describe('Application Status Updates', () => {
    it('should update application status', async () => {
      // Arrange
      const application = await TestFactories.createTestApplication(
        testUser,
        testOrganization
      );
      
      // Act
      const updated = await applicationController.updateApplicationStatus(
        application.id,
        'completed',
        'admin-123',
        'Response text'
      );
      
      // Assert
      expect(updated.status).toBe('completed');
      expect(updated.response).toBe('Response text');
      expect(updated.responseDate).toBeTruthy();
    });
  });
  
  describe('Get User Applications', () => {
    it('should retrieve user applications', async () => {
      // Arrange
      await TestFactories.createTestApplication(testUser, testOrganization);
      await TestFactories.createTestApplication(testUser, testOrganization);
      
      // Act
      const applications = await applicationController.getUserApplications(
        testUser.id
      );
      
      // Assert
      expect(applications.length).toBeGreaterThanOrEqual(2);
      applications.forEach(app => {
        expect(app.userId).toBe(testUser.id);
      });
    });
    
    it('should filter by status', async () => {
      // Arrange
      await TestFactories.createTestApplication(testUser, testOrganization, {
        status: 'pending'
      });
      await TestFactories.createTestApplication(testUser, testOrganization, {
        status: 'completed'
      });
      
      // Act
      const pendingApps = await applicationController.getUserApplications(
        testUser.id,
        'pending'
      );
      
      // Assert
      expect(pendingApps.length).toBeGreaterThanOrEqual(1);
      pendingApps.forEach(app => {
        expect(app.status).toBe('pending');
      });
    });
  });
});

