// REVIEW!: Server validation errors leave the save promise pending and the form loading until it is reopened.
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { ConnectionType } from 'dekart-proto/dekart_pb'
import Form from 'antd/es/form'
import Input from 'antd/es/input'
import Modal from 'antd/es/modal'
import Button from 'antd/es/button'
import Space from 'antd/es/space'
import { archiveConnection, closeConnectionDialog, saveConnection } from './actions/connection'
import { useI18n } from './i18n'

// Header rows exist only during creation; saved credentials remain on the server.
export default function HTTPConnectionModal ({ form }) {
  const { t } = useI18n()
  const { id, loading } = useSelector(state => state.connection.dialog)
  const isAdmin = useSelector(state => state.user.isAdmin)
  const dispatch = useDispatch()

  useEffect(() => {
    if (!id) {
      form.resetFields()
      form.setFieldsValue({ connectionName: 'HTTP source', httpHeaderRows: [] })
    }
  }, [id, form])

  return (
    <Modal
      open
      title={t('HTTP source')}
      onCancel={() => dispatch(closeConnectionDialog())}
      footer={[
        <Button
          key='archive'
          disabled={!id || !isAdmin || loading}
          onClick={() => dispatch(archiveConnection(id))}
        >{t('Archive')}
        </Button>,
        <Button
          key='save'
          id='saveConnection'
          type='primary'
          disabled={!isAdmin || loading}
          loading={loading}
          onClick={() => form.submit()}
        >{t('Save')}
        </Button>
      ]}
    >
      <p>{t('Shared with your workspace like a warehouse connection. Reports that use it publish a copy of the fetched data.')}</p>
      <Form
        form={form}
        layout='vertical'
        disabled={!isAdmin || loading}
        onFinish={values => dispatch(saveConnection(id, ConnectionType.CONNECTION_TYPE_HTTP, values))}
      >
        <Form.Item label={t('Connection name')} name='connectionName' rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item label={t('Base URL')} name='httpBaseUrl' rules={[{ required: true }]}>
          <Input placeholder='https://api.example.com/data/' />
        </Form.Item>
        <Form.Item label={t('Docs URL')} name='httpDocsUrl'>
          <Input placeholder='https://example.com/docs' />
        </Form.Item>
        {id
          ? <p>{t('Headers are hidden and cannot be edited after saving.')}</p>
          : (
            <Form.List name='httpHeaderRows'>
              {(fields, { add, remove }) => (
                <>
                  {fields.map(field => (
                    <Space key={field.key} align='baseline'>
                      <Form.Item name={[field.name, 'name']} rules={[{ required: true }]}>
                        <Input placeholder={t('Header name')} />
                      </Form.Item>
                      <Form.Item name={[field.name, 'value']} rules={[{ required: true }]}>
                        <Input.Password placeholder={t('Header value')} />
                      </Form.Item>
                      <Button onClick={() => remove(field.name)}>{t('Remove')}</Button>
                    </Space>
                  ))}
                  <Button onClick={() => add()}>{t('Add header')}</Button>
                </>
              )}
            </Form.List>
            )}
      </Form>
    </Modal>
  )
}
