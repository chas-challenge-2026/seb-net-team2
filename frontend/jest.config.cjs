module.exports = {
    testEnvironment: "<rootDir>/tests/environment.cjs",
    roots: ["<rootDir>/src", "<rootDir>/tests"],
    setupFilesAfterEnv: ["<rootDir>/jest.setup.cjs", "<rootDir>/tests/setup.ts"],
    testMatch: ["**/*.test.ts", "**/*.test.tsx"],
    moduleNameMapper: {
        "\\.module\\.css$": "identity-obj-proxy",
        "\\.css$": "<rootDir>/tests/styleMock.cjs",
    },
    clearMocks: true,
    transform: {
        "^.+\\.[jt]sx?$": ["babel-jest", {
            presets: [
                ["@babel/preset-env", { targets: { node: "current" } }],
                ["@babel/preset-react", { runtime: "automatic" }],
                "@babel/preset-typescript",
            ],
            plugins: [({ types: t }) => ({
                visitor: {
                    MemberExpression(path) {
                        if (t.isMetaProperty(path.node.object) &&
                            t.isIdentifier(path.node.property, { name: "env" })) {
                            path.replaceWith(t.valueToNode({ VITE_API_URL: "https://bank.test" }));
                        }
                    },
                },
            })],
        }],
    },
};
