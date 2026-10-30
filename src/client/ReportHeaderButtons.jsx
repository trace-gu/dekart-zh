import { useHistory } from 'react-router-dom/cjs/react-router-dom'
import styles from './ReportHeaderButtons.module.css'
import Button from 'antd/es/button'
import { EyeOutlined, DownloadOutlined, CloudOutlined, EditOutlined, ForkOutlined, ReloadOutlined, LoadingOutlined, CloudSyncOutlined, PlusOutlined, InfoCircleOutlined, ClockCircleOutlined, HistoryOutlined } from '@ant-design/icons'
import { useDispatch, useSelector } from 'react-redux'
import ShareButton from './ShareButton'
import { forkReport, saveMap, saveMapPreview, toggleReportEdit } from './actions/report'
import { runAllQueries } from './actions/query'
import { toggleModal } from '@kepler.gl/actions/dist/ui-state-actions'
import { EXPORT_DATA_ID, EXPORT_IMAGE_ID, EXPORT_MAP_ID } from '@kepler.gl/constants'
import Dropdown from 'antd/es/dropdown'
import { useEffect, useState } from 'react'
import Select from 'antd/es/select'
import Divider from 'antd/es/divider'
import { track } from './lib/tracking'
import { ForkOnboarding, useRequireOnboarding } from './ForkOnboarding'
import { AutoRefreshSettingsModal } from './AutoRefreshSettings'
import MapChangeHistoryModal from './MapChangeHistoryModal'
import classNames from 'classnames'
import { goToPresent, goToSource } from './lib/navigation'
import { toggleSnapshotModal } from './actions/snapshots'
import { useQueriesRunning } from './lib/useQueriesRunning'
import { useI18n } from './i18n'

function formatIntervalLabel (seconds, t) {
  if (seconds === 0) return t('None')
  if (seconds === 60) return t('1 min')
  if (seconds === 300) return t('5 min')
  if (seconds === 600) return t('10 min')
  if (seconds === 900) return t('15 min')
  if (seconds === 1800) return t('30 min')
  if (seconds === 3600) return t('1 hour')
  return t('{seconds}s', { seconds })
}

function ForkButton ({ primary }) {
  const { t } = useI18n()
  const dispatch = useDispatch()
  const { id: reportId } = useSelector(state => state.report)
  const userStream = useSelector(state => state.user.stream)
  const userIsPlayground = useSelector(state => state.user.isPlayground)
  const workspaceId = userStream?.workspaceId
  const { allowExport, canWrite } = useSelector(state => state.report)
  const isViewer = useSelector(state => state.user.isViewer)
  const readOnly = useSelector(state => state.workspace.readOnly)

  const disabled = isViewer || readOnly || (!allowExport && !canWrite)
  const disabledTitle = readOnly ? t('Workspace is read-only') : t('Forking maps is disabled for viewers')

  const history = useHistory()

  let onClick = () => {
    track('ForkReport', { reportId })
    dispatch(forkReport(reportId))
  }
  if (!workspaceId && !userIsPlayground) {
    // user has no workspace, redirect to workspace page
    onClick = () => {
      track('ForkReportNoWorkspace', { reportId })
      history.push('/workspace')
    }
  }

  if (primary) {
    if (disabled) {
      return null
    }
    return (
      <Button
        type='primary'
        icon={<ForkOutlined />}
        id='dekart-fork-button'
        disabled={disabled}
        title={disabled ? disabledTitle : t('Duplicate Map')}
        onClick={onClick}
      >{t('Duplicate Map')}
      </Button>
    )
  }
  return (
    <Button
      type='text'
      icon={<ForkOutlined />}
      disabled={disabled}
      onClick={onClick}
      id='dekart-fork-button'
      title={disabled ? disabledTitle : t('Duplicate Map')}
    />
  )
}

