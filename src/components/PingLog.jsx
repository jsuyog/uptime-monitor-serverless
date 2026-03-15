import React from 'react'
import { latencyColor } from '../utils/api'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts'

export default function PingLog({ pings, ssl }) {
  if (!pings || pings.length === 0) {
    return <p className="text-sm text-gray-400 py-4 text-center">No ping data yet.</p>
  }

  const chartData = [...pings].slice(-60).map(p => ({
    time:    new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    latency: p.latency ?? null,
    failed:  p.status !== 'Success',
  }))

  return (
    <div className="space-y-5">
      {/* Full chart */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
          Response time — last {Math.min(pings.length, 60)} pings
        </p>
        <ResponsiveContainer width="100%" height={140}>
          <LineChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} unit="ms" />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0].payload
                return (
                  <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-2.5 py-1.5 text-xs">
                    <p className={`font-mono font-semibold ${d.failed ? 'text-red-500' : 'text-gray-700'}`}>
                      {d.failed ? 'DOWN' : `${d.latency}ms`}
                    </p>
                    <p className="text-gray-400">{d.time}</p>
                  </div>
                )
              }}
            />
            {chartData.map((d, i) =>
              d.failed ? <ReferenceLine key={i} x={d.time} stroke="#fca5a5" strokeWidth={1} /> : null
            )}
            <Line
              type="monotone" dataKey="latency"
              stroke="#6366f1" strokeWidth={1.5}
              dot={false} activeDot={{ r: 3, fill: '#6366f1' }}
              connectNulls={false} isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* SSL info */}
      {ssl && (
        <div className="bg-gray-50 rounded-lg p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <SSLField label="Status"     value={ssl.valid ? (ssl.expired ? 'Expired' : 'Valid') : 'Invalid'} color={ssl.valid && !ssl.expired ? 'text-emerald-600' : 'text-red-500'} />
          <SSLField label="Days left"  value={ssl.days_left != null ? `${ssl.days_left}d` : '—'} color={ssl.days_left > 30 ? 'text-emerald-600' : ssl.days_left > 0 ? 'text-amber-500' : 'text-red-500'} />
          <SSLField label="Expires"    value={ssl.expires ?? '—'} />
          <SSLField label="Issuer"     value={ssl.issuer ?? '—'} />
        </div>
      )}

      {/* Ping rows */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Recent pings
        </p>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {[...pings].reverse().map((p, i) => (
            <div
              key={i}
              className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors font-mono"
            >
              <span className={`font-semibold w-12 ${p.status === 'Success' ? 'text-emerald-600' : 'text-red-500'}`}>
                {p.status === 'Success' ? 'UP' : 'DOWN'}
              </span>
              <span className="text-gray-400 flex-1">
                {new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
              <span className="text-gray-400 w-16 text-right">{p.code ?? '—'}</span>
              <span className={`w-20 text-right ${latencyColor(p.latency)}`}>
                {p.latency != null ? `${p.latency}ms` : 'Timeout'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function SSLField({ label, value, color = 'text-gray-700' }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-xs font-medium font-mono truncate ${color}`}>{value}</p>
    </div>
  )
}
