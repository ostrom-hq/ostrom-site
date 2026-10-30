import { en, type Messages } from './en'

export const locales = ['en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'

const catalogs: Readonly<Record<Locale, Messages>> = { en }

/** The texts of one language. English only for now; French is planned with the same keys. */
export function getMessages(locale: Locale = defaultLocale): Messages {
  return catalogs[locale]
}

export type { Messages }
