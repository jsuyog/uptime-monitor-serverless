import React from 'react'
import { ResponsiveContainer, AreaChart, Area, Tooltip, ReferenceLine } from 'recharts'
import { latencyColor } from '../utils/api'

export default function SparklineChart({ pings }) {
  if (!pings || pings.length < 2) {
    return (
      <div className="h-14 flex items-center justify-center text-xs text-gray-300">
        Collecting data...
      </div>
    )
  }

  const last30 = pings.slice(-30)
  const data = last30.map(p => ({
    time:    new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    latency: p.latency ?? 0,
    failed:  p.status !== 'Success',
  }))

  const hasFailure = data.some(d => d.failed)

  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="latGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload
            return (
              <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-2.5 py-1.5 text-xs">
                <p className={`font-mono font-medium ${d.failed ? 'text-red-500' : 'text-gray-700'}`}>
                  {d.failed ? 'DOWN' : `${d.latency}ms`}
                </p>
                <p className="text-gray-400">{d.time}</p>
              </div>
            )
          }}
        />
        {hasFailure && data.map((d, i) =>
          d.failed ? (
            <ReferenceLine key={i} x={d.time} stroke="#fca5a5" strokeWidth={1} strokeDasharray="3 3" />
          ) : null
        )}
        <Area
          type="monotone"
          dataKey="latency"
          stroke="#6366f1"
          strokeWidth={1.5}
          fill="url(#latGrad)"
          dot={false}
          activeDot={{ r: 3, fill: '#6366f1' }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
