type UploadedFile = {
  id?: string | null
  name?: string | null
  mimeType?: string | null
  url?: string | null
}

type UploadResponse = {
  files?: UploadedFile[]
}

const resolveBaseUrl = () => {
  const raw = import.meta.env.VITE_UPLOAD_URL || import.meta.env.VITE_SYNC_URL || ''
  return raw.replace(/\/$/, '')
}

export const uploadToDrive = async (files: File[]) => {
  const baseUrl = resolveBaseUrl()
  if (!baseUrl) {
    throw new Error('No hay servidor de subida configurado.')
  }
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))

  const response = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    body: formData,
  })
  if (!response.ok) {
    throw new Error('Falló la subida de archivos.')
  }
  const data = (await response.json()) as UploadResponse
  return data.files ?? []
}
