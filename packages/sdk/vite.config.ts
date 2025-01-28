/// <reference types="vitest" />
import path from "path";
import { defineConfig, } from "vite";
import dts from "vite-plugin-dts";

import packageJson from "./package.json";

const getPackageName = () => {
  return packageJson.name;
};

const getPackageNameCamelCase = () => {
  try {
    return getPackageName().replace(/-./g, (char,) => char[1].toUpperCase(),);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    throw new Error("Name property in package.json is missing.",);
  }
};

export default defineConfig({
  base: "./",
  build: {
    outDir: "./dist",
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, "src/main.ts",),
      name: getPackageNameCamelCase(),
      formats: ["es", "cjs",],
      fileName: (format,) => {
        if (format === "es") {
          return `${getPackageName()}.esm.js`;
        } else if (format === "cjs") {
          return `${getPackageName()}.cjs`;
        }
        return `${getPackageName()}.${format}.js`;
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: [
      {
        find: "~",
        replacement: path.resolve(__dirname, "src",),
      },
      {
        find: "~~",
        replacement: path.resolve(__dirname,),
      },
    ],
  },
  plugins: [dts({ rollupTypes: true, },),],
},);

