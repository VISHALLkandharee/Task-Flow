/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/?(*.)+(spec|test).{ts,tsx}'],
  moduleNameMapper: {
    // Handle the @/* path alias defined in tsconfig.json
    '^@/(.*)$': '<rootDir>/$1',
    // Stub out CSS / image imports so they don't break tests
    '\\.(css|scss|sass|less)$': '<rootDir>/__mocks__/styleMock.js',
    '\\.(jpg|jpeg|png|gif|svg|ico|webp)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        // Override moduleResolution to node so ts-jest can resolve modules
        moduleResolution: 'node',
        jsx: 'react-jsx',
      },
    }],
  },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'hooks/**/*.{ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
    '!**/*.d.ts',
  ],
  coverageThreshold: {
    './components/board/TaskEditForm.tsx': {
      branches: 60,
      functions: 70,
      lines: 80,
      statements: 80,
    },
    './app/(dashboard)/billing/page.tsx': {
      branches: 50,
      functions: 40,
      lines: 60,
      statements: 60,
    },
  },
};

module.exports = config;
