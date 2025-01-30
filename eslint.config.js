import pluginJs from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import stylistic from "@stylistic/eslint-plugin";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import {configs as tsConfigs } from "typescript-eslint";
import eslintPluginImportX from 'eslint-plugin-import-x'
import * as tsParse from '@typescript-eslint/parser'
import {
  createTypeScriptImportResolver,
} from 'eslint-import-resolver-typescript'


/** @type {import('eslint').Linter.Config[]} */
export default [
  {    ignores: ["**/dist/**", "**/dist-ssr/**", "**/coverage/**", "**/node_modules/**", ".vscode/**", ".husky/**",],},
  ...tsConfigs.recommended,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  {
    name: 'project/configuration',
    files: ["**/*.{js,ts,mjs,mts,cjs}",],
    ignores: ["eslint.config.js", "commitlint.config.js"],
    languageOptions: {
      parser: tsParse,
      parserOptions: {
        projectService: true,
        allowDefaultProject: ["eslint.config.js", "commitlint.config.js"],
      },
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
    settings: {
      "import/resolver-next": [createTypeScriptImportResolver({
        alwaysTryTypes: true,
        project: ["packages/**/tsconfig.json"]
      })]
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "separate-type-imports", },
      ],
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
  ...markdown.configs.recommended,
  {
    files: ["**/*.json",],
    ignores: ["package-lock.json",],
    language: "json/jsonc",
    ...json.configs.recommended,
  },
];
