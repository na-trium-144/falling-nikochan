import { createTranslator } from "next-intl";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

export async function locales() {
  try {
    const files = await readdir(join(process.cwd(), "i18n"), {
      withFileTypes: true,
    });
    return files.filter((ent) => ent.isDirectory()).map((ent) => ent.name);
  } catch (err) {
    console.error("Unable to scan directory: " + err);
    return [];
  }
}

export async function getMessages(locale: string) {
  return {
    ...(await import(`./${locale}/main.js`)).default,
    ...(await import(`./${locale}/about.js`)).default,
    ...(await import(`./${locale}/share.js`)).default,
    ...(await import(`./${locale}/play.js`)).default,
    ...(await import(`./${locale}/edit.js`)).default,
  };
}

export async function getTranslations(
  params: Promise<{ locale: string }> | string,
  namespace?: string
) {
  const locale = typeof params === "string" ? params : (await params).locale;
  const translator = createTranslator({
    locale,
    messages: await getMessages(locale),
    namespace,
  });
  return translator;
}
