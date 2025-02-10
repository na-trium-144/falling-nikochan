# app/i18n

This directory contains the translations of the application.

To add a new language, create a new directory with the language code and add all the translations in the corresponding files.

When a new language added, it is automatically applied to the application except for the following files:
- app/[locale]/edit/guideMain.tsx
- app/[locale]/main/policies/page.tsx
- app/[locale]/main/version/page.tsx
- route/app.ts (`supportedLanguages:` in languageDetector)

See also [next-intl Usage guide](https://next-intl.dev/docs/usage/messages)