function RefreshButton ({ showAutoRefreshSettings = false }) {
  const { t } = useI18n()
  const { canRefresh } = useSelector(state => state.report)
  const readOnly = useSelector(state => state.workspace.readOnly)
  const queriesRunning = useQueriesRunning()
  const numQueries = useSelector(state => state.queries.length)
  const dispatch = useDispatch()
  const { canWrite } = useSelector(state => state.report)
  const edit = useSelector(state => state.reportStatus.edit)
  const [autoRefreshModalVisible, setAutoRefreshModalVisible] = useState(false)
  const autoRefreshIntervalSeconds = useSelector(state => state.report?.autoRefreshIntervalSeconds)
  if (!canRefresh || numQueries === 0) {
    return null
  }

  const handleRefresh = () => {
    track('RefreshAllQueries')
    dispatch(runAllQueries())
  }

  const items = [
    {
      label: t('Refresh Now'),
      key: 'refresh',
      id: 'dekart-refresh-now-button',
      icon: queriesRunning ? <LoadingOutlined /> : <ReloadOutlined />,
      disabled: queriesRunning || readOnly,
      onClick: handleRefresh
    },
    {
      type: 'divider'
    },
    {
      label: autoRefreshIntervalSeconds > 0
        ? edit
          ? t('Auto Refresh: {interval} (paused)', { interval: formatIntervalLabel(autoRefreshIntervalSeconds, t) })
          : t('Auto Refresh: {interval}', { interval: formatIntervalLabel(autoRefreshIntervalSeconds, t) })
        : t('Auto Refresh Settings'),
      key: 'auto-refresh',
      icon: <ClockCircleOutlined />,
      disabled: !canWrite || readOnly,
      onClick: () => setAutoRefreshModalVisible(true)
    }
  ]

  return (
    <>
      <Dropdown
        menu={{ items }}
        placement='bottomLeft'
        trigger={['click']}
      >
        <Button
          id='dekart-refresh-button'
          type='text'
          disabled={readOnly}
          icon={queriesRunning ? <LoadingOutlined /> : autoRefreshIntervalSeconds > 0 ? <span className={classNames({ [styles.shimmerIcon]: !edit })}><ClockCircleOutlined /></span> : <ReloadOutlined />}
          title={readOnly ? t('Workspace is read-only') : autoRefreshIntervalSeconds > 0 ? t('Refresh (Auto-refresh enabled)') : t('Refresh')}
        />
      </Dropdown>
      <AutoRefreshSettingsModal
        visible={autoRefreshModalVisible}
        onClose={() => setAutoRefreshModalVisible(false)}
      />
    </>
  )
}

function useReportChanged () {
  const { lastChanged, lastSaved } = useSelector(state => state.reportStatus)
  return lastChanged > lastSaved
}

function useMapViewChanged () {
  const { lastMapConfigChanged, lastPreviewSaved } = useSelector(state => state.reportStatus)
  return lastMapConfigChanged > lastPreviewSaved
}

function useAutoSave () {
  const { canWrite } = useSelector(state => state.report)
  const readOnly = useSelector(state => state.workspace.readOnly)
  const dispatch = useDispatch()
  const { saving, online, edit } = useSelector(state => state.reportStatus)
  const reportChanged = useReportChanged()
  const mapViewChanged = useMapViewChanged()
  const { exporting, dataUri } = useSelector(state => state.mapPreview)
  useEffect(() => {
    if (dataUri && !exporting && !readOnly) {
      dispatch(saveMapPreview(dataUri))
    }
  }, [dataUri, exporting, readOnly, dispatch])

  useEffect(() => {
    const handler = setTimeout(() => {
      if (edit && reportChanged && canWrite && !readOnly && !saving && online) {
        dispatch(saveMap(mapViewChanged))
      }
    }, 1000)

    return () => {
      clearTimeout(handler)
    }
  }, [canWrite, readOnly, saving, online, edit, dispatch, mapViewChanged, reportChanged])
}

function useRequireWorkspace () {
  const isCloud = useSelector(state => state.env.isCloud)
  const userStream = useSelector(state => state.user.stream)
  const workspaceId = userStream?.workspaceId
  return !workspaceId && isCloud && userStream
}

function WorkspaceOnboarding () {
  const { t } = useI18n()
  const history = useHistory()
  const isAnonymous = useSelector(state => state.user.isAnonymous)
  useEffect(() => {
    track('WorkspaceOnboarding')
  }, [])
  return (
    <div className={styles.reportHeaderButtons}>
      <div className={styles.hideOnMobile}>
        <Button
          type='text' icon={<InfoCircleOutlined />}
          href='https://dekart.xyz/?ref=about-maps-button'
          target='_blank'
          title={t('About this map')}
          onClick={() => {
            track('AboutDekartMaps')
          }}
        >{t('About this map')}
        </Button>
      </div>
      {!isAnonymous && (
        <Button
          icon={<PlusOutlined />}
          type='primary' onClick={() => {
            track('WorkspaceOnboardingCreateMap')
            history.push('/workspace')
          }}
        >{t('Create Map')}
        </Button>
      )}
    </div>
  )
}

