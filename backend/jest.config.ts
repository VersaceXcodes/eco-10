module.exports = {
  "testEnvironment": "node",
  "preset": "ts-jest",
  "setupFiles": [
    "<rootDir>/setupTests.js"
  ],
  "testMatch": [
    "**/__tests__/**/*.ts",
    "**/__tests__/**/*.js"
  ],
  "collectCoverageFrom": [
    "**/*.{js,ts}",
    "!**/node_modules/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
};