import { useEffect, useMemo, useState } from 'react'
import Modal from 'antd/es/modal/Modal'
import Button from 'antd/es/button'
import Select from 'antd/es/select'
import Input from 'antd/es/input'
import styles from './OtherConnectorModal.module.css'
import { track } from './lib/tracking'
import { useDispatch, useSelector } from 'react-redux'
import { success } from './actions/message'
import { useI18n } from './i18n'

const REQUESTED_CONNECTORS_KEY = 'requestedOtherConnectors'
const CALENDLY_URL = 'https://calendly.com/vladi-dekart/meet-vladi'

export const OTHER_CONNECTOR_OPTIONS = [
  { label: 'Athena', value: 'athena' },
  { label: 'ClickHouse', value: 'clickhouse' },
  { label: 'Databricks', value: 'databricks' },
  { label: 'MotherDuck', value: 'motherduck' },
  { label: 'MySQL', value: 'mysql' },
  { label: 'Presto / Trino', value: 'presto_trino' },
  { label: 'Redshift', value: 'redshift' },
  { label: 'Other', value: 'other' }
]

export function buildBookCallUrl (connector, workspaceId) {
  const params = new URLSearchParams({
    connector: connector || '',
    workspace: workspaceId || ''
  })
  return `${CALENDLY_URL}?${params.toString()}`
}

function safeRequestedConnectorsRead () {
  try {
    return JSON.parse(window.localStorage.getItem(REQUESTED_CONNECTORS_KEY) || '{}')
  } catch {
    return {}
  }
}

function safeRequestedConnectorsWrite (requestedMap) {
  try {
    window.localStorage.setItem(REQUESTED_CONNECTORS_KEY, JSON.stringify(requestedMap))
  } catch {
    // ignore localStorage write issues in private/incognito modes
  }
}

export default function OtherConnectorModal ({ open, onClose }) {
  const { t } = useI18n()
  const dispatch = useDispatch()
  const workspaceId = useSelector(state => state.user.stream?.workspaceId || '')
  const [step, setStep] = useState('pickConnector')
  const [selectedConnector, setSelectedConnector] = useState('')
  const [customName, setCustomName] = useState('')
  const connectorLabel = useMemo(() => {
    return OTHER_CONNECTOR_OPTIONS.find(option => option.value === selectedConnector)?.label || selectedConnector
  }, [selectedConnector])
  const isCustom = selectedConnector === 'other'
  const requestedConnectorName = isCustom ? (customName.trim() || t('this connector')) : connectorLabel
  const confirmTitle = isCustom
    ? t('Thanks, {connector} is on our roadmap', { connector: requestedConnectorName })
    : t('{connector} is in our pilot list', { connector: connectorLabel })

  useEffect(() => {
    if (open) {
      track('OpenOtherConnectorModal')
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      setStep('pickConnector')
      setSelectedConnector('')
      setCustomName('')
      return
    }
    if (step === 'confirm' && selectedConnector) {
      const requested = safeRequestedConnectorsRead()
      const key = selectedConnector === 'other' ? `other:${customName.trim().toLowerCase()}` : selectedConnector
      if (requested[key]) {
        track('RequestConnectorAlreadyOnList', {
          connector: selectedConnector,
          custom: selectedConnector === 'other'
        })
      }
    }
  }, [open, step, selectedConnector, customName])

  const canProceed = selectedConnector && (!isCustom || customName.trim())
  const notifyLabel = requestedConnectorName

  const closeModal = () => {
    track('CloseOtherConnectorModal', { step })
    onClose()
  }

  const onNext = () => {
    track('RequestConnector', {
      connector: selectedConnector,
      custom: isCustom,
      ...(isCustom ? { customName: customName.trim() } : {})
    })
    setStep('confirm')
  }

  const onNotify = () => {
    const requested = safeRequestedConnectorsRead()
    const key = selectedConnector === 'other' ? `other:${customName.trim().toLowerCase()}` : selectedConnector
    requested[key] = true
    safeRequestedConnectorsWrite(requested)
    track('RequestConnectorNotify', {
      connector: selectedConnector,
      custom: isCustom
    })
    dispatch(success(t("Got it. We'll email you when {connector} is ready.", { connector: notifyLabel })))
    onClose()
  }

  const onBookCall = () => {
    track('RequestConnectorBookCall', {
      connector: selectedConnector,
      custom: isCustom
    })
    window.open(buildBookCallUrl(selectedConnector, workspaceId), '_blank', 'noopener,noreferrer')
  }

  return (
    <Modal
      title={step === 'pickConnector' ? t('Which database do you use?') : confirmTitle}
      open={open}
      onCancel={closeModal}
      footer={null}
      width={720}
      destroyOnClose
    >
      <div className={styles.body}>
        {step === 'pickConnector'
          ? (
            <>
              <p className={styles.subtitle}>
                {t("Pick the one you'd connect to Dekart. We're piloting new connectors with a small group of teams.")}
              </p>
              <Select
                showSearch
                placeholder={t('Search and pick a connector')}
                value={selectedConnector || undefined}
                onChange={setSelectedConnector}
                options={OTHER_CONNECTOR_OPTIONS}
                optionFilterProp='label'
                style={{ width: '100%' }}
              />
              {isCustom
                ? (
                  <Input
                    className={styles.customInput}
                    placeholder={t('Enter connector name')}
                    value={customName}
                    onChange={(event) => setCustomName(event.target.value)}
                  />
                  )
                : null}
              <div className={styles.actions}>
                <Button onClick={closeModal}>{t('Cancel')}</Button>
                <Button type='primary' disabled={!canProceed} onClick={onNext}>{t('Next')}</Button>
              </div>
            </>
            )
          : (
            <>
              <p>
                {isCustom
                  ? <>{t("Thanks for sharing. We'll notify you when {connector} is available for your workspace.", { connector: requestedConnectorName })}</>
                  : <>{t("We're rolling new connectors out to a small group of workspaces first. We'll notify you when {connector} is available for yours.", { connector: connectorLabel })}</>}
              </p>
              <p className={styles.hint}>
                {isCustom
                  ? <>{t('Need it sooner? Book a call and share your use case so we can prioritise it.')}</>
                  : <>{t('Want it sooner? Book a call and we can prioritise your workspace for the next batch.')}</>}
              </p>
              <div className={styles.actions}>
                <Button type='primary' onClick={onBookCall}>{t('Book a call')}</Button>
                <Button onClick={onNotify}>{t('Notify me')}</Button>
              </div>
            </>
            )}
      </div>
    </Modal>
  )
}
