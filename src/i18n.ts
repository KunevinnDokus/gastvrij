import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export const locales = ['nl', 'fr', 'de', 'en'] as const;
export const defaultLocale = 'nl' as const;

export type Locale = typeof locales[number];

export default getRequestConfig(async ({ requestLocale }) => {
  // This typically corresponds to the `[locale]` segment
  let locale = await requestLocale;

  // Ensure that the incoming locale is valid and select a default
  if (!locale || !locales.includes(locale as any)) {
    locale = 'nl';
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});