export const SUPPORTED_LOCALES = ["id", "en"] as const;
export const DEFAULT_LOCALE = "id" as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export function isLocale(value: string): value is Locale {
  return SUPPORTED_LOCALES.includes(value as Locale);
}
