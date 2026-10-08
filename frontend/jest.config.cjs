module.exports = {
    testEnvironment: "jsdom",
    transform: {
        "^.+\\.[jt]sx?$": "babel-jest",
    },
    moduleNameMapper: {
        "\\.module\\.css$": "identity-obj-proxy",
        "\\.css$": "<rootDir>/test/styleMock.cjs",
    },
    setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs"],
    testMatch: ["<rootDir>/src/**/*.test.ts", "<rootDir>/src/**/*.test.tsx"],
};
  testEnvironment: '<rootDir>/tests/environment.cjs',
  roots: ['<rootDir>/tests'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  moduleNameMapper: { '\\.css$': '<rootDir>/tests/styleMock.cjs' },
  clearMocks: true,
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        ['@babel/preset-react', { runtime: 'automatic' }],
        '@babel/preset-typescript',
      ],
      // Vite's API URL is replaced with a fake URL only during tests.
      plugins: [({ types: t }) => ({
        visitor: {
          MemberExpression(path) {
            if (t.isMetaProperty(path.node.object) &&
                t.isIdentifier(path.node.property, { name: 'env' })) {
              path.replaceWith(t.valueToNode({ VITE_API_URL: 'https://bank.test' }))
            }
          },
        },
      })],
    }],
  },
}