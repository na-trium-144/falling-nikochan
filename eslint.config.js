import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
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

const config = [
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  ...eslintPluginNext,
  {
    files: ["i18n/**/*"],
    rules: {
      "import/no-anonymous-default-export": "off",
    },
  },
  {
    files: ["route/**/*"],
    rules: {
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
    },
  },
  {
    rules: {
      "prefer-const": "off",
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];

export default config;
