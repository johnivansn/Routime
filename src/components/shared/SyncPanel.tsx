import { useState } from 'react'
import { Button } from '@/components/shared/Button'
import { exportLocalData, importLocalData } from '@/utils/syncStorage'
import { fetchRemoteData, pushRemoteData } from '@/utils/syncClient'

const STORAGE_KEY_URL = 'routime_sync_url'
const STORAGE_KEY_ID = 'routime_sync_client_id'

const getOrCreateClientId = () => {
  const existing = localStorage.getItem(STORAGE_KEY_ID)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY_ID, id)
  return id
}

export function SyncPanel() {
  const [syncUrl] = useState(
    () => localStorage.getItem(STORAGE_KEY_URL) ?? import.meta.env.VITE_SYNC_URL ?? ''
  )
  const [clientId] = useState(() => getOrCreateClientId())
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleSync = async () => {
    if (!syncUrl.trim()) {
      setStatus('Configura VITE_SYNC_URL para sincronizar.')
      return
    }
    setBusy(true)
    setStatus(null)
    try {
      const remote = await fetchRemoteData(syncUrl, clientId)
      await importLocalData(remote, 'merge')
      const payload = await exportLocalData()
      await pushRemoteData(syncUrl, clientId, payload, 'replace')
      setStatus('Sincronización completada.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error al sincronizar.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="surface-panel mt-6 space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="form-label">Sincronización</p>
          <p className="form-help">Guarda tus datos en MongoDB y úsalos en otros dispositivos.</p>
        </div>
        <Button onClick={handleSync} disabled={busy}>
          {busy ? 'Sincronizando...' : 'Sincronizar ahora'}
        </Button>
      </div>
      {status && <p className="text-xs text-ink-200">{status}</p>}
    </div>
  )
}
