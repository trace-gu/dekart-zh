import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Card from 'antd/es/card'
import Button from 'antd/es/button'
import Empty from 'antd/es/empty'
import Typography from 'antd/es/typography'
import styles from './DeviceTokensTab.module.css'
import { revokeDeviceToken } from './actions/workspace'
import { useI18n } from './i18n'

const { Text } = Typography
const gisSkillRepoURL = 'https://github.com/dekart-xyz/geosql'

function AgentLink () {
  const { t } = useI18n()
  return (
    <div className={styles.agentLink}>
      <a href={gisSkillRepoURL} target='_blank' rel='noreferrer'>
        {t('Install Claude skill to run agentic GIS queries.')}
      </a>
    </div>
  )
}

// DeviceTokensTab renders workspace device tokens and revoke interactions.
export default function DeviceTokensTab () {
  const { t, formatDate } = useI18n()
  const dispatch = useDispatch()
  const devices = useSelector(state => state.deviceTokens.list)
  const loading = useSelector(state => state.deviceTokens.loading)
  const [confirmingId, setConfirmingId] = useState('')

  const isEmpty = useMemo(() => devices.length === 0, [devices.length])

  if (!loading && isEmpty) {
    return (
      <div className={styles.container}>
        <Card className={styles.wrapper}>
          <Empty description={t('No active device tokens')} />
        </Card>
        <AgentLink />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Card className={styles.wrapper} loading={loading}>
        <div className={styles.list}>
          {devices.map((device) => (
            <div key={device.id} className={styles.item}>
              <div className={styles.nameColumn}>
                <Text strong className={styles.deviceName}>{device.deviceName}</Text>
              </div>
              <div className={styles.detailsColumn}>
                <div className={styles.metaItem}>
                  <Text type='secondary'>{t('Token')}</Text>
                  <Text code>{device.tokenPreview}</Text>
                </div>
                <div className={styles.metaItem}>
                  <Text type='secondary'>{t('Since')}</Text>
                  <Text>{formatDate(device.createdAt * 1000)}</Text>
                </div>
              </div>
              <div className={styles.actions}>
                {confirmingId === device.id
                  ? (
                    <Button
                      danger
                      type='text'
                      className={styles.removeButton}
                      onClick={() => {
                        dispatch(revokeDeviceToken(device.id))
                        setConfirmingId('')
                      }}
                    >
                      {t('Confirm')}
                    </Button>
                    )
                  : (
                    <Button
                      type='text'
                      className={styles.removeButton}
                      onClick={() => setConfirmingId(device.id)}
                    >
                      {t('Remove')}
                    </Button>
                    )}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <AgentLink />
    </div>
  )
}
