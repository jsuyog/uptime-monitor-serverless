import axios from 'axios'

const LAMBDA_URL = 'https://dmezj2479g.execute-api.ap-south-1.amazonaws.com/ping-web/'

export async function pingUrl(url, location = 'default') {
  const { data } = await axios.get(LAMBDA_URL, {
    params: { url, location },
    timeout: 15000,
  })
  return data
}

export function normalizeUrl(raw) {
  raw = raw.trim()
  if (!raw) return null
  if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw
  try { new URL(raw); return raw } catch { return null }
}

export function latencyColor(ms) {
  if (ms == null) return 'text-gray-400'
  if (ms < 300)  return 'text-emerald-600'
  if (ms < 800)  return 'text-amber-500'
  return 'text-red-500'
}

export function sslStatus(ssl) {
  if (!ssl || !ssl.valid) return { label: 'Invalid', cls: 'badge-ssl-bad', icon: '✗' }
  if (ssl.days_left < 0)   return { label: 'Expired', cls: 'badge-ssl-bad', icon: '✗' }
  if (ssl.days_left <= 30) return { label: `${ssl.days_left}d left`, cls: 'badge-ssl-warn', icon: '!' }
  return { label: `${ssl.days_left}d`, cls: 'badge-ssl-ok', icon: '✓' }
}
