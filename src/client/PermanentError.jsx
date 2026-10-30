import Button from 'antd/es/button'
import ReportIssueLink from './ReportIssueLink'
import errorStyles from './ErrorMessage.module.css'
import { useI18n } from './i18n'

export default function PermanentError ({ code, message }) {
  const { t } = useI18n()
  return (
    <span className={errorStyles.content}>
      <span className={errorStyles.text}>{message}</span>
      <span className={errorStyles.actions}>
        <ReportIssueLink category='application error' />
        <Button type='primary' onClick={() => window.location.reload()}>{t('Reload page')}</Button>
      </span>
    </span>
  )
}
