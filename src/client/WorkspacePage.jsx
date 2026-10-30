import { Header } from './Header'
import { Helmet } from 'react-helmet'
import styles from './WorkspacePage.module.css'
import Card from 'antd/es/card'
import Alert from 'antd/es/alert'
import { copyUrlToClipboard } from './actions/clipboard'
import Modal from 'antd/es/modal'
import { TeamOutlined, CreditCardOutlined, AppstoreTwoTone, KeyOutlined } from '@ant-design/icons'
import Title from 'antd/es/typography/Title'
import Button from 'antd/es/button'
import { useEffect, useState } from 'react'
import { createWorkspace, updateWorkspace, deleteWorkspace, redirectToCustomerPortal, respondToInvite } from './actions/workspace'
import { useDispatch, useSelector } from 'react-redux'
import { PlanType } from 'dekart-proto/dekart_pb'
import Table from 'antd/es/table'
import Input from 'antd/es/input'
import Onboarding from './Onboarding'
import Badge from 'antd/es/badge'
import Radio from 'antd/es/radio'
import Form from 'antd/es/form'
import SubscriptionTab from './SubscriptionTab'
import MembersTab from './MembersTab'
import Result from 'antd/es/result'
import { switchPlayground } from './actions/user'
import { useHistory } from 'react-router-dom/cjs/react-router-dom'
import { track } from './lib/tracking'
import Select from 'antd/es/select'
import { Loading } from './Loading'
import DeviceTokensTab from './DeviceTokensTab'
import WorkspaceReadOnlyBanner from './WorkspaceReadOnlyBanner'
import { t, useI18n } from './i18n'

function Invites () {
  const { t } = useI18n()
  const workspace = useSelector(state => state.workspace)
  const invites = workspace.invites
  const dispatch = useDispatch()
  return (
    <div className={styles.invites}>
      {invites.length === 0
        ? (
          <Onboarding
            icon={<TeamOutlined />}
            title={t('Awaiting an Invitation?')}
            steps={
              <ol>
                <li>{t('Ask a current member to send an invite to your email from the User Menu → Manage Workspace.')}</li>
                <li>{t("Once they've sent it, you'll be able to accept the invitation here.")}</li>
              </ol>
            }
          />
          )
        : (
          <div className={styles.inviteList}>
            <Table
              dataSource={invites}
              pagination={false}
              showHeader={false}
              columns={[
                {
                  key: 'invite',
                  className: styles.workspaceNameColumn,
                  render: (invite) => (
                    <>
                      <div className={styles.workspaceName}>{t('Join')} <i>{invite.workspaceName}</i></div>
                      <div className={styles.inviterEmail}>{t('invited by {email}', { email: invite.inviterEmail })}</div>
                    </>)
                },
                {
                  title: t('Actions'),
                  key: 'actions',
                  className: styles.inviteActionsColumn,
                  render: (invite) => (
                    <>
                      <Button
                        ghost
                        type='primary'
                        className={styles.acceptButton} onClick={() => {
                          track('AcceptWorkspaceInvite', { inviteId: invite.inviteId })
                          dispatch(respondToInvite(invite.inviteId, true))
                        }}
                      >{t('Accept')}
                      </Button>
                      <Button
                        type='danger'
                        ghost onClick={() => {
                          track('DeclineWorkspaceInvite', { inviteId: invite.inviteId })
                          dispatch(respondToInvite(invite.inviteId, false))
                        }}
                      >{t('Decline')}
                      </Button>
                    </>)
                }
              ]}
            />

          </div>)}

    </div>
  )
}

const publicDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'protonmail.com', 'zoho.com', 'yandex.com', 'mail.com', 'gmx.com', 'inbox.com', 'fastmail.com', 'tutanota.com', 'disroot.org', 'riseup.net', 'tuta.io', 'keemail.me', 'elude.in']
function suggestWorkspaceName (email) {
  // Validate the email format
  if (!email || !email.includes('@')) {
    return ''
  }

  // Split the email into user handler and domain
  const [, domain] = email.split('@')

  // Capitalize the first letter of a string for a nicer format
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1)

  // Check if the domain is public
  if (publicDomains.includes(domain)) {
    return 'Personal'
  }

  // If it's a private domain, assume it's a company
  const companyName = capitalize(domain.split('.')[0]) // Use the main part of the domain

  return companyName
}

