import { useState, useRef, useCallback } from 'react'
import { pingUrl } from '../utils/api'

const PING_INTERVAL = 10000
const MAX_HISTORY   = 180   // 30 min at 10s intervals

export function useMonitor() {
  const [monitors, setMonitors] = useState([])  // array of monitor objects
  const intervals = useRef({})                   // { id: intervalId }

  // Add a new monitor
  const addMonitor = useCallback((url, location) => {
    const id = crypto.randomUUID()
    const monitor = {
      id,
      url,
      location,
      status: 'pending',   // pending | up | down
      pings: [],           // [{ time, status, code, latency, ssl }]
      ssl: null,
      lastPing: null,
      active: true,
    }
    setMonitors(prev => [...prev, monitor])
    startPinging(id, url, location)
    return id
  }, [])

  // Remove a monitor
  const removeMonitor = useCallback((id) => {
    stopPinging(id)
    setMonitors(prev => prev.filter(m => m.id !== id))
  }, [])

  // Toggle pause / resume
  const toggleMonitor = useCallback((id) => {
    setMonitors(prev => prev.map(m => {
      if (m.id !== id) return m
      if (m.active) {
        stopPinging(id)
        return { ...m, active: false }
      } else {
        const mon = prev.find(x => x.id === id)
        if (mon) startPinging(id, mon.url, mon.location)
        return { ...m, active: true }
      }
    }))
  }, [])

  // Clear history for a monitor
  const clearMonitor = useCallback((id) => {
    setMonitors(prev => prev.map(m =>
      m.id === id ? { ...m, pings: [], status: 'pending', ssl: null, lastPing: null } : m
    ))
  }, [])

  function startPinging(id, url, location) {
    // Immediate first ping
    doPing(id, url, location)
    intervals.current[id] = setInterval(() => doPing(id, url, location), PING_INTERVAL)
  }

  function stopPinging(id) {
    clearInterval(intervals.current[id])
    delete intervals.current[id]
  }

  async function doPing(id, url, location) {
    try {
      const data = await pingUrl(url, location)
      const ping = {
        time:    Date.now(),
        status:  data.status,
        code:    data.code ?? null,
        latency: data.latency_ms ?? null,
        ssl:     data.ssl ?? null,
      }
      setMonitors(prev => prev.map(m => {
        if (m.id !== id) return m
        const pings = [...m.pings, ping].slice(-MAX_HISTORY)
        return {
          ...m,
          status:   ping.status === 'Success' ? 'up' : 'down',
          pings,
          ssl:      ping.ssl ?? m.ssl,
          lastPing: ping,
        }
      }))
    } catch {
      const ping = { time: Date.now(), status: 'Failure', code: null, latency: null, ssl: null }
      setMonitors(prev => prev.map(m => {
        if (m.id !== id) return m
        const pings = [...m.pings, ping].slice(-MAX_HISTORY)
        return { ...m, status: 'down', pings, lastPing: ping }
      }))
    }
  }

  return { monitors, addMonitor, removeMonitor, toggleMonitor, clearMonitor }
}
