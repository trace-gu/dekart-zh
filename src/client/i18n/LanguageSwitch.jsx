import React from 'react'
import Dropdown from 'antd/es/dropdown'
import Button from 'antd/es/button'
import { GlobalOutlined } from '@ant-design/icons'
import { LOCALES, useI18n } from './index'

export default function LanguageSwitch () {
  const { locale, setLocale } = useI18n()
  const items = LOCALES.map(({ code, label }) => ({
    key: code,
    label,
    disabled: code === locale
  }))
  const current = LOCALES.find(item => item.code === locale) || LOCALES[0]
  return (
    <Dropdown menu={{ items, onClick: ({ key }) => setLocale(key) }}>
      <Button id='dekart-language-switch' type='text' size='small'>
        <GlobalOutlined /> {current.label}
      </Button>
    </Dropdown>
  )
}
