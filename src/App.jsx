import { useEffect, useState } from 'react'
import './App.css'

const API_URL = '/samsung' // vite proxy → http://localhost:8000/samsung

// 응답 형식이 달라도 [{...}, {...}] 형태의 행 배열로 변환
function toRows(json) {
  if (Array.isArray(json)) return json
  if (json && Array.isArray(json.data)) return json.data
  if (json && typeof json === 'object') {
    const values = Object.values(json)
    // pandas df.to_dict() 형식: { Close: { '2026-01-01': 100, ... }, ... }
    if (values.length && values.every((v) => v && typeof v === 'object' && !Array.isArray(v))) {
      const index = Object.keys(values[0])
      return index.map((idx) => {
        const row = { Date: idx }
        for (const [col, series] of Object.entries(json)) row[col] = series[idx]
        return row
      })
    }
    return [json]
  }
  return []
}

const findKey = (keys, re) => keys.find((k) => re.test(k))

function formatCell(value) {
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 4 })
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10)
  return String(value ?? '')
}

function PriceChart({ rows, dateKey, closeKey }) {
  const points = rows
    .map((r) => ({ d: r[dateKey], v: Number(r[closeKey]) }))
    .filter((p) => !Number.isNaN(p.v))
  if (points.length < 2) return null

  const W = 800
  const H = 260
  const P = 40
  const min = Math.min(...points.map((p) => p.v))
  const max = Math.max(...points.map((p) => p.v))
  const range = max - min || 1
  const x = (i) => P + (i * (W - P * 2)) / (points.length - 1)
  const y = (v) => H - P - ((v - min) / range) * (H - P * 2)
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.v)}`).join(' ')
  const up = points.at(-1).v >= points[0].v

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="chart" role="img" aria-label="종가 추이">
      <text x={P} y={y(max) - 8} className="axis">{max.toLocaleString()}</text>
      <text x={P} y={y(min) + 20} className="axis">{min.toLocaleString()}</text>
      <line x1={P} x2={W - P} y1={y(max)} y2={y(max)} className="grid" />
      <line x1={P} x2={W - P} y1={y(min)} y2={y(min)} className="grid" />
      <path d={path} className={up ? 'line up' : 'line down'} />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.v)} r="3" className={up ? 'dot up' : 'dot down'}>
          <title>{`${formatCell(p.d)}: ${p.v.toLocaleString()}`}</title>
        </circle>
      ))}
    </svg>
  )
}

function App() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async (signal) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(API_URL, { signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setRows(toRows(await res.json()))
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    load(controller.signal)
    return () => controller.abort()
  }, [])

  const columns = rows.length ? Object.keys(rows[0]) : []
  const dateKey = findKey(columns, /date|일자|날짜|index/i) ?? columns[0]
  const closeKey = findKey(columns, /^close$|종가/i)

  return (
    <main className="stock">
      <header>
        <h1>삼성전자 최근 30일</h1>
        <button type="button" onClick={() => load()} disabled={loading}>
          {loading ? '불러오는 중…' : '새로고침'}
        </button>
      </header>

      {error && <p className="error">데이터를 불러오지 못했습니다: {error}</p>}

      {!error && !loading && rows.length === 0 && <p>데이터가 없습니다.</p>}

      {rows.length > 0 && (
        <>
          {closeKey && <PriceChart rows={rows} dateKey={dateKey} closeKey={closeKey} />}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c} className={typeof row[c] === 'number' ? 'num' : ''}>
                        {formatCell(row[c])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  )
}

export default App
