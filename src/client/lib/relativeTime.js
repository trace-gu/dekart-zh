const formatters = {}

function formatterFor (locale) {
  if (!formatters[locale]) {
    formatters[locale] = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  }
  return formatters[locale]
}

export function getRelativeTime (date, locale = 'en') {
  const rtf = formatterFor(locale)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffWeeks = Math.floor(diffDays / 7)
  const diffMonths = Math.floor(diffDays / 30)
  const diffYears = Math.floor(diffDays / 365)

  if (diffSecs < 60) return null
  if (diffMins < 60) return rtf.format(-diffMins, 'minute')
  if (diffHours < 24) return rtf.format(-diffHours, 'hour')
  if (diffDays < 7) return rtf.format(-diffDays, 'day')
  if (diffWeeks < 4) return rtf.format(-diffWeeks, 'week')
  if (diffMonths < 12) return rtf.format(-diffMonths, 'month')
  return rtf.format(-diffYears, 'year')
}
