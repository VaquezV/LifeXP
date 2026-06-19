module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@supabase/.*|react-navigation|@react-navigation/.*))',
  ],
  testMatch: ['**/*.test.ts', '**/*.test.tsx'],
};
