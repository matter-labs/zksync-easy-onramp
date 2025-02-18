import stylistic from "@stylistic/eslint-plugin";
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginPlaywright from 'eslint-plugin-playwright'
import simpleImportSort from "eslint-plugin-simple-import-sort";
import pluginVue from 'eslint-plugin-vue'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{ts,mts,tsx,vue}'],
  },

  {
    name: 'app/files-to-ignore',
    ignores: ['**/dist/**', '**/dist-ssr/**', '**/coverage/**'],
  },

  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  {
    files: ["**/*.{ts,mts,tsx,vue}",],
    plugins: {
      "@stylistic": stylistic,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "sort-imports": "off",
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
    },
  },
  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    ...pluginPlaywright.configs['flat/recommended'],
    files: ['e2e/**/*.{test,spec}.{js,ts,jsx,tsx}'],
  },
  skipFormatting,
)
