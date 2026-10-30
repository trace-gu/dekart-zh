import React, { useLayoutEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { removeFilter } from '@kepler.gl/actions'
import { Filter, Plus, X, ChevronDown } from 'lucide-react'
import styles from './FilterStrip.module.css'
import { useI18n } from '../i18n'

function filterLabel (filter, t) {
  if (filter.type === 'polygon') return t('Map area')
  // Use one field label for a filter shared by several datasets; the tooltip lists every bound field.
  return (filter.name.find(Boolean) || '').replaceAll('_', ' ')
}

// Show bound layer labels in the map area tooltip so users can identify its scope.
function filterDescription (filter, datasets, layers, t) {
  if (filter.type === 'polygon') {
    const labels = (filter.layerId || []).map(id => layers.find(layer => layer.id === id)?.config.label).filter(Boolean).join(', ')
    return labels ? `${t('Map area')} · ${labels}` : t('Map area')
  }
  const pairs = filter.dataId.map((id, index) => `${datasets[id]?.label || id}: ${filter.name[index]}`).join(', ')
  return `${pairs} · ${JSON.stringify(filter.value)}`
}

// One shared filter surface; Kepler remains the owner of filter values and persistence.
export default function FilterStrip ({ visible, editing, disabled, onEdit, onApply }) {
  const { t } = useI18n()
  const dispatch = useDispatch()
  const filters = useSelector(state => state.keplerGl.kepler?.visState.filters || [])
  const datasets = useSelector(state => state.keplerGl.kepler?.visState.datasets || {})
  const layers = useSelector(state => state.keplerGl.kepler?.visState.layers || [])
  const ref = useRef(null)
  useLayoutEffect(() => {
    const element = ref.current
    const parent = element.parentElement
    const resize = () => parent.style.setProperty('--filter-strip-height', `${element.getBoundingClientRect().height}px`)
    const observer = new window.ResizeObserver(resize)
    observer.observe(element)
    resize()
    return () => { observer.disconnect(); parent.style.removeProperty('--filter-strip-height') }
  }, [])
  const entries = filters.map((filter, index) => ({ filter, index })).filter(({ filter }) => filter.type === 'polygon' || filter.name?.some(Boolean))
  const chip = ({ filter, index }) => (
    <span className={styles.chip} key={filter.id}>
      <button className={styles.name} title={filterDescription(filter, datasets, layers, t)} onClick={() => onEdit(index)} disabled={!editing || disabled}>{filterLabel(filter, t)}{filter.type !== 'polygon' && filter.dataId.length > 1 && <span className={styles.count}> · {t('{count} datasets', { count: filter.dataId.length })}</span>}</button>
      <button className={styles.remove} aria-label={t('Remove {filter} filter', { filter: filterLabel(filter, t) })} disabled={disabled} onClick={() => onApply(() => dispatch(removeFilter(index)))}><X size={11} /></button>
    </span>
  )
  return (
    <div ref={ref} className={styles.strip} style={{ display: visible ? undefined : 'none' }} data-testid='filter-strip' aria-label={t('Map and chart filters')}>
      <Filter size={13} className={styles.icon} />
      {entries.length > 0 && (
        <>
          <div className={styles.chips} data-count={entries.length}>
            {(entries.length > 4 ? entries.slice(0, 2) : entries).map(chip)}
            {entries.length > 4 && <details className={styles.overflow}><summary>{t('+{count} more', { count: entries.length - 2 })}<ChevronDown size={11} /></summary><div className={styles.menu}>{entries.slice(2).map(chip)}</div></details>}
            {editing && <button className={styles.add} aria-label={t('Add filter')} disabled={disabled} onClick={() => onEdit()}><Plus size={13} /></button>}
          </div>
          <button className={styles.clear} disabled={disabled} onClick={() => onApply(() => filters.map((_, index) => index).reverse().forEach(index => dispatch(removeFilter(index))))}>{t('Clear all')}</button>
        </>
      )}
      {!entries.length && <><span className={styles.empty}>{t('No filters')}</span>{editing && <button className={styles.clear} disabled={disabled} onClick={() => onEdit()}><Plus size={12} />{t('Add filter')}</button>}</>}
    </div>
  )
}