function CreateWorkspaceForm () {
  const { t } = useI18n()
  const [disabled, setDisabled] = useState(false)
  const email = useSelector(state => state.user.stream?.email)
  const isCloud = useSelector(state => state.env.isCloud)
  const dispatch = useDispatch()
  const [form] = Form.useForm()
  useEffect(() => {
    form.setFieldsValue({ name: suggestWorkspaceName(email) })
  }, [email, form])

  return (
    <Card>
      <Form
        form={form}
        disabled={disabled}
        layout='vertical' onFinish={async (values) => {
          setDisabled(true)
          const trackingCalls = [track('CreateWorkspaceFormFinish')]
          if (values.source) {
            trackingCalls.push(track('CreateWorkspaceFormSource' + values.source))
          }
          if (values.source === 'Other' && values.sourceOther) {
            trackingCalls.push(track('CreateWorkspaceFormSourceOther', { sourceOther: values.sourceOther }))
          }
          await Promise.all(trackingCalls)
          dispatch(createWorkspace(values.name))
        }}
      >
        <Form.Item label={t('Workspace Name')} name='name' rules={[{ required: true, message: t('Workspace name is required') }]}>
          <Input placeholder={t('Workspace name')} />
        </Form.Item>
        {isCloud
          ? (
            <>
              <Form.Item
                label={t('Where did you first hear about Dekart?')}
                name='source'
                rules={[{ required: true, message: t('Please select a source') }]}
              >
                <Select
                  placeholder={t('Select a source')}
                  options={[
                    { value: 'GoogleSearch', label: t('Google Search') },
                    { value: 'Linked', label: t('LinkedIn Post') },
                    { value: 'LinkedInDM', label: t('LinkedIn DM') },
                    { value: 'ChatGPT', label: t('ChatGPT / AI Assistant') },
                    { value: 'ClaudeSkill', label: t('Claude/Codex Skill') },
                    { value: 'MattForrest', label: 'Matt Forrest' },
                    { value: 'Referral', label: t('Referral / Friend') },
                    { value: 'Other', label: t('Other') }
                  ]}
                />
              </Form.Item>
              <Form.Item noStyle shouldUpdate={(prev, cur) => prev.source !== cur.source}>
                {({ getFieldValue }) => getFieldValue('source') === 'Other'
                  ? (
                    <Form.Item
                      label={t('Please specify')}
                      name='sourceOther'
                      rules={[
                        { required: true, message: t('Please enter source details') },
                        { max: 120, message: t('Please keep it under 120 characters') }
                      ]}
                    >
                      <Input placeholder={t('How did you hear about Dekart?')} />
                    </Form.Item>
                    )
                  : null}
              </Form.Item>
            </>
            )
          : null}
        <Form.Item>
          <Button type='primary' htmlType='submit'>
            {t('Create Workspace')}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  )
}

const subscriptionPlanNames = {
  [PlanType.TYPE_TEAM]: 'Team',
  [PlanType.TYPE_GROW]: 'Grow',
  [PlanType.TYPE_MAX]: 'Max',
  [PlanType.TYPE_TRIAL]: 'Trial'
}

