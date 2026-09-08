/**
 * The contract suite runs in a plain Node environment, not the phone's.
 *
 * The jest-expo preset replaces the global fetch with a stub that answers
 * with no status, which is right for a screen test and wrong for a test whose
 * whole purpose is to reach the real API through the app's client (CI run
 * 34182473412: every contract test received `status: undefined`). The preset's
 * transform is kept so the workspace packages compile the same way; its
 * native set-up files are not loaded, and Node's own fetch stands.
 */
const preset = require("jest-expo/jest-preset");
const app = require("../../package.json");

module.exports = {
  ...preset,
  rootDir: "../..",
  testEnvironment: "node",
  setupFiles: [],
  setupFilesAfterEnv: [],
  testMatch: ["<rootDir>/test/contract/**/*.test.ts"],
  testTimeout: 30_000,
  transformIgnorePatterns: app.jest.transformIgnorePatterns,
  moduleNameMapper: { ...(preset.moduleNameMapper ?? {}), "^@/(.*)$": "<rootDir>/src/$1" },
};
