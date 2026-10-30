import Button from 'antd/es/button'
import { CloseOutlined } from '@ant-design/icons'
import styles from './MapConfigConflictMessage.module.css'
import { useI18n } from './i18n'

export default function MapConfigConflictMessage ({ onReload, onDismiss }) {
  const { t } = useI18n()
  return (
    <span> {t('Map changed')} <Button size='small' className={styles.reloadButton} onClick={onReload}>{t('Reload')}</Button>
      <Button
        size='small'
        type='text'
        icon={<CloseOutlined />}
        aria-label={t('Dismiss')}
        onClick={onDismiss}
        className={styles.closeButton}
      />
    </span>
  )
}
