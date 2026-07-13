import { DEFAULT_LOCALE, type Locale } from "./config";
import { id } from "./dictionaries/id";
import { en } from "./dictionaries/en";
import type { Dictionary } from "./types";

const dictionaries = {
  id,
  en,
} as const satisfies Record<Locale, Dictionary>;

export function getDictionary(locale: Locale = DEFAULT_LOCALE): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}
