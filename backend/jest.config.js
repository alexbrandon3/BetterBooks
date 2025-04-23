/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest'],
  },
  testMatch: ['**/__tests__/**/*.test.ts'], // looks inside __tests__ folders for *.test.ts
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  setupFiles: ['<rootDir>/src/test/setupEnv.ts'], // optional, if you want to load .env.test early
};
