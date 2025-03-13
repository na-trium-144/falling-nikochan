import { createTranslator } from "next-intl";

export const locales = ["en", "ja"];

export async function getMessages(locale) {
  return {
    ...(await import(`./${locale}/main.js`)).default,
    ...(await import(`./${locale}/about.js`)).default,
    ...(await import(`./${locale}/share.js`)).default,
    ...(await import(`./${locale}/play.js`)).default,
    ...(await import(`./${locale}/edit.js`)).default,
    ...(await import(`./${locale}/error.js`)).default,
  };
}

export async function importPoliciesMDX(locale) {
  return (await import(`./${locale}/policies.mdx`)).default;
}
export async function importChangeLogMDX(locale) {
  return (await import(`./${locale}/changelog.mdx`)).default;
}
export async function importGuideMDX(locale) {
  return Promise.all(
    [
      "1-welcome",
      "2-metaTab",
      "3-timeBar",
      "4-timingTab",
      "5-levelTab",
      "6-noteTab",
      "7-codeTab",
    ].map(async (n) => (await import(`./${locale}/guide/${n}.mdx`)).default)
  );
}

export async function getTranslations(params, namespace) {
  const locale = typeof params === "string" ? params : (await params).locale;
  const translator = createTranslator({
    locale,
    messages: await getMessages(locale),
    namespace,
  });
  return translator;
}
