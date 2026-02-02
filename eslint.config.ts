import { defineConfig } from "eslint/config";
// https://stackoverflow.com/questions/79841715/typescript-error-pluginflatconfig-is-not-assignable-to-configwithextends-when-u
import { ConfigWithExtends } from "@eslint/config-helpers";
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const eslintPluginNext = compat.config({
  extends: ["next/core-web-vitals"],
  settings: {
    next: {
      rootDir: "frontend/",
    },
  },
  rules: {
    "@next/next/no-html-link-for-pages": "warn",
    "@next/next/no-img-element": "off",
    "jsx-a11y/alt-text": "off",
    "react-hooks/exhaustive-deps": "error",
  },
});

export default defineConfig(
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  { files: ["frontend/**/*"], extends: eslintPluginNext } as ConfigWithExtends,
  {
    files: ["i18n/**/*"],
    rules: {
      "import/no-anonymous-default-export": "off",
    },
  },
  {
    rules: {
      "prefer-const": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["**/*.spec.ts"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
