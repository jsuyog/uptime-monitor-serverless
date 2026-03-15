import React, { useState } from 'react'
import { normalizeUrl } from '../utils/api'

const LOCATIONS = [
  { value: 'default',       label: '📍 Default (Mumbai)' },
  { value: 'us-east',       label: '🇺🇸 US East' },
  { value: 'us-west',       label: '🇺🇸 US West' },
  { value: 'eu-west',       label: '🇬🇧 EU West' },
  { value: 'eu-central',    label: '🇩🇪 EU Central' },
  { value: 'asia-south',    label: '🇮🇳 Asia South' },
  { value: 'asia-east',     label: '🇸🇬 Asia East' },
  { value: 'south-america', label: '🇧🇷 South America' },
  { value: 'australia',     label: '🇦🇺 Australia' },
]

export default function AddMonitorForm({ onAdd }) {
  const [url, setUrl]           = useState('')
  const [location, setLocation] = useState('default')
  const [error, setError]       = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const normalized = normalizeUrl(url)
    if (!normalized) { setError('Please enter a valid URL'); return }
    setError('')
    onAdd(normalized, location)
    setUrl('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="flex-1 min-w-[220px]">
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Website URL
        </label>
        <input
          className="input"
          value={url}
          onChange={e => { setUrl(e.target.value); setError('') }}
          placeholder="google.com or https://example.com"
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
          Location
        </label>
        <select
          className="select"
          value={location}
          onChange={e => setLocation(e.target.value)}
        >
          {LOCATIONS.map(l => (
            <option key={l.value} value={l.value}>{l.label}</option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn-primary h-[38px]">
        <span className="text-base leading-none">+</span>
        Add monitor
      </button>
    </form>
  )
}
