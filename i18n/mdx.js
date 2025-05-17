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
