module.exports = {
  ...require('./jest.config.js'),
  testMatch: [
    '**/tests/e2e/**/*.test.js'
  ],
  testTimeout: 60000, // Even longer timeout for E2E tests
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/testSetup.js']
};

