import React from 'react'

export default function GlobalStats({ monitors }) {
  const total   = monitors.length
  const up      = monitors.filter(m => m.status === 'up').length
  const down    = monitors.filter(m => m.status === 'down').length
  const pending = monitors.filter(m => m.status === 'pending').length

  const allLatencies = monitors.flatMap(m =>
    m.pings.map(p => p.latency).filter(v => v != null)
  )
  const avgLatency = allLatencies.length
    ? Math.round(allLatencies.reduce((a, b) => a + b, 0) / allLatencies.length)
    : null

  if (total === 0) return null

  return (
    <div className="flex flex-wrap items-center gap-6 px-6 py-3 bg-white border-b border-gray-100 text-sm animate-fade-in">
      <span className="text-gray-400 font-medium uppercase tracking-widest text-xs">Overview</span>
      <Stat label="Total" value={total} color="text-gray-700" />
      <Stat label="Up" value={up} color="text-emerald-600" dot="bg-emerald-500" />
      <Stat label="Down" value={down} color="text-red-500" dot="bg-red-500" />
      {pending > 0 && <Stat label="Pending" value={pending} color="text-amber-500" />}
      {avgLatency != null && (
        <Stat label="Avg latency" value={`${avgLatency}ms`} color="text-gray-600" />
      )}
    </div>
  )
}

function Stat({ label, value, color, dot }) {
  return (
    <div className="flex items-center gap-2">
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />}
      <span className="text-gray-400">{label}</span>
      <span className={`font-semibold font-mono ${color}`}>{value}</span>
    </div>
  )
}
