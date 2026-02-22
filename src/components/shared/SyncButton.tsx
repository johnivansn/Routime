import { useState } from 'react'
import { CloudDownload, CloudUpload } from 'lucide-react'
import { exportLocalData, importLocalData } from '@/utils/syncStorage'
import { fetchRemoteData, pushRemoteData } from '@/utils/syncClient'
import { getSyncClientId } from '@/utils/syncIdentity'

export function SyncButton() {
  const [busy, setBusy] = useState<'upload' | 'download' | null>(null)
  const [status, setStatus] = useState<string | null>(null)

  const handleDownload = async () => {
    const syncUrl = import.meta.env.VITE_SYNC_URL ?? ''
    if (!syncUrl.trim()) {
      setStatus('Configura VITE_SYNC_URL')
      return
    }
    if (busy) return
    const clientId = getSyncClientId()

    setBusy('download')
    setStatus(null)
    try {
      const remote = await fetchRemoteData(syncUrl, clientId)
      await importLocalData(remote, 'merge')
      setStatus('Bajado')
      setTimeout(() => setStatus(null), 2500)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  const handleUpload = async () => {
    const syncUrl = import.meta.env.VITE_SYNC_URL ?? ''
    if (!syncUrl.trim()) {
      setStatus('Configura VITE_SYNC_URL')
      return
    }
    if (busy) return
    const clientId = getSyncClientId()

    setBusy('upload')
    setStatus(null)
    try {
      const payload = await exportLocalData()
      await pushRemoteData(syncUrl, clientId, payload, 'replace')
      setStatus('Subido')
      setTimeout(() => setStatus(null), 2500)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error')
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleDownload}
        aria-label={busy === 'download' ? 'Bajando' : 'Bajar'}
        title={status ?? (busy === 'download' ? 'Bajando...' : 'Bajar datos')}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--surface-border)] bg-[color:var(--surface-panel-bg)] text-ink-50 shadow-sm backdrop-blur transition hover:border-accent-400 hover:text-[color:var(--accent-400)] sm:h-12 sm:w-12"
        disabled={busy === 'download'}
      >
        <CloudDownload className={`h-5 w-5 ${busy === 'download' ? 'animate-pulse' : ''}`} />
      </button>
      <button
        type="button"
        onClick={handleUpload}
        aria-label={busy === 'upload' ? 'Subiendo' : 'Subir'}
        title={status ?? (busy === 'upload' ? 'Subiendo...' : 'Subir actual')}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--surface-border)] bg-[color:var(--surface-panel-bg)] text-ink-50 shadow-sm backdrop-blur transition hover:border-accent-400 hover:text-[color:var(--accent-400)] sm:h-12 sm:w-12"
        disabled={busy === 'upload'}
      >
        <CloudUpload className={`h-5 w-5 ${busy === 'upload' ? 'animate-pulse' : ''}`} />
      </button>
      {status && (
        <span className="hidden text-xs text-ink-300 sm:inline">{status}</span>
      )}
    </div>
  )
}
