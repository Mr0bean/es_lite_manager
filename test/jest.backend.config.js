export default {
  testEnvironment: 'node',
  roots: ['<rootDir>/server'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'server/**/*.js',
    '!server/**/__tests__/**',
    '!server/**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage/backend',
  setupFilesAfterEnv: ['<rootDir>/server/__tests__/setup.js'],
  transform: {},
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  testTimeout: 10000,
  extensionsToTreatAsEsm: [],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  testEnvironmentOptions: {
    experimentalVmModules: true
  }
};