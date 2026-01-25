module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    'public/js/services/**/*.js',
    'public/js/modules/**/*.js',
    '!**/node_modules/**',
    '!**/vendor/**'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  verbose: true,
  testTimeout: 10000
};
