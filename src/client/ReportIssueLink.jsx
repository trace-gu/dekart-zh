import Button from 'antd/es/button'
import { version } from '../../package.json'
import { useI18n } from './i18n'

// ReportIssueLink opens a draft without copying potentially private error text into its URL.
export default function ReportIssueLink ({ category }) {
  const { t } = useI18n()
  const params = new URLSearchParams({
    title: `Dekart ${category} issue`,
    body: `Dekart version: ${version}\nArea: ${category}\n\nWhat happened?\n\nSteps to reproduce:\n`
  })
  return (
    <Button
      href={`https://github.com/dekart-xyz/dekart/issues/new?${params}`}
      target='_blank'
      rel='noopener noreferrer'
      type='text'
    >{t('Report issue')}
    </Button>
  )
}
