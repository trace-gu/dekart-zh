import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ENGLISH,
  normalizeLocale,
  persistLocale,
  resolveLocale,
  setCurrentLocale,
  translate
} from './locale'

export { LOCALES, keplerLocaleFor, t } from './locale'

const I18nContext = createContext(null)

function buildFormatters (locale) {
  const dateTimeFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' })
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })
  const numberFormat = new Intl.NumberFormat(locale)
  return {
    formatDate: value => (value ? dateFormat.format(new Date(value)) : ''),
    formatDateTime: value => (value ? dateTimeFormat.format(new Date(value)) : ''),
    formatNumber: value => numberFormat.format(value)
  }
}

// Components rendered outside the provider (unit tests, isolated widgets) keep English defaults.
const fallback = {
  locale: ENGLISH,
  setLocale: () => {},
  t: (message, values) => translate(ENGLISH, message, values),
  formatDate: value => (value ? new Date(value).toLocaleDateString('en') : ''),
  formatDateTime: value => (value ? new Date(value).toLocaleString('en') : ''),
  formatNumber: value => String(value)
}

export function I18nProvider ({ children }) {
  const [locale, setLocaleState] = useState(resolveLocale)

  const setLocale = useCallback(nextLocale => {
    const normalized = normalizeLocale(nextLocale)
    setLocaleState(normalized)
    setCurrentLocale(normalized)
    persistLocale(normalized)
  }, [])

  useEffect(() => {
    setCurrentLocale(locale)
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale
    }
  }, [locale])

  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (message, values) => translate(locale, message, values),
    ...buildFormatters(locale)
  }), [locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n () {
  return useContext(I18nContext) || fallback
}
