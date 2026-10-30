import zh from './messages/zh'

export const ENGLISH = 'en'
export const SIMPLIFIED_CHINESE = 'zh-CN'
export const LOCALE_STORAGE_KEY = 'dekart.locale'

export const LOCALES = [
  { code: ENGLISH, label: 'English', kepler: 'en' },
  { code: SIMPLIFIED_CHINESE, label: '简体中文', kepler: 'cn' }
]

const catalogs = {
  [SIMPLIFIED_CHINESE]: zh
}

const KEPLER_LOCALES = {
  [ENGLISH]: 'en',
  [SIMPLIFIED_CHINESE]: 'cn'
}

// Treat every Chinese variant as Simplified Chinese and everything else as English.
export function normalizeLocale (locale) {
  if (!locale) {
    return ENGLISH
  }
  return String(locale).toLowerCase().indexOf('zh') === 0 ? SIMPLIFIED_CHINESE : ENGLISH
}

// Prefer the user's stored choice, then the browser language.
export function resolveLocale () {
  try {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(LOCALE_STORAGE_KEY) : null
    if (stored) {
      return normalizeLocale(stored)
    }
  } catch (error) {
    // Storage can be unavailable in private or embedded browsers; fall back to the browser language.
  }
  if (typeof navigator === 'undefined') {
    return ENGLISH
  }
  const preferred = (navigator.languages && navigator.languages[0]) || navigator.language
  return normalizeLocale(preferred)
}

export function persistLocale (locale) {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale))
    }
  } catch (error) {
    // Ignore storage failures; the in-memory locale still applies for this session.
  }
}

// Kepler ships a Chinese bundle under the `cn` locale code.
export function keplerLocaleFor (locale) {
  return KEPLER_LOCALES[normalizeLocale(locale)]
}

let currentLocale = resolveLocale()

export function getCurrentLocale () {
  return currentLocale
}

export function setCurrentLocale (locale) {
  currentLocale = normalizeLocale(locale)
}

// Replace `{name}` placeholders so translated and source strings share one template format.
export function interpolate (message, values) {
  if (!values) {
    return message
  }
  return message.replace(/\{(\w+)\}/g, (match, key) => (
    values[key] === undefined ? match : String(values[key])
  ))
}

// Source strings are the dictionary keys; untranslated text falls back to the English source.
export function translate (locale, message, values) {
  if (!message) {
    return message
  }
  const catalog = catalogs[normalizeLocale(locale)]
  const template = (catalog && catalog[message]) || message
  return interpolate(template, values)
}

// Translate outside React components, for notifications and other imperative messages.
export function t (message, values) {
  return translate(currentLocale, message, values)
}
