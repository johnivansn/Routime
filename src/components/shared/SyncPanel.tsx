import { useState } from 'react'
import { Button } from '@/components/shared/Button'
import { exportLocalData, importLocalData } from '@/utils/syncStorage'
import { fetchRemoteData, pushRemoteData } from '@/utils/syncClient'
import { getSyncClientId } from '@/utils/syncIdentity'

const STORAGE_KEY_URL = 'routime_sync_url'

export function SyncPanel() {
  const [syncUrl] = useState(
    () => localStorage.getItem(STORAGE_KEY_URL) ?? import.meta.env.VITE_SYNC_URL ?? ''
  )
  const [clientId] = useState(() => getSyncClientId())
  const [status, setStatus] = useState<string | null>(null)
  const [busy, setBusy] = useState<'upload' | 'download' | null>(null)

  const handleDownload = async () => {
    if (!syncUrl.trim()) {
      setStatus('Configura VITE_SYNC_URL para sincronizar.')
      return
    }
    setBusy('download')
    setStatus(null)
    try {
      const remote = await fetchRemoteData(syncUrl, clientId)
      await importLocalData(remote, 'merge')
      setStatus('Datos descargados.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error al descargar.')
    } finally {
      setBusy(null)
    }
  }

  const handleUpload = async () => {
    if (!syncUrl.trim()) {
      setStatus('Configura VITE_SYNC_URL para sincronizar.')
      return
    }
    setBusy('upload')
    setStatus(null)
    try {
      const payload = await exportLocalData()
      await pushRemoteData(syncUrl, clientId, payload, 'replace')
      setStatus('Datos subidos.')
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error al subir.')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="surface-panel mt-6 space-y-4 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="form-label">Sincronización</p>
          <p className="form-help">Guarda tus datos en MongoDB y úsalos en otros dispositivos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleDownload} disabled={busy === 'download'}>
            {busy === 'download' ? 'Bajando...' : 'Bajar datos'}
          </Button>
          <Button onClick={handleUpload} disabled={busy === 'upload'} variant="secondary">
            {busy === 'upload' ? 'Subiendo...' : 'Subir actual'}
          </Button>
        </div>
      </div>
      {status && <p className="text-xs text-ink-200">{status}</p>}
    </div>
  )
}