// The server checks permissions and billing again when the confirmed command arrives.
function DeleteWorkspaceSection () {
  const { t } = useI18n()
  const workspace = useSelector(state => state.workspace)
  const isCloud = useSelector(state => state.env.isCloud)
  const isAdmin = useSelector(state => state.user.isAdmin)
  const isDefault = useSelector(state => state.user.isDefaultWorkspace)
  const dispatch = useDispatch()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const requiresCancellation = Boolean(workspace.subscription?.stripeSubscriptionId) && !workspace.subscription.cancelAt
  if (!isCloud || !isAdmin || isDefault) return null
  return (
    <Card title={t('Danger zone')} className={styles.dangerZone}>
      <div className={styles.deleteWorkspaceRow}>
        <div className={styles.deleteWorkspaceDescription}>
          <div className={styles.deleteWorkspaceTitle}>{t('Delete workspace')}</div>
          <div className={styles.secondaryText}>
            {t('Permanently delete this workspace, its maps, data and connections. This cannot be undone.')}
          </div>
        </div>
        <Button
          danger
          disabled={requiresCancellation}
          onClick={() => {
            setName('')
            setOpen(true)
          }}
        >
          {t('Delete workspace')}
        </Button>
      </div>
      {requiresCancellation && (
        <Alert
          className={styles.subscriptionWarning}
          type='warning'
          message={t('Active {plan} subscription', { plan: t(subscriptionPlanNames[workspace.subscription.planType]) })}
          description={t('Cancel your subscription before deleting this workspace.')}
          action={<Button onClick={() => dispatch(redirectToCustomerPortal())}>{t('Manage subscription')}</Button>}
        />
      )}
      <Modal
        title={t('Delete workspace')}
        open={open}
        onCancel={() => setOpen(false)}
        okText={t('Delete')}
        okButtonProps={{ danger: true, disabled: name !== workspace.name }}
        onOk={() => dispatch(deleteWorkspace(workspace.id))}
      >
        <p>{t('Type {name} to permanently delete this workspace.', { name: workspace.name })}</p>
        <Input aria-label={t('Workspace name to delete')} value={name} onChange={e => setName(e.target.value)} />
      </Modal>
    </Card>
  )
}

