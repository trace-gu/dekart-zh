import Menu from 'antd/es/menu'
import styles from './DekartMenu.module.css'
import { useDispatch, useSelector } from 'react-redux'
import { getUrlRef } from './lib/ref'
import { MenuOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom/cjs/react-router-dom'
import { createReport } from './actions/report'
import Tooltip from 'antd/es/tooltip'
import { track } from './lib/tracking'
import { ConnectionType } from 'dekart-proto/dekart_pb'
import { useI18n } from './i18n'

const popupOffset = [-10, 0]

export default function DekartMenu () {
  const { t } = useI18n()
  const env = useSelector(state => state.env)
  const usage = useSelector(state => state.usage)
  const connections = useSelector(state => state.connection.list)
  const userDefinedConnection = useSelector(state => state.connection.userDefined)
  const dispatch = useDispatch()
  const { authEnabled } = env
  const isPlayground = useSelector(state => state.user.isPlayground)
  const isSnowpark = useSelector(state => state.env.isSnowpark)
  const isViewer = useSelector(state => state.user.isViewer)
  const readOnly = useSelector(state => state.workspace.readOnly)
  const isBigQueryDatasource = env.variables.DATASOURCE === 'BQ'
  const hasBigQueryConnection = connections.some(connection => connection.connectionType === ConnectionType.CONNECTION_TYPE_BIGQUERY)
  const showBigQueryOvertureSkill = isBigQueryDatasource || hasBigQueryConnection
  const ref = getUrlRef(env, usage)
  return (
    <div className={styles.dekartMenu}>
      <Menu mode='horizontal' theme='dark'>
        <Menu.SubMenu
          id='dekart-main-menu'
          popupOffset={popupOffset}
          popupClassName={styles.subMenu} title={<MenuOutlined />} key='home' active='yes'
        >
          {authEnabled
            ? (
              <>
                <Menu.Item key='my' onClick={() => track('NavigateToMyMaps')}>
                  <Link to='/'>{t('My Maps')}</Link>
                </Menu.Item>
                <Menu.Item key='shared' disabled={isPlayground} onClick={() => track('NavigateToSharedMaps')}>
                  <Link to='/shared'>{t('Shared Maps')}</Link>
                </Menu.Item>
              </>
              )
            : (
              <>
                <Menu.Item key='reports' onClick={() => track('NavigateToMaps')}>
                  <Link to='/'>{t('Maps')}</Link>
                </Menu.Item>
                <Menu.Item key='shared-disabled' disabled>
                  <span>{t('Shared Maps')}</span>
                </Menu.Item>
              </>
              )}
          {userDefinedConnection
            ? (
              <Menu.Item key='connections' onClick={() => track('NavigateToConnections')}>
                <Link to='/connections'>{t('Connections')}</Link>
              </Menu.Item>
              )
            : null}
          <Menu.Item
            key='create'
            disabled={isViewer || readOnly}
            onClick={() => {
              track('CreateNewMap')
              dispatch(createReport())
            }}
          >
            {t('New Map')}
          </Menu.Item>
          <Menu.Divider />
          {isSnowpark && (
            <Menu.Item key='snowflake-kepler-gl-examples' onClick={() => track('ClickedSnowflakeKeplerGlExamples')}>
              <a target='_blank' rel='noopener noreferrer' href={'https://dekart.xyz/docs/snowflake-snowpark/about/?ref=' + ref}>{t('Configure Access')}</a>
            </Menu.Item>
          )}
          {!isSnowpark && showBigQueryOvertureSkill && (
            <Menu.Item key='bigquery-overture-skill' onClick={() => track('ClickedClaudeSkill')}>
              <a target='_blank' rel='noopener noreferrer' href='https://github.com/dekart-xyz/geosql'>{t('Claude Skill')}</a>
            </Menu.Item>
          )}
          <Menu.Item key='examples' onClick={() => track('ClickedMapExamples')}>
            <a
              target='_blank' rel='noopener noreferrer' href={
              isSnowpark ? 'https://dekart.xyz/docs/about/snowflake-kepler-gl-examples/?ref=' + ref : 'https://dekart.xyz/docs/about/kepler-gl-map-examples?ref=' + ref
            }
            >{t('Map Examples')}
            </a>
          </Menu.Item>
          <Menu.Item key='slack' onClick={() => track('ClickedAskInSlack')}>
            <a target='_blank' rel='noopener noreferrer' href='https://slack.dekart.xyz'>{t('Slack Support')}</a>
          </Menu.Item>
        </Menu.SubMenu>
        {
          !isSnowpark && (
            <Menu.Item key='contribute' onClick={() => track('ClickedGitHubStar')}>
              <Tooltip color='#328EB2' title={<>{t('Loving Dekart?')}<br />{t('Help community find it.')}<br />{t('Give us ⭐️ on GitHub!')}</>}><a target='_blank' rel='noopener noreferrer' href='https://github.com/dekart-xyz/dekart'>🩵</a></Tooltip>
            </Menu.Item>
          )
        }
      </Menu>
    </div>
  )
}
