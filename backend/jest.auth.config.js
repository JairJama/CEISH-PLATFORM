module.exports = {
  rootDir: "src",
  testRegex: "common/(auth/session\\.util|guards/auth\\.guard)\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  testEnvironment: "node",
};
