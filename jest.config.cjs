module.exports = {
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    "src/**/*.{js,jsx}",
    "!src/**/*.test.{js,jsx}",
    "!**/node_modules/**",
    "!**/vendor/**"
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ["json", "text", "lcov", "clover"],

  // An array of file extensions your modules use
  moduleFileExtensions: ["js", "jsx", "json", "node"],

  // The root directory that Jest should scan for tests and modules within
  // <rootDir> is a special token that gets replaced by Jest with the root of your project
  roots: ["<rootDir>/src"], // Focus only on backend tests for now

  // The test environment that will be used for testing
  testEnvironment: "node", // Default for backend, but client tests might need 'jsdom'

  // The glob patterns Jest uses to detect test files
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[tj]s?(x)"
  ],

  // A map from regular expressions to paths to transformers
  // Babel-jest is automatically configured by Jest if babel-jest is installed,
  // but explicit configuration might be needed for complex setups.
  transform: {
    "^.+\\.jsx?$": "babel-jest" // Process JS and JSX files with babel-jest
  },

  // An array of regexp pattern strings that are matched against all source file paths, matched files will skip transformation
  transformIgnorePatterns: [
    "/node_modules/",
    "\\.pnp\\.[^\\/]+$"
  ],

  // For ES Modules support with Node.js, experimental-vm-modules is needed.
  // Jest also needs to know that we are using ES Modules.
  // This can sometimes be tricky with Babel.
  // Ensure your babel.config.cjs is set up for ES Modules if your source code uses them.
  // For "type": "module" in package.json, Jest might need specific configurations.

  // If client tests need a different environment (like jsdom for React components)
  // you might need to use Jest's "projects" configuration.
  // For now, this setup attempts a single run.
  // If client/src tests fail due to environment, projects config is the next step.

  // Setup files after env
  // setupFilesAfterEnv: ['<rootDir>/client/src/setupTests.js'], // If you have a setupTests.js for React Testing Library

  // Module Name Mapper to handle module aliases or specific module mocks if needed
  moduleNameMapper: {
    "^mercadopago$": "<rootDir>/src/controllers/__mocks__/mercadopago.js",
    // Example for CSS modules: "\\.(css|less|scss|sass)$": "identity-obj-proxy"
  },

  // Verbose output
  verbose: true,
};
