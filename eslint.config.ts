import { defineConfig } from "eslint/config";
import type { Linter } from "eslint";
import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier/flat";
import eslintConfigNext from "eslint-config-next";

export default defineConfig(
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  // eslint-config-next provides flat config but without complete TypeScript types
  ...eslintConfigNext.map((config: Linter.Config) => ({
    ...config,
    files: config.files?.map((pattern) =>
      typeof pattern === "string" ? `frontend/${pattern}` : pattern
    ) ?? ["frontend/**/*"],
  })),
  {
    files: ["frontend/**/*"],
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
      // TODO: React19,Next.js16で導入された以下のルールをerrorにし、すべて修正する
      "react-hooks/refs": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/globals": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
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
