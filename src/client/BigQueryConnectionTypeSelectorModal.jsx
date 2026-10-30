import Button from 'antd/es/button'
import Modal from 'antd/es/modal/Modal'
import Tooltip from 'antd/es/tooltip'
import styles from './BigQueryConnectionTypeSelectorModal.module.css'
import { newConnection } from './actions/connection'
import { ConnectionType } from 'dekart-proto/dekart_pb'
import { useDispatch, useSelector } from 'react-redux'
import { useEffect } from 'react'
import { track } from './lib/tracking'
import { useI18n } from './i18n'

export default function BigQueryConnectionTypeSelectorModal ({ open, onClose }) {
  const { t } = useI18n()
  const dispatch = useDispatch()
  const googleOAuthEnabled = useSelector(state => state.env.googleOAuthEnabled)
  const googleOAuthDisabledTitle = googleOAuthEnabled ? '' : t('Google OAuth is not configured for this Dekart instance')
  useEffect(() => {
    if (open) {
      track('OpenBigQueryConnectionTypeSelectorModal')
    }
  }, [open])

  return (
    <Modal
      title={t('Choose BigQuery Connection Method')}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <div className={styles.connectionOptions}>
        <div className={styles.connectionOptionsItem}>
          <h2>
            {t('Use your Google Account')}
          </h2>
          <p>
            {t('Recommended if your account already has BigQuery access.')}
          </p>
          <p>
            {t('No credentials stored in Dekart backend.')}
          </p>

          <p>
            <Tooltip title={googleOAuthDisabledTitle}>
              <span>
                <Button
                  type='primary'
                  disabled={!googleOAuthEnabled}
                  onClick={() => {
                    onClose()
                    dispatch(newConnection(ConnectionType.CONNECTION_TYPE_BIGQUERY))
                    track('ConnectWithGoogle')
                  }}
                >{t('Connect with Google')}
                </Button>
              </span>
            </Tooltip>
          </p>
          <p>
            → <a href='https://dekart.xyz/docs/usage/choose-bigquery-connection-method/#which-permissions-are-required' target='_blank' rel='noreferrer'>{t('Which permissions required?')}</a>
          </p>

        </div>
        <div className={styles.connectionOptionsItem}>
          <h2>
            {t('Use Service Account')}
          </h2>
          <p>
            {t('Connect to BigQuery with using Service Account Key in JSON format.')}
          </p>
          <p>{t('Key will be encrypted and stored in Dekart backend.')}</p>

          <p>
            <Button
              type='primary'
              onClick={() => {
                onClose()
                dispatch(newConnection(ConnectionType.CONNECTION_TYPE_BIGQUERY, true))
                track('ConnectWithServiceAccount')
              }}
            >{t('Configure Service Account')}
            </Button>
          </p>
          <div>
            <div>→ <a href='https://dekart.xyz/docs/usage/choose-bigquery-connection-method/#how-to-get-a-service-account-key' target='_blank' rel='noreferrer'>{t('How to get the key?')}</a></div>
            <div>→ <a href='https://dekart.xyz/docs/usage/choose-bigquery-connection-method/#how-is-the-key-secured' target='_blank' rel='noreferrer'>{t('How key is secured?')}</a></div>
          </div>

        </div>
      </div>
    </Modal>
  )
}
