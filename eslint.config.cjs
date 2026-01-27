// FILE: eslint.config.cjs
const reactPlugin = require("eslint-plugin-react");
const reactHooksPlugin = require("eslint-plugin-react-hooks");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsParser = require("@typescript-eslint/parser");

module.exports = [
  // Global ignores (kept minimal; lint script already scopes to app/components/lib)
  {
    ignores: [
      ".next/**",
      ".bak_*/**",
      "_implementation_sandbox/**",
      "node_modules/**",
      "dist/**",
      "build/**",
      "out/**",
      ".vercel/**",
      "themes/**",
    ],
  },

  // JS/JSX
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },

  // TS/TSX
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
];
