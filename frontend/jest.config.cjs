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