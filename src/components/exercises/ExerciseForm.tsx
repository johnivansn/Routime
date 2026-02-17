import { FileImage, FileVideo, Image as ImageIcon, Images, Pause, Play, Plus, RefreshCw, Slash, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { DragEvent, FormEvent } from 'react'
import { Button } from '@/components/shared/Button'
import { isValidExerciseName } from '@/utils/validators'

const MAX_SIZE_MB = 100
const SUPPORTED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']
const IMAGE_NAME_PATTERN = /[^a-zA-Z0-9._-]+/g
const IMAGE_EXTENSION_PATTERN = /\.(png|jpe?g|webp|gif|bmp|svg|avif|heic|heif)$/i
const IMAGE_EXTENSION_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
}

type ExerciseFormProps = {
  onSubmit: (values: {
    name: string
    mediaType: 'none' | 'video' | 'image' | 'gallery'
    videoFile?: File
    imageFiles?: File[]
    imageSlideSeconds?: number
    removeVideo?: boolean
    removeImages?: boolean
    removeImageIndexes?: number[]
  }) => Promise<void>
  initialName?: string
  hasVideo?: boolean
  currentVideoUrl?: string
  hasImages?: boolean
  currentImageUrls?: string[]
  initialMediaType?: 'none' | 'video' | 'image' | 'gallery'
  initialSlideSeconds?: number
  layout?: 'stack' | 'horizontal'
  nameAsTitle?: boolean
  nameValue?: string
  onNameChange?: (value: string) => void
  hideNameField?: boolean
  hideActions?: boolean
  formId?: string
  onDirtyChange?: (dirty: boolean) => void
  onPreviewDataChange?: (data: {
    mediaType: 'none' | 'video' | 'image' | 'gallery'
    videoUrl?: string | null
    imageUrls?: string[]
  }) => void
  onPreviewClick?: () => void
  submitLabel?: string
  onCancel?: () => void
}

