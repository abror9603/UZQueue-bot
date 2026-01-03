module.exports = {
  ...require('./jest.config.js'),
  testMatch: [
    '**/tests/integration/**/*.test.js'
  ],
  testTimeout: 30000, // Longer timeout for integration tests
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/testSetup.js']
};

