module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
    collectCoverageFrom: [
      'src/**/*.js',
      '!src/config/**',
      '!**/node_modules/**'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
  };