function EditModeButtons () {
  const { t } = useI18n()
  const dispatch = useDispatch()
  const { canWrite } = useSelector(state => state.report)
  const { saving, mapConfigConflict } = useSelector(state => state.reportStatus)
  const widgetsConflict = useSelector(state => state.widgets.conflict)
  const readOnly = useSelector(state => state.workspace.readOnly)
  const changed = useReportChanged()
  const forkOnboarding = useRequireOnboarding()
  useAutoSave()

  return (
    <div className={styles.reportHeaderButtons}>
      <RefreshButton showAutoRefreshSettings />
      <ExportDropdown />
      {canWrite
        ? (
          <>
            <ForkButton />
            <Button
              id='dekart-save-button'
              title={readOnly ? t('Workspace is read-only') : mapConfigConflict || widgetsConflict ? t('Reload before saving') : saving ? t('Saving...') : t('Save this map')}
              type='text'
              ghost
              icon={saving || changed ? <CloudSyncOutlined /> : <CloudOutlined />}
              disabled={saving || readOnly || mapConfigConflict || widgetsConflict}
              onClick={() => {
                track('SaveMap')
                dispatch(saveMap())
              }}
            />
            <ViewSelect value='edit' />
            <ShareButton />
          </>
          )
        : (
          <>
            <ShareButton />
            {forkOnboarding ? <ForkOnboarding requireOnboarding={forkOnboarding} edit /> : <ForkButton primary />}
          </>
          )}

    </div>
  )
}

function ExportDropdown () {
  const { t } = useI18n()
  const dispatch = useDispatch()
  const { allowExport } = useSelector(state => state.report)

  const items = [
    {
      label: t('Export:'),
      disabled: true
    },
    {
      type: 'divider'
    },
    {
      label: t('Map'),
      onClick: () => {
        track('ExportMap')
        dispatch(toggleModal(EXPORT_MAP_ID))
      }
    },
    {
      label: t('Data'),
      onClick: () => {
        track('ExportData')
        dispatch(toggleModal(EXPORT_DATA_ID))
      }
    },
    {
      label: t('Image'),
      onClick: () => {
        track('ExportImage')
        dispatch(toggleModal(EXPORT_IMAGE_ID))
      }
    }
  ]
  return (
    <Dropdown menu={{ items }} placement='topLeft' disabled={!allowExport}>
      <Button
        type='text'
        title={allowExport ? t('Export') : t('Exporting is disabled')}
        icon={<DownloadOutlined />}
      />
    </Dropdown>
  )
}

// adds history option to the dropdown after divider
function ViewSelectDropdown ({ menu, onHistoryClick }) {
  const { t } = useI18n()
  return (
    <>
      {menu}
      <Divider style={{ margin: '4px 0' }} />
      <div
        className={styles.historyDropdownItem}
        onClick={onHistoryClick}
        onMouseDown={(e) => e.preventDefault()}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f5f5f5' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <HistoryOutlined /> {t('History')}
      </div>
    </>
  )
}

function ViewSelect ({ value }) {
  const { t } = useI18n()
  const dispatch = useDispatch()
  const history = useHistory()
  const { id } = useSelector(state => state.report)

  const handleChange = async (value) => {
    if (value === 'edit') {
      track('SwitchToEditMode', { reportId: id })
      goToSource(history, id)
    } else if (value === 'view') {
      const switched = await dispatch(toggleReportEdit(false))
      if (switched) {
        track('SwitchToViewMode', { reportId: id })
        goToPresent(history, id)
      }
    } else if (value === 'history') {
      track('OpenHistory', { reportId: id })
      dispatch(toggleSnapshotModal(true))
    }
  }

  const handleHistoryClick = () => {
    handleChange('history')
  }

  return (
    <>
      <Select
        ghost
        className={styles.reportViewSelect}
        value={value}
        onChange={handleChange}
        options={[
          { value: 'view', label: <><EyeOutlined /> {t('Viewing')}</> },
          { value: 'edit', label: <><EditOutlined /> {t('Editing')}</> }
        ]}
        dropdownRender={(menu) => (
        // add history option to the dropdown after divider
          <ViewSelectDropdown menu={menu} onHistoryClick={handleHistoryClick} />
        )}
      />
      <MapChangeHistoryModal />
    </>
  )
}

function ViewModeButtons () {
  const { canWrite } = useSelector(state => state.report)

  if (canWrite) {
    return (
      <div className={styles.reportHeaderButtons}>
        <RefreshButton showAutoRefreshSettings />
        <div className={styles.hideOnMobile}>
          <ExportDropdown />
          <ForkButton />
          <ViewSelect value='view' />
          <ShareButton />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.reportHeaderButtons}>
      <RefreshButton />
      <div className={styles.hideOnMobile}>
        <ExportDropdown />
      </div>
      <div className={styles.hideOnMobile}>
        <ShareButton />
      </div>
    </div>
  )
}

export default function ReportHeaderButtons ({ edit }) {
  const requireWorkspace = useRequireWorkspace()
  if (requireWorkspace) {
    return (
      <WorkspaceOnboarding />
    )
  }

  if (edit) {
    return <EditModeButtons />
  }
  return <ViewModeButtons />
}
