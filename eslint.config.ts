import { defineConfig } from "eslint/config";
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
    "@next/next/no-img-element": "warn",
    "jsx-a11y/alt-text": "warn",
  },
});

export default defineConfig(
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  // @ts-expect-error https://github.com/typescript-eslint/typescript-eslint/issues/10899
  tseslint.configs.recommended,
  eslintConfigPrettier,
  { files: ["frontend/**/*"], extends: eslintPluginNext },
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
      "@typescript-eslint/no-unused-vars": "warn",
    },
  }
);
