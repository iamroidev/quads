module.exports = {
  preset: 'jest-expo',
  setupFiles: ['./setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-?|react-native|@react-native|expo|@expo|@react-navigation|@expo-google-fonts))',
  ],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.test.{ts,tsx}', '!src/**/*.d.ts'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
};
