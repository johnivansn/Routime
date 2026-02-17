import type { SyncPayload } from './syncStorage'

const normalizeUrl = (value: string) => value.replace(/\/$/, '')

export const fetchRemoteData = async (url: string, clientId: string) => {
  const endpoint = `${normalizeUrl(url)}/sync/export?clientId=${encodeURIComponent(clientId)}`
  const response = await fetch(endpoint, { method: 'GET' })
  if (!response.ok) {
    throw new Error('No se pudo descargar los datos.')
  }
  return (await response.json()) as SyncPayload
}

export const pushRemoteData = async (
  url: string,
  clientId: string,
  payload: SyncPayload,
  mode: 'merge' | 'replace'
) => {
  const endpoint = `${normalizeUrl(url)}/sync/import?mode=${encodeURIComponent(mode)}`
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, ...payload }),
  })
  if (!response.ok) {
    throw new Error('No se pudo subir los datos.')
  }
  return response.json()
}
