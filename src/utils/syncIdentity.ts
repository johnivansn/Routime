const STORAGE_KEY_ID = 'routime_sync_client_id'

export const getSyncClientId = () => {
  const envId = import.meta.env.VITE_SYNC_CLIENT_ID
  if (typeof envId === 'string' && envId.trim()) {
    return envId.trim()
  }
  const existing = localStorage.getItem(STORAGE_KEY_ID)
  if (existing) return existing
  const id = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY_ID, id)
  return id
}
