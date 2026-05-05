// jest.config.js
module.exports = {
  preset: 'jest-expo',
  // On utilise ts-jest uniquement pour les fichiers de tests/services si nécessaire
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-native',
      },
    }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|zustand)',
  ],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  // Correction ici : setupFilesAfterEnv (avec un s à la fin de Files)
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/store/**/*.ts',
    'src/services/api/**/*.ts',
    '!src/**/*.d.ts',
  ],
};
