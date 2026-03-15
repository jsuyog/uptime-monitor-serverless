import React from 'react'
import { useMonitor } from './hooks/useMonitor'
import AddMonitorForm from './components/AddMonitorForm'
import MonitorCard from './components/MonitorCard'
import GlobalStats from './components/GlobalStats'

function exportCSV(monitor) {
  if (!monitor.pings.length) { alert('No data to export yet.'); return }
  const header = 'Timestamp,Status,HTTP Code,Latency (ms),Location\n'
  const rows = monitor.pings.map(p => [
    new Date(p.time).toISOString(),
    p.status,
    p.code ?? '',
    p.latency ?? '',
    monitor.location,
  ].join(',')).join('\n')
  const blob = new Blob([header + rows], { type: 'text/csv' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `uptime-${new URL(monitor.url).hostname}-${Date.now()}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}

export default function App() {
  const { monitors, addMonitor, removeMonitor, toggleMonitor, clearMonitor } = useMonitor()

  return (
    <div className="min-h-screen bg-surface">
      {/* Top nav */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">U</span>
            </div>
            <span className="font-semibold text-gray-900 text-sm">Uptime Monitor</span>
            <span className="text-gray-300 text-sm">·</span>
            <span className="text-gray-400 text-xs">Real-time website health checker</span>
          </div>
          <span className="text-xs text-gray-400 font-mono hidden sm:block">
            pings every 10s
          </span>
        </div>
      </header>

      {/* Global stats bar */}
      <GlobalStats monitors={monitors} />

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Add monitor form */}
        <div className="card p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center text-gray-500 text-xs">+</span>
            Add monitor
          </h2>
          <AddMonitorForm onAdd={addMonitor} />
        </div>

        {/* Monitor grid */}
        {monitors.length === 0 ? (
          <EmptyState />
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-700">
                Monitors
                <span className="ml-2 text-gray-400 font-normal">({monitors.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {monitors.map(monitor => (
                <MonitorCard
                  key={monitor.id}
                  monitor={monitor}
                  onRemove={() => removeMonitor(monitor.id)}
                  onToggle={() => toggleMonitor(monitor.id)}
                  onClear={() => clearMonitor(monitor.id)}
                  onExport={() => exportCSV(monitor)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto px-6 py-8 border-t border-gray-100 mt-8">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Uptime Monitor — Built with React + AWS Lambda</span>
          <span className="font-mono">v1.0.0</span>
        </div>
      </footer>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="card p-12 text-center animate-fade-in">
      <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">📡</span>
      </div>
      <h3 className="text-sm font-semibold text-gray-700 mb-1">No monitors yet</h3>
      <p className="text-sm text-gray-400 max-w-xs mx-auto">
        Add a website URL above to start monitoring its uptime, response time, and SSL certificate.
      </p>
    </div>
  )
}
