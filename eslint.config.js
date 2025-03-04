import pluginJs from "@eslint/js";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import stylistic from "@stylistic/eslint-plugin";
import * as tsParse from "@typescript-eslint/parser";
// import turboConfig from "eslint-config-turbo/flat";
import { createTypeScriptImportResolver, } from "eslint-import-resolver-typescript";
import eslintPluginImportX from "eslint-plugin-import-x";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import { configs as tsConfigs, } from "typescript-eslint";

const commonStylisticRules = {
  "@stylistic/object-curly-newline": [
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
        minProperties: 3,
      },
      ExportDeclaration: {
        multiline: true,
        minProperties: 3,
      },
    },
  ],
  "@stylistic/no-multiple-empty-lines": [ "error", { max: 1, maxEOF: 0, }, ],
  "@stylistic/object-curly-spacing": [ "error", "always", ],
  "@stylistic/object-property-newline": [ "error", { allowAllPropertiesOnSameLine: true, }, ],
  "@stylistic/indent": [ "error", 2, ],
  "@stylistic/quotes": [ "error", "double", ],
  "@stylistic/semi": [ "error", "always", ],
  "@stylistic/arrow-parens": [ "error", "always", ],
  "@stylistic/quote-props": [ "error", "as-needed", ],
  "@stylistic/brace-style": [ "error", "1tbs", ],
  "@stylistic/comma-dangle": [ "error", "always", ],
  "@stylistic/array-bracket-newline": [ "error", { multiline: true, minItems: 4, }, ],
  "@stylistic/array-bracket-spacing": [
    "error",
    "always",
    { singleValue: false, },
  ],
  "@stylistic/array-element-newline": [
    "error",
    {
      consistent: true, minItems: 3, multiline: true,
    },
  ],
};

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    name: "project/ignores",
    ignores: [
      "**/dist/**",
      "**/dist-ssr/**",
      "**/coverage/**",
      "**/node_modules/**",
      ".vscode/**",
      ".husky/**",
      "apps/**",
    ],
  },
  ...tsConfigs.recommended,
  // ...turboConfig,
  {
    name: "project/config",
    files: ["*.js",],
    ...pluginJs.configs.recommended,
    plugins: {
      "simple-import-sort": simpleImportSort,
      "@stylistic": stylistic,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "sort-imports": "off",
      ...commonStylisticRules,
    },
  },
  {
    name: "project/packages",
    files: ["packages/**/*.{js,ts,mjs,mts,cjs}",],
    ...pluginJs.configs.recommended,
    ...eslintPluginImportX.flatConfigs.recommended,
    ...eslintPluginImportX.flatConfigs.typescript,
    languageOptions: {
      parser: tsParse,
      parserOptions: {
        projectService: true,
        project: ["./packages/*/tsconfig.json",],
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
    plugins: {
      "simple-import-sort": simpleImportSort,
      "@stylistic": stylistic,
      "import-x": eslintPluginImportX,
    },
    settings: {
      "import-x/parsers": { "@typescript-eslint/parser": [ ".ts", ".tsx", ], },
      "import/resolver-next": [
        createTypeScriptImportResolver ({
          alwaysTryTypes: true,
          project: "./packages/*/tsconfig.json",
        },),
      ],
      "import-x/resolver": {
        typescript: { project: ["./packages/*/tsconfig.json",], },
        node: { project: ["./packages/*/tsconfig.json",], },
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "separate-type-imports",
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "sort-imports": "off",
      ...commonStylisticRules,
    },
  },
  ...markdown.configs.recommended,
  {
    name: "project/json",
    files: ["**/*.json",],
    ignores: ["package-lock.json",],
    language: "json/jsonc",
    ...json.configs.recommended,
  },
];
