import pluginJs from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import stylistic from "@stylistic/eslint-plugin";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
// eslint-disable-next-line import/no-unresolved
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {    ignores: ["**/dist/**", "**/dist-ssr/**", "**/coverage/**", "**/node_modules/**",],},
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,ts,mjs,mts,cjs}",],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: "latest",
    },
    ...pluginJs.configs.recommended,
    plugins: {
      "simple-import-sort": simpleImportSort,
      "@stylistic": stylistic,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "sort-imports": "off",
      "object-curly-newline": [
        "error",
        {
          ObjectExpression: {
            multiline: true,
            minProperties: 3,
          },
          ObjectPattern: {
            multiline: true,
            minProperties: 3,
          },
          ImportDeclaration: {
            multiline: true,
            minProperties: 5,
          },
          ExportDeclaration: {
            multiline: true,
            minProperties: 3,
          },
        },
      ],
      "object-property-newline": ["error",],
      "@stylistic/indent": ["error", 2,],
      "@stylistic/quotes": ["error", "double",],
      "@stylistic/semi": ["error", "always",],
      "@stylistic/arrow-parens": ["error", "always",],
      "@stylistic/quote-props": ["error", "as-needed",],
      "@stylistic/brace-style": ["error", "1tbs",],
      "@stylistic/comma-dangle": ["error", "always",],
    },
  },
  importPlugin.flatConfigs.recommended,

  ...markdown.configs.recommended,
  {
    files: ["**/*.json",],
    ignores: ["package-lock.json",],
    language: "json/jsonc",
    ...json.configs.recommended,
  },
];
