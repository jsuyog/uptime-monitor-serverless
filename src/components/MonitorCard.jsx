import React, { useState } from 'react'
import { latencyColor, sslStatus } from '../utils/api'
import SparklineChart from './SparklineChart'
import PingLog from './PingLog'
import clsx from 'clsx'

export default function MonitorCard({ monitor, onRemove, onToggle, onClear, onExport }) {
  const [expanded, setExpanded] = useState(false)

  const { url, location, status, pings, ssl, active, lastPing } = monitor

  // Compute stats from last 30 min
  const now = Date.now()
  const recent = pings.filter(p => p.time > now - 30 * 60 * 1000)
  const total   = recent.length
  const success = recent.filter(p => p.status === 'Success').length
  const uptime  = total ? ((success / total) * 100).toFixed(1) : null
  const latencies = recent.map(p => p.latency).filter(v => v != null)
  const avgLat = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : null
  const minLat = latencies.length ? Math.min(...latencies) : null
  const maxLat = latencies.length ? Math.max(...latencies) : null

  const ssl_ = ssl ? sslStatus(ssl) : null

  const hostname = (() => {
    try { return new URL(url).hostname } catch { return url }
  })()

  const statusColor = {
    up:      'bg-emerald-500',
    down:    'bg-red-500',
    pending: 'bg-gray-300',
  }[status]

  const cardBorder = {
    up:      'border-gray-100',
    down:    'border-red-200',
    pending: 'border-gray-100',
  }[status]

  return (
    <div className={clsx('card border transition-all duration-300 animate-slide-up overflow-hidden', cardBorder)}>
      {/* Top stripe for down state */}
      {status === 'down' && (
        <div className="h-0.5 bg-red-400 w-full" />
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Live dot */}
            <span className={clsx(
              'w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5',
              statusColor,
              active && status === 'up' && 'animate-pulse-dot'
            )} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{hostname}</p>
              <p className="text-xs text-gray-400 font-mono truncate">{url}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {ssl_ && (
              <span className={ssl_.cls}>
                {ssl_.icon} SSL {ssl_.label}
              </span>
            )}
            <button
              onClick={onToggle}
              className="btn-ghost px-2.5 py-1 text-xs"
              title={active ? 'Pause' : 'Resume'}
            >
              {active ? '⏸' : '▶'}
            </button>
            <button
              onClick={onExport}
              className="btn-ghost px-2.5 py-1 text-xs"
              title="Export CSV"
            >
              ⬇
            </button>
            <button
              onClick={onRemove}
              className="btn-ghost px-2.5 py-1 text-xs text-red-400 hover:text-red-600 hover:bg-red-50"
              title="Remove"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Metrics row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Metric label="Uptime"   value={uptime != null ? `${uptime}%` : '—'}   color={uptime > 99 ? 'text-emerald-600' : uptime > 95 ? 'text-amber-500' : 'text-red-500'} />
          <Metric label="Avg"      value={avgLat != null ? `${avgLat}ms` : '—'}  color={latencyColor(avgLat)} />
          <Metric label="Min"      value={minLat != null ? `${minLat}ms` : '—'}  color="text-emerald-600" />
          <Metric label="Max"      value={maxLat != null ? `${maxLat}ms` : '—'}  color="text-amber-500" />
        </div>

        {/* Status + location row */}
        <div className="flex items-center gap-2 mb-3">
          <span className={status === 'up' ? 'badge-up' : status === 'down' ? 'badge-down' : 'badge bg-gray-100 text-gray-500'}>
            {status === 'up' ? '● Up' : status === 'down' ? '● Down' : '○ Pending'}
          </span>
          <span className="badge bg-gray-50 text-gray-500">{location}</span>
          {!active && <span className="badge bg-amber-50 text-amber-600">Paused</span>}
          {lastPing?.code && (
            <span className="badge bg-gray-50 text-gray-500 font-mono">HTTP {lastPing.code}</span>
          )}
        </div>

        {/* Sparkline */}
        <SparklineChart pings={pings} />

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
        >
          {expanded ? '▲ Hide details' : '▼ Show details'}
        </button>
      </div>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-gray-50 px-5 pb-5 pt-4 animate-fade-in">
          <PingLog pings={pings} ssl={ssl} />
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, color = 'text-gray-700' }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={clsx('text-sm font-semibold font-mono', color)}>{value}</p>
    </div>
  )
}
