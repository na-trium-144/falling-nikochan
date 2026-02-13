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
      // React 19 introduced stricter rules that have false positives or require significant refactoring
      // These ref-like objects are not actual React refs
      "react-hooks/refs": "off",
      // Disable immutability check for ref-like objects passed as props
      "react-hooks/immutability": "off",
      // Disable globals check for intentional module-level state patterns
      "react-hooks/globals": "off",
      // Downgrade to warning as this is a new React 19 strictness that would require significant refactoring
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
