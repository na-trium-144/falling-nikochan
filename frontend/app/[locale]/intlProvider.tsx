"use client";

import { createTranslator } from "next-intl";
import { getMessages } from "@falling-nikochan/i18n/dynamic";
import { useParams } from "next/navigation";

const translatorsCache = new Map<
  string,
  Map<string, ReturnType<typeof createTranslator>>
>();
/**
 * next-intlの useTranslations はNextIntlClientProviderの内側でしか使えない。
 * このプロジェクトではlocaleは常にパスパラメーターで、RSCを避けるためにメッセージ全部をjsに入れているので、
 * NextIntlClientProviderを使わずに直接translatorを構築することが可能
 *
 * サーバーコンポーネントでは getTranslations(locale, namespace) を使う。内容はキャッシュがなくなぜかasyncがついているだけでほぼ同じ。
 */
export function useTranslations(namespace: string) {
  const params = useParams<{ locale?: string }>();
  const locale = params.locale ?? "en";
  if (!translatorsCache.has(locale)) {
    translatorsCache.set(locale, new Map());
  }
  if (translatorsCache.get(locale)!.has(namespace)) {
    return translatorsCache.get(locale)!.get(namespace)!;
  } else {
    const translator = createTranslator({
      locale,
      messages: getMessages(locale),
      namespace,
    });
    translatorsCache.get(locale)!.set(namespace, translator);
    return translator;
  }
}
