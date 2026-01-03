const db = require('../../src/models');
const { sequelize } = db;

// Setup before all tests
beforeAll(async () => {
  // Use test database
  if (process.env.NODE_ENV !== 'test') {
    process.env.NODE_ENV = 'test';
  }
  
  // Sync database (use force: false in production)
  await sequelize.sync({ force: false });
});

// Cleanup after all tests
afterAll(async () => {
  await sequelize.close();
});

// Cleanup after each test
afterEach(async () => {
  // Clean up test data if needed
  // await db.Application.destroy({ where: {}, truncate: true });
  // await db.User.destroy({ where: {}, truncate: true });
});

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