export function ExerciseForm({
  onSubmit,
  initialName = '',
  hasVideo = false,
  currentVideoUrl,
  hasImages = false,
  currentImageUrls,
  initialMediaType = 'none',
  initialSlideSeconds = 5,
  layout = 'stack',
  nameAsTitle = false,
  nameValue,
  onNameChange,
  hideNameField = false,
  hideActions = false,
  formId,
  onDirtyChange,
  onPreviewDataChange,
  onPreviewClick,
  submitLabel = 'Guardar ejercicio',
  onCancel,
}: ExerciseFormProps) {
  const [name, setName] = useState(initialName)
  const [file, setFile] = useState<File | null>(null)
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [removeVideo, setRemoveVideo] = useState(false)
  const [removeImages, setRemoveImages] = useState(false)
  const [removeImageIndexes, setRemoveImageIndexes] = useState<number[]>([])
  const [mediaType, setMediaType] = useState<'none' | 'video' | 'image' | 'gallery'>(initialMediaType)
  const [slideSeconds, setSlideSeconds] = useState(initialSlideSeconds)
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const submitRef = useRef(false)
  const [dragActive, setDragActive] = useState(false)
  const [dragError, setDragError] = useState<string | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const toastTimerRef = useRef<number | null>(null)
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [carouselPlaying, setCarouselPlaying] = useState(false)
  const [lightPreview, setLightPreview] = useState(false)
  const dragDepthRef = useRef(0)
  const [dragZone, setDragZone] = useState<'add-left' | 'replace' | 'add-right' | null>(null)
  const lastPreviewRef = useRef<{ mediaType: string; videoUrl?: string | null; imageKey: string } | null>(
    null,
  )
  const carouselUserRef = useRef(false)
  const carouselAutoRef = useRef<string | null>(null)

  const getDragError = (items: DataTransferItemList | null) => {
    if (!items || items.length === 0) return null
    const fileItems = Array.from(items).filter((item) => item.kind === 'file')
    if (fileItems.length === 0) return null
    const hasVideo = fileItems.some((item) => item.type.startsWith('video/'))
    const hasImage = fileItems.some((item) => {
      if (item.type.startsWith('image/')) return true
      if (item.type) return false
      const droppedFile = item.getAsFile()
      return Boolean(droppedFile?.name && IMAGE_EXTENSION_PATTERN.test(droppedFile.name))
    })
    if (mediaType === 'video') {
      if (hasVideo) return null
      if (hasImage) return 'Esta sección es solo video.'
      return 'Formato no válido para video.'
    }
    if (mediaType === 'image' || mediaType === 'gallery') {
      if (hasImage) return null
      if (hasVideo) return 'Esta sección es solo imágenes.'
      return 'Formato no válido para imágenes.'
    }
    return null
  }

  const readDataTransferItem = (item: DataTransferItem) =>
    new Promise<string>((resolve) => {
      item.getAsString((value) => resolve(value ?? ''))
    })

  const sanitizeFileName = (value: string) => {
    const cleaned = value.replace(IMAGE_NAME_PATTERN, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    return cleaned.length > 0 ? cleaned : `drop-image-${Date.now()}`
  }

  const inferImageMimeFromPath = (pathLike: string) => {
    const match = pathLike.toLowerCase().match(/\.([a-z0-9]+)(?:$|\?)/)
    if (!match) return ''
    return IMAGE_EXTENSION_MIME[match[1]] ?? ''
  }

  const isImageLikeFile = (item: File) =>
    item.type.startsWith('image/') || (!item.type && IMAGE_EXTENSION_PATTERN.test(item.name))

  const extractImageUrlCandidates = async (items: DataTransferItemList | null) => {
    if (!items || items.length === 0) return []
    const urlSet = new Set<string>()
    const uriItem = Array.from(items).find((item) => item.kind === 'string' && item.type === 'text/uri-list')
    if (uriItem) {
      const content = await readDataTransferItem(uriItem)
      content
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'))
        .forEach((line) => {
          urlSet.add(line)
        })
    }
    const htmlItem = Array.from(items).find((item) => item.kind === 'string' && item.type === 'text/html')
    if (htmlItem) {
      const html = await readDataTransferItem(htmlItem)
      const parser = new window.DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      doc.querySelectorAll('img[src]').forEach((img) => {
        const src = img.getAttribute('src')?.trim()
        if (src) urlSet.add(src)
      })
      doc.querySelectorAll('a[href]').forEach((anchor) => {
        const href = anchor.getAttribute('href')?.trim()
        if (href) urlSet.add(href)
      })
    }
    return Array.from(urlSet)
  }

  const resolveDraggedImageFiles = async (items: DataTransferItemList | null) => {
    const candidates = await extractImageUrlCandidates(items)
    if (candidates.length === 0) {
      return { files: [] as File[], hasCandidates: false }
    }
    const files = await Promise.all(
      candidates.map(async (candidate, index) => {
        try {
          const response = await fetch(candidate, { cache: 'no-cache', mode: 'cors' })
          if (!response.ok) return null
          const blob = await response.blob()
          const mime = blob.type.startsWith('image/')
            ? blob.type
            : inferImageMimeFromPath(response.url || candidate)
          if (!mime) return null
          const parsed = new URL(response.url || candidate, window.location.href)
          const nameFromPath = decodeURIComponent(parsed.pathname.split('/').pop() || '')
          const name = sanitizeFileName(nameFromPath || `drop-image-${index + 1}`)
          return new File([blob], name, { type: mime })
        } catch {
          return null
        }
      }),
    )
    return { files: files.filter((item): item is File => Boolean(item)), hasCandidates: true }
  }

  const handleDropFiles = (
    files: FileList | File[],
    mode: 'add-left' | 'add-right' | 'replace' = 'replace',
    transferItems?: DataTransferItemList | null,
  ) => {
    const showToast = (message: string) => {
      setToastMessage(message)
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
      toastTimerRef.current = window.setTimeout(() => {
        setToastMessage(null)
        toastTimerRef.current = null
      }, 2200)
    }
    const run = async () => {
      let fileArray = Array.from(files)
      if (fileArray.length === 0 && (mediaType === 'image' || mediaType === 'gallery')) {
        const fallback = await resolveDraggedImageFiles(transferItems ?? null)
        if (fallback.files.length > 0) {
          fileArray = fallback.files
        } else if (fallback.hasCandidates) {
          const message = 'No se pudo importar la imagen desde el navegador. Descárgala y súbela manualmente.'
          setDragError(message)
          showToast(message)
          return
        }
      }
      if (fileArray.length === 0) return
      setDragError(null)

      if (mediaType === 'video') {
        const nextFile = fileArray.find((item) => item.type.startsWith('video/'))
        if (!nextFile) {
          const message = 'Solo se permite video en esta sección.'
          setDragError(message)
          showToast(message)
          return
        }
        setFile(nextFile)
        setRemoveVideo(false)
        return
      }
      if (mediaType === 'image' || mediaType === 'gallery') {
        const images = fileArray.filter((item) => isImageLikeFile(item))
        if (images.length === 0) {
          const message = 'Solo se permiten imágenes en esta sección.'
          setDragError(message)
          showToast(message)
          return
        }
        if (mediaType === 'gallery') {
          if (mode === 'replace') {
            setImageFiles(images)
          } else if (mode === 'add-left') {
            setImageFiles((prev) => [...images, ...prev])
          } else {
            setImageFiles((prev) => [...prev, ...images])
          }
        } else {
          setImageFiles([images[0]])
        }
        setRemoveImages(false)
      }
    }
    void run()
  }

  const handleDragEnter = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragDepthRef.current += 1
    setDragActive(true)
    const nextError = getDragError(event.dataTransfer.items)
    setDragError(nextError)
  }

  const handleDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!dragActive) {
      setDragActive(true)
    }
  }

  const handleDragLeave = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setDragActive(false)
      setDragError(null)
      setDragZone(null)
    }
  }

  const handleDragDrop = (
    event: DragEvent<HTMLElement>,
    mode: 'add-left' | 'add-right' | 'replace' = 'replace',
  ) => {
    event.preventDefault()
    event.stopPropagation()
    dragDepthRef.current = 0
    setDragActive(false)
    setDragZone(null)
    handleDropFiles(event.dataTransfer.files, mode, event.dataTransfer.items)
  }

  const handleGalleryDragOver = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!dragActive) {
      setDragActive(true)
    }
    if (imagePreviewList.length === 0) {
      setDragZone('add-right')
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const third = rect.width / 3
    if (x < third) {
      setDragZone('add-left')
    } else if (x > third * 2) {
      setDragZone('add-right')
    } else {
      setDragZone('replace')
    }
  }

  useEffect(() => {
    setName(initialName)
    setFile(null)
    setImageFiles([])
    setError(null)
    setRemoveVideo(false)
    setRemoveImages(false)
    setMediaType(initialMediaType)
    setSlideSeconds(initialSlideSeconds)
  }, [initialMediaType, initialName, initialSlideSeconds])

  useEffect(() => {
    setFile(null)
    setImageFiles([])
    setRemoveVideo(false)
    setRemoveImages(false)
    setRemoveImageIndexes([])
  }, [mediaType])

  useEffect(() => {
    if (!file) {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl)
      }
      setVideoPreviewUrl(null)
      return
    }
    const url = URL.createObjectURL(file)
    setVideoPreviewUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(() => {
    if (imageFiles.length === 0) {
      imagePreviewUrls.forEach((url) => URL.revokeObjectURL(url))
      setImagePreviewUrls([])
      return
    }
    const urls = imageFiles.map((item) => URL.createObjectURL(item))
    setImagePreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url))
      return urls
    })
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imageFiles])

  const validate = () => {
    const nextName = (nameValue ?? name).trim()
    if (!isValidExerciseName(nextName)) {
      return 'El nombre debe tener entre 3 y 80 caracteres.'
    }
    if (mediaType === 'video' && file) {
      if (!SUPPORTED_TYPES.includes(file.type)) {
        return 'Formato inválido. Usa MP4, WebM o MOV.'
      }
      const sizeMb = file.size / (1024 * 1024)
      if (sizeMb > MAX_SIZE_MB) {
        return `El video excede ${MAX_SIZE_MB}MB.`
      }
    }
    if (mediaType === 'video' && !file && (!hasVideo || removeVideo)) {
      return 'Selecciona un video o cambia el tipo de media.'
    }
    if ((mediaType === 'image' || mediaType === 'gallery') && imageFiles.length > 0) {
      const invalid = imageFiles.find((item) => !isImageLikeFile(item))
      if (invalid) {
        return 'Formato inválido. Usa imágenes (JPG, PNG, WebP, GIF).'
      }
    }
    if (
      (mediaType === 'image' || mediaType === 'gallery') &&
      imageFiles.length === 0 &&
      (!hasImages || removeImages)
    ) {
      return 'Selecciona al menos una imagen o cambia el tipo de media.'
    }
    if (
      (mediaType === 'image' || mediaType === 'gallery') &&
      imageFiles.length === 0 &&
      currentImageUrls &&
      removeImageIndexes.length > 0 &&
      removeImageIndexes.length >= currentImageUrls.length
    ) {
      return 'No puedes eliminar todas las imágenes sin agregar nuevas.'
    }
    return null
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitRef.current) return
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }
    setError(null)
    submitRef.current = true
    setLoading(true)
    const clearVideo = mediaType !== 'video'
    const clearImages = mediaType === 'video' || mediaType === 'none'

    const resolvedName = (nameValue ?? name).trim()
    try {
      await onSubmit({
        name: resolvedName,
        mediaType,
        videoFile: file ?? undefined,
        imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
        imageSlideSeconds: slideSeconds,
        removeVideo: removeVideo || clearVideo,
        removeImages: removeImages || clearImages,
        removeImageIndexes: removeImageIndexes.length > 0 ? removeImageIndexes : undefined,
      })
      setName('')
      setFile(null)
      setImageFiles([])
      setRemoveVideo(false)
      setRemoveImages(false)
      setRemoveImageIndexes([])
    } finally {
      setLoading(false)
      submitRef.current = false
    }
  }

  const resolvedName = nameValue ?? name
  const isDirty =
    resolvedName.trim() !== initialName.trim() ||
    mediaType !== initialMediaType ||
    slideSeconds !== initialSlideSeconds ||
    Boolean(file) ||
    imageFiles.length > 0 ||
    removeVideo ||
    removeImages ||
    removeImageIndexes.length > 0

  useEffect(() => {
    onDirtyChange?.(isDirty)
  }, [isDirty, onDirtyChange])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current)
      }
    }
  }, [])

  const singleColumn = layout === 'horizontal' && mediaType === 'none'
  const layoutClass =
    layout === 'horizontal'
      ? singleColumn
        ? 'lg:grid lg:grid-cols-1 lg:items-start lg:gap-6'
        : 'lg:grid lg:grid-cols-2 lg:items-start lg:gap-6'
      : 'section-stack'

  const videoPreview = videoPreviewUrl ?? (currentVideoUrl && !removeVideo ? currentVideoUrl : null)
  const imagePreviewList =
    imagePreviewUrls.length > 0
      ? imagePreviewUrls
      : currentImageUrls && currentImageUrls.length > 0 && !removeImages
        ? currentImageUrls
        : []
  const galleryPreview =
    mediaType === 'gallery' && imagePreviewList.length > 0
      ? imagePreviewList[Math.min(carouselIndex, imagePreviewList.length - 1)] ?? imagePreviewList[0]
      : null
  const previewImageForTone =
    mediaType === 'gallery' ? galleryPreview : mediaType === 'image' ? imagePreviewList[0] : null
  const canPreviewMedia =
    (mediaType === 'video' && Boolean(videoPreview)) ||
    ((mediaType === 'image' || mediaType === 'gallery') && imagePreviewList.length > 0)

  useEffect(() => {
    if (!onPreviewDataChange) return
    const nextImageUrls = mediaType === 'image' || mediaType === 'gallery' ? imagePreviewList : []
    const nextVideoUrl = mediaType === 'video' ? videoPreview : null
    const imageKey = nextImageUrls.join('|')
    const snapshot = { mediaType, videoUrl: nextVideoUrl, imageKey }
    const prev = lastPreviewRef.current
    if (
      prev &&
      prev.mediaType === snapshot.mediaType &&
      prev.videoUrl === snapshot.videoUrl &&
      prev.imageKey === snapshot.imageKey
    ) {
      return
    }
    lastPreviewRef.current = snapshot
    onPreviewDataChange({
      mediaType,
      videoUrl: nextVideoUrl,
      imageUrls: nextImageUrls,
    })
  }, [imagePreviewList, mediaType, onPreviewDataChange, videoPreview])

  useEffect(() => {
    if (mediaType !== 'gallery') return
    setCarouselIndex(0)
    carouselUserRef.current = false
    setCarouselPlaying(false)
  }, [mediaType, imagePreviewList.length])

  useEffect(() => {
    if (mediaType !== 'gallery') return
    if (imagePreviewList.length <= 1) return
    const key = `${mediaType}:${imagePreviewList.length}`
    if (carouselAutoRef.current !== key) {
      carouselAutoRef.current = key
      setCarouselPlaying(false)
      setCarouselIndex(0)
    }
  }, [imagePreviewList.length, mediaType])

  useEffect(() => {
    if (!previewImageForTone) {
      setLightPreview(false)
      return
    }

    const isSafeToAnalyze = () => {
      if (previewImageForTone.startsWith('blob:') || previewImageForTone.startsWith('data:')) {
        return true
      }
      try {
        const resolved = new URL(previewImageForTone, window.location.href)
        return resolved.origin === window.location.origin
      } catch {
        return false
      }
    }

    if (!isSafeToAnalyze()) {
      setLightPreview(false)
      return
    }

    let canceled = false
    const computeLuminance = (source: HTMLImageElement) => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return null
        const size = 24
        canvas.width = size
        canvas.height = size
        ctx.drawImage(source, 0, 0, size, size)
        const { data } = ctx.getImageData(0, 0, size, size)
        let total = 0
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]
          total += 0.2126 * r + 0.7152 * g + 0.0722 * b
        }
        return total / (data.length / 4)
      } catch {
        return null
      }
    }

    const analyze = async () => {
      const img = new window.Image()
      img.decoding = 'async'
      img.onload = () => {
        if (canceled) return
        const avg = computeLuminance(img)
        if (avg === null) {
          setLightPreview(false)
          return
        }
        setLightPreview(avg > 140)
      }
      img.onerror = async () => {
        if (canceled) return
        if (!canceled) setLightPreview(false)
      }
      img.src = previewImageForTone
    }

    analyze()
    return () => {
      canceled = true
    }
  }, [previewImageForTone])

  useEffect(() => {
    if (mediaType !== 'gallery') return
    if (!carouselPlaying) return
    if (imagePreviewList.length <= 1) return
    const delay = Math.max(1, slideSeconds) * 1000
    const timer = window.setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % imagePreviewList.length)
    }, delay)
    return () => window.clearInterval(timer)
  }, [carouselPlaying, imagePreviewList.length, mediaType, slideSeconds])

  return (
    <form
      id={formId}
      onSubmit={handleSubmit}
      className={`surface-panel p-4 sm:p-6 ${layoutClass}`}
    >
      {toastMessage && (
        <div className="fixed left-1/2 top-6 z-50 -translate-x-1/2">
          <div className="flex items-center gap-3 rounded-2xl border border-ember-400/70 bg-gradient-to-br from-ink-950 via-ink-900 to-ink-950 px-5 py-3 text-sm font-semibold text-ink-50 shadow-[0_20px_50px_-24px_rgba(248,113,113,0.95)] backdrop-blur">
            <span className="h-3 w-3 rounded-full bg-ember-400 shadow-[0_0_10px_rgba(248,113,113,0.85)]" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
      {mediaType !== 'none' && (
        <div className={`section-stack lg:col-span-1 ${layout === 'horizontal' ? 'lg:order-2' : ''}`}>
          {mediaType === 'gallery' ? (
            <div
              className={`media-frame relative aspect-video overflow-hidden rounded-3xl transition ${
                dragActive ? 'border-accent-400 bg-accent-500/10' : ''
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleGalleryDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(event) => {
                const mode =
                  dragZone === 'add-left' || dragZone === 'add-right' || dragZone === 'replace'
                    ? dragZone
                    : imagePreviewList.length === 0
                      ? 'add-right'
                      : 'replace'
                void handleDragDrop(event, mode)
              }}
            >
              {galleryPreview ? (
                <>
                  <img src={galleryPreview} className="h-full w-full object-cover" alt="Previsualización" />
                  {imagePreviewList.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setCarouselIndex((prev) =>
                            prev === 0 ? imagePreviewList.length - 1 : prev - 1,
                          )
                        }
                        className={`absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border text-xl font-semibold shadow-[0_10px_24px_-14px_rgba(0,0,0,0.7)] transition ${
                          lightPreview
                            ? 'border-ink-200/70 bg-ink-50/90 text-ink-900 hover:border-accent-500 hover:text-accent-600'
                            : 'border-ink-700 bg-ink-950/85 text-ink-50 hover:border-accent-300 hover:text-accent-200'
                        }`}
                        aria-label="Anterior"
                      >
                        ‹
                      </button>
                      <button
                        type="button"
                        onClick={() => setCarouselIndex((prev) => (prev + 1) % imagePreviewList.length)}
                        className={`absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border text-xl font-semibold shadow-[0_10px_24px_-14px_rgba(0,0,0,0.7)] transition ${
                          lightPreview
                            ? 'border-ink-200/70 bg-ink-50/90 text-ink-900 hover:border-accent-500 hover:text-accent-600'
                            : 'border-ink-700 bg-ink-950/85 text-ink-50 hover:border-accent-300 hover:text-accent-200'
                        }`}
                        aria-label="Siguiente"
                      >
                        ›
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-900 via-ink-900/40 to-ink-800 text-ink-200">
                  <div className="rounded-full border border-ink-600 bg-ink-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
                    Sin media
                  </div>
                  <p className="text-xs text-ink-400">Arrastra imágenes aquí</p>
                </div>
              )}
              {dragActive && (
                <div
                  className={`pointer-events-none absolute inset-0 grid grid-cols-[1fr_1.2fr_1fr] gap-3 p-4 backdrop-blur-sm ${
                    lightPreview ? 'bg-ink-950/70 text-ink-50' : 'bg-ink-950/55 text-ink-50'
                  }`}
                >
                  {(imagePreviewList.length === 0
                    ? (['add-right'] as const)
                    : (['add-left', 'replace', 'add-right'] as const)
                  ).map((mode, index) => {
                    const active = dragZone === mode
                    return (
                    <div
                      key={`${mode}-${index}`}
                      className={`flex flex-col items-center justify-center gap-3 rounded-[28px] border-2 border-dashed text-center transition ${
                        mode === 'replace'
                          ? active
                            ? 'border-accent-300 bg-accent-500/35 shadow-[0_0_45px_rgba(45,212,191,0.55)]'
                            : 'border-accent-300/70 bg-accent-500/15 shadow-[0_0_35px_rgba(45,212,191,0.25)]'
                          : active
                            ? 'border-ink-200 bg-ink-800/80 shadow-[0_0_35px_rgba(148,163,184,0.45)]'
                            : 'border-ink-400/70 bg-ink-900/70 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.2)]'
                      }`}
                      style={imagePreviewList.length === 0 ? { gridColumn: '1 / -1' } : undefined}
                    >
                      {dragError ? (
                        <>
                          <span className="text-sm font-semibold">{dragError}</span>
                          <span className="text-[11px] text-ink-200">Arrastra imágenes</span>
                        </>
                      ) : (
                        <>
                          <span className="flex items-center gap-2 text-base font-semibold">
                            {mode === 'replace' ? (
                              <>
                                <RefreshCw className="h-5 w-5" /> Reemplazar
                              </>
                            ) : (
                              <>
                                <Plus className="h-5 w-5" /> Agregar
                              </>
                            )}
                          </span>
                          <span className="text-xs text-ink-200">Suelta aquí</span>
                        </>
                      )}
                    </div>
                  )})}
                </div>
              )}
              {dragError && !dragActive && (
                <div className="absolute bottom-3 left-3 rounded-full bg-ember-500/90 px-3 py-1 text-[11px] font-semibold text-ink-900">
                  {dragError}
                </div>
              )}
            </div>
          ) : (
            <div
              className={`media-frame relative aspect-video overflow-hidden rounded-3xl transition ${
                dragActive ? 'border-accent-400 bg-accent-500/10' : ''
              }`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={(event) => {
                void handleDragDrop(event, 'replace')
              }}
            >
              {mediaType === 'video' && videoPreview ? (
                <video
                  src={videoPreview}
                  className="h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : mediaType === 'image' && imagePreviewList.length > 0 ? (
                <>
                  <img
                    src={imagePreviewList[0]}
                    className="h-full w-full object-contain bg-ink-950"
                    alt="Previsualización"
                  />
                  {imagePreviewUrls.length === 0 && (
                    <button
                      type="button"
                      onClick={() => setRemoveImages((prev) => !prev)}
                      className={`absolute right-2 top-2 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition ${
                        removeImages
                          ? 'bg-ember-500 text-ink-900'
                          : 'bg-ink-900/75 text-ink-50 hover:bg-ink-900/90'
                      }`}
                      aria-label="Eliminar imagen actual"
                      title="Eliminar imagen actual"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-ink-900 via-ink-900/40 to-ink-800 text-ink-200">
                  <div className="rounded-full border border-ink-600 bg-ink-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
                    Sin media
                  </div>
                  <p className="text-xs text-ink-400">
                    {mediaType === 'video' ? 'Arrastra un video aquí' : 'Arrastra imágenes aquí'}
                  </p>
                </div>
              )}
              {dragActive && (
                <div className="absolute inset-0 flex items-center justify-center bg-accent-500/15 text-ink-50 backdrop-blur-sm">
                  <div className="flex h-[85%] w-[85%] flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-accent-400 bg-ink-900/80 text-center">
                    {dragError ? (
                      <>
                        <span className="text-sm font-semibold">{dragError}</span>
                        <span className="text-[11px] text-ink-300">
                          {mediaType === 'video' ? 'Arrastra un video' : 'Arrastra imágenes'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-sm font-semibold">Suelta aquí</span>
                        <span className="text-[11px] text-ink-300">
                          {mediaType === 'video' ? 'Video' : 'Imágenes'}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
              {dragError && !dragActive && (
                <div className="absolute bottom-3 left-3 rounded-full bg-ember-500/90 px-3 py-1 text-[11px] font-semibold text-ink-900">
                  {dragError}
                </div>
              )}
              {onPreviewClick && canPreviewMedia && (
                <button
                  type="button"
                  onClick={onPreviewClick}
                  className="absolute inset-0 flex items-center justify-center bg-ink-900/35 text-ink-50 opacity-0 transition hover:opacity-100"
                  aria-label="Previsualizar"
                >
                  <span className="rounded-full bg-ink-900/80 px-4 py-2 text-xs font-semibold">
                    Previsualizar
                  </span>
                </button>
              )}
            </div>
          )}
          {(mediaType === 'image' || mediaType === 'gallery') && imagePreviewList.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-ink-300">
              <span>
                {mediaType === 'gallery'
                  ? `Mostrando ${Math.min(carouselIndex + 1, imagePreviewList.length)} de ${
                      imagePreviewList.length
                    }`
                  : 'Mostrando 1 de 1'}
              </span>
              {mediaType === 'gallery' && imagePreviewUrls.length === 0 && (
                <span className="rounded-full border border-ink-700 bg-ink-900/70 px-2 py-0.5 text-ink-200">
                  Selecciona en la vista previa para borrar
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className={`section-stack ${layout === 'horizontal' ? 'lg:order-1' : ''}`}>
        {!hideNameField &&
          (nameAsTitle ? (
            <input
              value={resolvedName}
              onChange={(event) =>
                onNameChange ? onNameChange(event.target.value) : setName(event.target.value)
              }
              placeholder={initialName || 'Nombre del ejercicio'}
              className="input-field font-display text-lg sm:text-2xl"
            />
          ) : (
            <div className="space-y-2">
              <label className="form-label">Nombre del ejercicio</label>
              <input
                value={resolvedName}
                onChange={(event) =>
                  onNameChange ? onNameChange(event.target.value) : setName(event.target.value)
                }
                placeholder="Ej. Burpees"
                className="input-field"
              />
            </div>
          ))}
        <div className="space-y-3">
          <label className="form-label">Media del ejercicio</label>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              {
                value: 'none',
                label: 'Sin media',
                hint: 'Solo texto',
                icon: Slash,
              },
              {
                value: 'video',
                label: 'Video',
                hint: 'MP4 / WebM / MOV',
                icon: FileVideo,
              },
              {
                value: 'image',
                label: 'Imagen',
                hint: 'Una sola imagen',
                icon: ImageIcon,
              },
              {
                value: 'gallery',
                label: 'Galería',
                hint: 'Secuencia automática',
                icon: Images,
              },
            ].map((option) => {
              const Icon = option.icon
              const active = mediaType === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMediaType(option.value as typeof mediaType)}
                  className={`group flex items-center gap-3 rounded-2xl border px-3 py-3 text-left text-xs transition ${
                    active
                      ? 'border-accent-400 bg-accent-500/15 text-ink-50 shadow-[0_10px_24px_-18px_rgba(45,212,191,0.9)]'
                      : 'border-ink-700 bg-ink-900/50 text-ink-200 hover:border-accent-400 hover:text-ink-50'
                  }`}
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-2xl border text-ink-200 transition ${
                      active
                        ? 'border-accent-400 bg-accent-500/20 text-accent-200'
                        : 'border-ink-700 bg-ink-900/60 group-hover:border-accent-400'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-sm font-semibold">{option.label}</span>
                    <span className="text-[11px] text-ink-300">{option.hint}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {mediaType === 'video' && (
          <div className="surface-card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-200">Video</p>
              <p className="text-[11px] text-ink-400">MP4 / WebM / MOV · {MAX_SIZE_MB}MB máx.</p>
            </div>
            <label className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/70 px-4 py-2 text-xs font-semibold text-ink-50 transition hover:border-accent-400 hover:text-accent-400">
              <FileVideo className="h-4 w-4" />
              {file ? 'Cambiar video' : 'Seleccionar video'}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(event) => {
                  const nextFile = event.target.files?.[0] ?? null
                  setFile(nextFile)
                  if (nextFile) {
                    setRemoveVideo(false)
                  }
                }}
                className="hidden"
              />
            </label>
            {file && (
              <div className="flex items-center gap-2 rounded-2xl border border-ink-700 bg-ink-900/60 px-3 py-2 text-xs text-ink-200">
                <FileVideo className="h-4 w-4" />
                <span className="truncate">{file.name}</span>
              </div>
            )}
            {hasVideo && (
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-300">
                <div className="flex items-center gap-2 rounded-2xl border border-ink-700 bg-ink-900/60 px-3 py-2 text-ink-200">
                  <FileVideo className="h-4 w-4" />
                  <span>Video actual</span>
                </div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={removeVideo}
                    onChange={(event) => setRemoveVideo(event.target.checked)}
                    className="h-4 w-4 rounded border-ink-500 bg-ink-900 text-accent-500"
                  />
                  <span>Eliminar</span>
                </label>
              </div>
            )}
          </div>
        )}

        {(mediaType === 'image' || mediaType === 'gallery') && (
          <div className="surface-card space-y-3 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-200">
                {mediaType === 'gallery' ? 'Galería' : 'Imagen'}
              </p>
              <p className="text-[11px] text-ink-400">JPG / PNG / WebP / GIF</p>
            </div>
            <label className="inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/70 px-4 py-2 text-xs font-semibold text-ink-50 transition hover:border-accent-400 hover:text-accent-400">
              <FileImage className="h-4 w-4" />
              {mediaType === 'gallery'
                ? imageFiles.length > 0 || (currentImageUrls && currentImageUrls.length > 0)
                  ? 'Cambiar imágenes'
                  : 'Agregar imágenes'
                : imageFiles.length > 0 || (currentImageUrls && currentImageUrls.length > 0)
                  ? 'Cambiar imagen'
                  : 'Agregar imagen'}
              <input
                type="file"
                accept="image/*"
                multiple={mediaType === 'gallery'}
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? [])
                  setImageFiles(files)
                  if (files.length > 0) {
                    setRemoveImages(false)
                  }
                }}
                className="hidden"
              />
            </label>
            {mediaType === 'gallery' && (
              <div className="flex flex-wrap items-end gap-3">
                <label className="space-y-2 text-xs text-ink-300">
                  <span className="form-label">Duración por imagen (seg)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={slideSeconds}
                      onChange={(event) => setSlideSeconds(Number(event.target.value))}
                      className="input-field w-28"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        carouselUserRef.current = true
                        setCarouselPlaying((prev) => !prev)
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ink-700 bg-ink-900/70 text-ink-100 transition hover:border-accent-400 hover:text-accent-200"
                      aria-label={carouselPlaying ? 'Pausar carrusel' : 'Reproducir carrusel'}
                    >
                      {carouselPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                    </button>
                  </div>
                </label>
                <p className="text-[11px] text-ink-400">
                  Se reproducen en secuencia automática.
                </p>
              </div>
            )}
          </div>
        )}
        {error && <p className="text-sm text-ember-400">{error}</p>}
        {!hideActions && (
          <div className="grid gap-2 sm:grid-cols-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Guardando...' : submitLabel}
            </Button>
            {onCancel && (
              <Button type="button" variant="secondary" className="w-full" onClick={onCancel}>
                Cancelar
              </Button>
            )}
          </div>
        )}
      </div>

    </form>
  )
}
