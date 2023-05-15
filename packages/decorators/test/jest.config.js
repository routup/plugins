module.exports = {
    testEnvironment: 'node',
    transform: {
        "^.+\\.tsx?$": [
            "@swc/jest",
            {
                "jsc": {
                    "parser": {
                        "syntax": "typescript",
                        "decorators": true
                    }
                }
            }
        ]
    },
    moduleFileExtensions: [
        "ts",
        "tsx",
        "js",
        "jsx",
        "json",
        "node",
    ],
    testRegex: '(/unit/.*|(\\.|/)(test|spec))\\.(ts|js)x?$',
    testPathIgnorePatterns: [
        "coverage",
        "dist",
        "/unit/mock-util.ts"
    ],
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.{ts,tsx,js,jsx}',
        '!src/**/*.d.ts'
    ],
    coverageThreshold: {
        global: {
            branches: 58,
            functions: 77,
            lines: 73,
            statements: 73
        }
    },
    rootDir: '../',
    verbose: true
};
