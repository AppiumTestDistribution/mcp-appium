export default {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    // Mock @appium/support to avoid ESM/CommonJS issues with uuid
    '^@appium/support$': '<rootDir>/src/tests/__mocks__/@appium/support.ts',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  // Add this to ensure Jest can handle ESM
  // Exclude ES modules from transformation
  transformIgnorePatterns: [
    'node_modules/(?!(@xmldom|fast-xml-parser|xpath|uuid)/)',
  ],
};
