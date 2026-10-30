import { messages as keplerMessages } from '@kepler.gl/localization/dist/messages'
import { LOCALES, LOCALE_CODES } from '@kepler.gl/localization/dist/locales'
import FormattedMessage from '@kepler.gl/localization/dist/formatted-message'
import chineseOverrides from './keplerZhMessages'

// Kepler's Chinese bundle is missing a number of newer keys and leaves some English values in place.
// Merge local overrides on top of the upstream bundle so the map UI is consistently Chinese.
export const messages = {
  ...keplerMessages,
  cn: {
    ...keplerMessages.cn,
    ...chineseOverrides
  }
}

export { LOCALES, LOCALE_CODES, FormattedMessage }
export default messages