function UpdateWorkspaceForm () {
  const { t } = useI18n()
  const workspace = useSelector(state => state.workspace)
  const isAdmin = useSelector(state => state.user.isAdmin)
  const [disabled, setDisabled] = useState(!isAdmin)
  const [form] = Form.useForm()
  const name = Form.useWatch('name', form)
  const dispatch = useDispatch()
  useEffect(() => {
    setDisabled(!isAdmin)
  }, [workspace, isAdmin])
  return (
    <Card title={t('General')}>
      <Form
        form={form}
        className={styles.generalForm}
        disabled={disabled}
        initialValues={{ name: workspace.name }}
        layout='vertical'
        onFinish={(values) => {
          track('UpdateWorkspace')
          setDisabled(true)
          dispatch(updateWorkspace(values.name))
        }}
      >
        <Form.Item
          name='name'
          label={t('Workspace name')}
          rules={[{ required: true, whitespace: true, message: t('Workspace name is required') }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          label={t('Workspace ID')}
          htmlFor='workspaceIDReadOnly'
          extra={t('Used to reference this workspace in API calls and support requests.')}
        >
          <Input.Group compact className={styles.workspaceId}>
            <Input
              id='workspaceIDReadOnly'
              aria-label={t('Workspace ID')}
              value={workspace.id}
              readOnly
              disabled={false}
            />
            <Button
              disabled={false}
              onClick={() => dispatch(copyUrlToClipboard(workspace.id, t('Workspace ID copied')))}
            >
              {t('Copy')}
            </Button>
          </Input.Group>
        </Form.Item>
        <Button
          type='primary'
          htmlType='submit'
          disabled={disabled || !name?.trim() || name === workspace.name}
        >
          {t('Save changes')}
        </Button>
      </Form>
    </Card>
  )
}

function WorkspaceTab ({ nextStep, setNextStep, isCreatingAdditionalWorkspace }) {
  const { t } = useI18n()
  const userStream = useSelector(state => state.user.stream)
  const workspace = useSelector(state => state.workspace)
  const invites = workspace.invites
  if (userStream.workspaceId && userStream.workspaceId !== workspace.id) {
    return null
  }
  let form = workspace.id && !isCreatingAdditionalWorkspace ? <UpdateWorkspaceForm /> : <CreateWorkspaceForm />
  if (nextStep === 'invites') {
    form = <Invites />
  }

  let title = t('Create workspace')
  if (nextStep === 'invites') {
    title = t('Join workspace')
  } else if (workspace.id && !isCreatingAdditionalWorkspace) {
    title = null
  }

  return (
    <div className={styles.workspaceTab}>
      <div className={styles.workspaceTabHeader}>
        {title ? <Title level={4}>{title}</Title> : null}
        {userStream.workspaceId && invites.length === 0 // user is in workspace and has no invites
          ? null
          : (
            <div><Radio.Group
              value={nextStep || 'workspace'}
              onChange={(e) => setNextStep(e.target.value)}
              options={[
                { label: userStream.workspaceId ? t('Edit') : t('Create'), value: 'workspace' },
                { label: <Badge color='blue' count={invites.length} offset={[14, -10]}><span className={styles.joinRadioItem}>{t('Join')}</span></Badge>, value: 'invites' }
              ]}
              optionType='button'
              buttonStyle='solid'
                 />
            </div>
            )}
      </div>
      {/* REVIEW: Deletion is offered only while managing an existing workspace. */}
      <div className={styles.workspaceTabBody}>{form}{workspace.id && !isCreatingAdditionalWorkspace && nextStep !== 'invites' && <DeleteWorkspaceSection />}</div>

    </div>
  )
}

function getMembersSubTitle (addedUsersCount, planType) {
  if (planType === PlanType.TYPE_TEAM) {
    return t('({count} of 20)', { count: addedUsersCount })
  }
  return ''
}

export function Workspace ({ nextStep, setNextStep, stepId, isCreatingAdditionalWorkspace }) {
  const { t } = useI18n()
  const userStream = useSelector(state => state.user.stream)
  const isSelfHosted = useSelector(state => state.user.isSelfHosted)
  const addedUsersCount = useSelector(state => state.workspace.addedUsersCount)
  const workspaceId = userStream?.workspaceId
  const planType = userStream?.planType
  const step = stepId || 'workspace'
  const history = useHistory()
  // step is derived from URL via props; no local state needed

  if (!userStream) {
    return null
  }
  return (
    <div className={styles.workspace}>
      {
        workspaceId && !isCreatingAdditionalWorkspace
          ? (
            <div className={styles.workspaceSteps}>
              <Radio.Group
                value={step}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === 'plan') {
                    history.push('/workspace/plan')
                  } else if (v === 'members') {
                    history.push('/workspace/members')
                  } else if (v === 'tokens') {
                    history.push('/workspace/tokens')
                  } else {
                    history.push('/workspace')
                  }
                }}
                className={styles.radioCentered}
              >
                <Radio.Button value='workspace'>
                  <AppstoreTwoTone /> {t('Workspace')}
                </Radio.Button>
                {!isSelfHosted
                  ? (
                    <Radio.Button value='plan' disabled={!userStream.workspaceId}>
                      <CreditCardOutlined /> {t('Plan')}
                    </Radio.Button>
                    )
                  : null}
                <Radio.Button value='members'>
                  <Badge color='blue' count={getMembersSubTitle(addedUsersCount, planType) ? undefined : 0} style={{ display: 'none' }}>
                    {/* keep layout consistent without visible badge when not needed */}
                    <TeamOutlined /> {t('Members')} {getMembersSubTitle(addedUsersCount, planType)}
                  </Badge>
                </Radio.Button>
                <Radio.Button value='tokens'>
                  <KeyOutlined /> {t('Tokens')}
                </Radio.Button>
              </Radio.Group>
            </div>
            )
          : null
      }

      {
        step === 'workspace'
          ? <WorkspaceTab nextStep={nextStep} setNextStep={setNextStep} isCreatingAdditionalWorkspace={isCreatingAdditionalWorkspace} />
          : step === 'plan'
            ? (!isSelfHosted ? <SubscriptionTab /> : <MembersTab />)
            : step === 'members'
              ? <MembersTab />
              : <DeviceTokensTab />
      }
    </div>
  )
}

