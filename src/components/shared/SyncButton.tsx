import { useEffect, useRef, useState } from 'react'
import { CloudUpload } from 'lucide-react'
import { exportLocalData, importLocalData } from '@/utils/syncStorage'
import { fetchRemoteData, pushRemoteData } from '@/utils/syncClient'

export function SyncButton() {
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const busyRef = useRef(false)
  const lastSyncRef = useRef(0)

  const handleSync = async () => {
    const syncUrl = import.meta.env.VITE_SYNC_URL ?? ''
    if (!syncUrl.trim()) {
      setStatus('Configura VITE_SYNC_URL')
      return
    }
    if (busyRef.current) return
    const clientId =
      localStorage.getItem('routime_sync_client_id') ?? crypto.randomUUID()
    localStorage.setItem('routime_sync_client_id', clientId)

    setBusy(true)
    busyRef.current = true
    setStatus(null)
    try {
      const remote = await fetchRemoteData(syncUrl, clientId)
      await importLocalData(remote, 'merge')
      const payload = await exportLocalData()
      await pushRemoteData(syncUrl, clientId, payload, 'replace')
      setStatus('Sincronizado')
      lastSyncRef.current = Date.now()
      setTimeout(() => setStatus(null), 2500)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Error')
    } finally {
      setBusy(false)
      busyRef.current = false
    }
  }

  useEffect(() => {
    const syncUrl = import.meta.env.VITE_SYNC_URL ?? ''
    if (!syncUrl.trim()) return

    const intervalMs = 5 * 60 * 1000
    const timer = window.setInterval(() => {
      if (!busyRef.current && Date.now() - lastSyncRef.current > intervalMs - 5000) {
        void handleSync()
      }
    }, intervalMs)

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !busyRef.current) {
        void handleSync()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleSync}
        aria-label={busy ? 'Sincronizando' : 'Sincronizar'}
        title={status ?? (busy ? 'Sincronizando...' : 'Sincronizar')}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--surface-border)] bg-[color:var(--surface-panel-bg)] text-ink-50 shadow-sm backdrop-blur transition hover:border-accent-400 hover:text-[color:var(--accent-400)] sm:h-12 sm:w-12"
      >
        <CloudUpload className={`h-5 w-5 ${busy ? 'animate-pulse' : ''}`} />
      </button>
      {status && (
        <span className="hidden text-xs text-ink-300 sm:inline">{status}</span>
      )}
    </div>
  )
}
