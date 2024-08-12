/** @type {import('@types/eslint').Linter.BaseConfig} */
module.exports = {
  extends: [
    "@remix-run/eslint-config",
    "@remix-run/eslint-config/node",
    "@remix-run/eslint-config/jest-testing-library",
    "prettier",
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ["react", "react-hooks", "@typescript-eslint"],
  rules: {
    //add customize rules here as per your project's needs
    "react/react-in-jsx-scope": "off",
    "@typescript-eslint/no-floating-promises": ["error"],
    "@typescript-eslint/await-thenable": ["error"],
    "@typescript-eslint/require-await": ["error"],
    "@typescript-eslint/no-misused-promises": ["error"],
  },
  env: {
    // "cypress/globals": true,
  },
  // plugins: ["cypress"],
  // we're using vitest which has a very similar API to jest
  // (so the linting plugins work nicely), but it we have to explicitly
  // set the jest version.
  settings: {
    // jest: {
    //   version: 28,
    // },
  },
};