function WelcomeScreen ({ setNextStep }) {
  const { t } = useI18n()
  const history = useHistory()
  const workspace = useSelector(state => state.workspace)
  const invites = workspace.invites
  useEffect(() => {
    track('WelcomeScreen')
  }, [])
  return (
    <Result
      status='success'
      icon={<span className={styles.rocketIcon} />}
      title={t('Start Mapping in Seconds')}
      subTitle={t('Set up a secure space to connect your data, and share live maps with your team.')}
      extra={(
        <>
          <Button
            id='dekart-create-workspace'
            type='primary' key='1' disabled={invites.length > 0} onClick={() => {
              track('CreateWorkspace')
              history.push('/workspace/create')
            }}
          >
            {t('Create Workspace')}
          </Button>
          <Button
            key='2'
            onClick={() => {
              track('JoinExistingWorkspaceButton')
              setNextStep('invites')
            }}
          >
            <Badge color='blue' count={invites.length} offset={[14, -10]}>{t('Join Existing Workspace')}</Badge>
          </Button>
          <div className={styles.notSure}>
            <div className={styles.notSureItems}>
              <div>{t('→ Connect Instantly to BigQuery and Snowflake')}</div>
              <div>{t('→ Create Your First Map in 30 Seconds')}</div>
              <div>{t('→ No credit card required.')}</div>
            </div>
            <Button ghost type='primary' href='https://dekart.xyz/docs/about/screencast/' target='_blank' onClick={() => track('WatchWalkthrough')}>{t('🎬 Watch a 40-Second Walkthrough')}</Button>
          </div>
        </>
      )}
    />
  )
}

function getWorkspacePageTitle (step) {
  if (step === 'plan') {
    return 'Workspace Plan'
  }
  if (step === 'members') {
    return 'Workspace Members'
  }
  if (step === 'tokens') {
    return 'Workspace Tokens'
  }
  return 'Workspace'
}

export default function WorkspacePage ({ step, onboarding }) {
  const { t } = useI18n()
  const userStream = useSelector(state => state.user.stream)
  const workspaceId = userStream?.workspaceId
  const initialNextStep = onboarding === 'join' ? 'invites' : onboarding === 'create' ? 'workspace' : null
  const [nextStep, setNextStep] = useState(initialNextStep)
  const isPlayground = useSelector(state => state.user.isPlayground)
  const isAnonymous = useSelector(state => state.user.isAnonymous)
  const env = useSelector(state => state.env)
  const readOnly = useSelector(state => state.workspace.readOnly)
  const isCreatingAdditionalWorkspace = onboarding === 'create' && Boolean(workspaceId) && !env.isCloud && Boolean(env.variables.ALLOW_WORKSPACE_CREATION) && !readOnly
  const dispatch = useDispatch()
  useEffect(() => {
    if (isPlayground) {
      dispatch(switchPlayground(false, '/workspace'))
    }
  }, [isPlayground, dispatch])

  useEffect(() => {
    if (workspaceId) {
      return
    }
    if (onboarding === 'join') {
      setNextStep('invites')
    } else if (onboarding === 'create') {
      setNextStep('workspace')
    }
  }, [workspaceId, onboarding])

  if (isPlayground) {
    return null
  }
  if (isAnonymous) {
    return <Loading />
  }

  return (
    <div className={styles.workspacePage}>
      <Helmet>
        <title>{t(getWorkspacePageTitle(step))} — Dekart</title>
      </Helmet>
      <Header />
      {userStream
        ? (
          <div className={styles.body}>
            {workspaceId || nextStep ? <Workspace nextStep={nextStep} setNextStep={setNextStep} stepId={step} isCreatingAdditionalWorkspace={isCreatingAdditionalWorkspace} /> : <WelcomeScreen setNextStep={setNextStep} />}
          </div>
          )
        : null}
      {!(step === 'workspace' && nextStep === 'invites') && <WorkspaceReadOnlyBanner />}
    </div>
  )
}
