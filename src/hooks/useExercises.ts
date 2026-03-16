import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { db } from '@/repositories/db'
import type { Exercise } from '@/types'
import { uploadToDrive } from '@/utils/driveUpload'

type ExerciseInput = {
  name: string
  videoFile?: File
  imageFiles?: File[]
  mediaType?: Exercise['mediaType']
  imageSlideSeconds?: number
  removeVideo?: boolean
}

type ExerciseUpdate = {
  id: string
  name: string
  videoFile?: File
  imageFiles?: File[]
  mediaType?: Exercise['mediaType']
  imageSlideSeconds?: number
  removeVideo?: boolean
  removeImages?: boolean
  removeImageIndexes?: number[]
}

const createObjectUrl = (file: File) => URL.createObjectURL(file)

const resolveProxyBaseUrl = () => {
  const raw = import.meta.env.VITE_UPLOAD_URL || import.meta.env.VITE_SYNC_URL || ''
  return raw.replace(/\/$/, '')
}

const normalizeDriveUrl = (url?: string | null) => {
  if (!url) return undefined
  if (url.startsWith('blob:') || url.startsWith('data:')) return url
  try {
    const resolved = new URL(url)
    if (!resolved.hostname.includes('drive.google.com')) {
      return url
    }
    let id = resolved.searchParams.get('id')
    if (!id) {
      const match = resolved.pathname.match(/\/d\/([^/]+)/)
      if (match) id = match[1]
    }
    const baseUrl = resolveProxyBaseUrl()
    if (id && baseUrl) {
      return `${baseUrl}/proxy?id=${encodeURIComponent(id)}`
    }
    return id ? `https://drive.google.com/uc?export=view&id=${id}` : url
  } catch {
    return url
  }
}

export function useExercises() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const urlsRef = useRef(new Map<string, string[]>())

  const revokeAll = useCallback(() => {
    urlsRef.current.forEach((urls) => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    })
    urlsRef.current.clear()
  }, [])

  const loadExercises = useCallback(async () => {
    setLoading(true)
    revokeAll()
    const items = await db.exercises.toArray()
    const hydrated = items.map((item) => {
      const urls: string[] = []
      let videoUrl: string | undefined = normalizeDriveUrl(item.videoUrl)
      let imageUrls: string[] | undefined = item.imageUrls?.map((url) => normalizeDriveUrl(url)) as
        | string[]
        | undefined
      if (!videoUrl && item.videoFile) {
        videoUrl = createObjectUrl(item.videoFile)
        urls.push(videoUrl)
      }
      if ((!imageUrls || imageUrls.length === 0) && item.imageFiles && item.imageFiles.length > 0) {
        imageUrls = item.imageFiles.map((file) => {
          const url = createObjectUrl(file)
          urls.push(url)
          return url
        })
      }
      if (urls.length > 0) {
        urlsRef.current.set(item.id, urls)
      }
      const inferredMedia =
        item.mediaType ??
        (item.videoFile ? 'video' : item.imageFiles && item.imageFiles.length > 1 ? 'gallery' : item.imageFiles?.length ? 'image' : 'none')

      return { ...item, videoUrl, imageUrls, mediaType: inferredMedia }
    })
    setExercises(hydrated)
    setLoading(false)
  }, [revokeAll])

  useEffect(() => {
    loadExercises()
    return () => {
      revokeAll()
    }
  }, [loadExercises, revokeAll])

  const addExercise = useCallback(
    async ({ name, videoFile, imageFiles, mediaType, imageSlideSeconds }: ExerciseInput) => {
      const id = crypto.randomUUID()
      const createdAt = Date.now()
      const updatedAt = createdAt
      const urls: string[] = []
      const nextMediaType = mediaType ?? (videoFile ? 'video' : imageFiles?.length ? 'gallery' : 'none')

      let videoUrl: string | undefined
      let videoUploaded = false
      let imageUrls: string[] | undefined
      if (videoFile && nextMediaType === 'video') {
        try {
          const [uploaded] = await uploadToDrive([videoFile])
          videoUrl = normalizeDriveUrl(uploaded?.url)
          videoUploaded = Boolean(videoUrl)
        } catch {
          videoUrl = createObjectUrl(videoFile)
          urls.push(videoUrl)
        }
      }

      let imageUploaded = false
      if (imageFiles && imageFiles.length > 0 && (nextMediaType === 'image' || nextMediaType === 'gallery')) {
        try {
          const uploaded = await uploadToDrive(imageFiles)
          imageUrls = uploaded
            .map((item) => normalizeDriveUrl(item.url))
            .filter(Boolean) as string[]
          imageUploaded = imageUrls.length > 0
        } catch {
          imageUrls = imageFiles.map((file) => {
            const url = createObjectUrl(file)
            urls.push(url)
            return url
          })
        }
      }

      const exercise: Exercise = {
        id,
        name,
        videoFile: videoUploaded ? undefined : nextMediaType === 'video' ? videoFile : undefined,
        videoUrl,
        imageFiles: imageUploaded ? undefined : nextMediaType !== 'video' ? imageFiles : undefined,
        imageUrls,
        mediaType: nextMediaType,
        imageSlideSeconds: imageSlideSeconds ?? 5,
        createdAt,
        updatedAt,
      }

      await db.exercises.add({
        id,
        name,
        videoFile: exercise.videoFile,
        imageFiles: exercise.imageFiles,
        videoUrl: videoUploaded ? videoUrl ?? '' : '',
        imageUrls: imageUploaded ? imageUrls ?? [] : [],
        mediaType: exercise.mediaType,
        imageSlideSeconds: exercise.imageSlideSeconds,
        createdAt,
        updatedAt,
      })

      if (urls.length > 0) {
        urlsRef.current.set(id, urls)
      }
      setExercises((prev) => [exercise, ...prev])
    },
    []
  )

  const removeExercise = useCallback(async (id: string) => {
    await db.exercises.delete(id)
    const urls = urlsRef.current.get(id)
    if (urls) {
      urls.forEach((url) => URL.revokeObjectURL(url))
      urlsRef.current.delete(id)
    }
    setExercises((prev) => prev.filter((item) => item.id !== id))
  }, [])

  const updateExercise = useCallback(
    async ({
      id,
      name,
      videoFile,
      imageFiles,
      mediaType,
      imageSlideSeconds,
      removeVideo,
      removeImages,
      removeImageIndexes,
    }: ExerciseUpdate) => {
      const current = exercises.find((item) => item.id === id)
      if (!current) return

      const nextMediaType = mediaType ?? current.mediaType ?? 'none'
      const shouldRemoveVideo = Boolean(removeVideo) || nextMediaType !== 'video'
      const shouldRemoveImages = Boolean(removeImages) || nextMediaType === 'video' || nextMediaType === 'none'

      let nextVideoFile = shouldRemoveVideo ? undefined : videoFile ?? current.videoFile
      let nextImageFiles = shouldRemoveImages ? undefined : imageFiles ?? current.imageFiles
      let nextVideoUrl = shouldRemoveVideo ? undefined : normalizeDriveUrl(current.videoUrl)
      let nextImageUrls = shouldRemoveImages
        ? undefined
        : (current.imageUrls?.map((url) => normalizeDriveUrl(url)) as string[] | undefined)
      let nextVideoUploaded = Boolean(nextVideoUrl)
      let nextImageUploaded = Boolean(nextImageUrls && nextImageUrls.length > 0)

      if (!shouldRemoveImages && !imageFiles && removeImageIndexes && removeImageIndexes.length > 0) {
        if (nextImageFiles) {
          nextImageFiles = nextImageFiles.filter((_, index) => !removeImageIndexes.includes(index))
        }
        if (nextImageUrls) {
          nextImageUrls = nextImageUrls.filter((_, index) => !removeImageIndexes.includes(index))
        }
      }

      const existingUrls = urlsRef.current.get(id)
      if (existingUrls && (shouldRemoveVideo || shouldRemoveImages || videoFile || imageFiles)) {
        existingUrls.forEach((url) => URL.revokeObjectURL(url))
        urlsRef.current.delete(id)
      }

      if (videoFile && !shouldRemoveVideo) {
        try {
          const [uploaded] = await uploadToDrive([videoFile])
          nextVideoUrl = normalizeDriveUrl(uploaded?.url)
          nextVideoFile = undefined
          nextVideoUploaded = Boolean(nextVideoUrl)
        } catch {
          const newUrl = createObjectUrl(videoFile)
          urlsRef.current.set(id, [newUrl])
          nextVideoUrl = newUrl
          nextVideoFile = videoFile
          nextVideoUploaded = false
        }
      } else if (shouldRemoveVideo) {
        nextVideoUrl = undefined
        nextVideoFile = undefined
        nextVideoUploaded = false
      }

      if (imageFiles && imageFiles.length > 0 && !shouldRemoveImages) {
        try {
          const uploaded = await uploadToDrive(imageFiles)
          nextImageUrls = uploaded
            .map((item) => normalizeDriveUrl(item.url))
            .filter(Boolean) as string[]
          nextImageFiles = undefined
          nextImageUploaded = nextImageUrls.length > 0
        } catch {
          const urls = imageFiles.map((file) => createObjectUrl(file))
          urlsRef.current.set(id, urls)
          nextImageUrls = urls
          nextImageFiles = imageFiles
          nextImageUploaded = false
        }
      } else if (shouldRemoveImages) {
        nextImageUrls = undefined
        nextImageFiles = undefined
        nextImageUploaded = false
      }

      setExercises((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                name,
                videoFile: nextVideoFile,
                videoUrl: nextVideoUrl,
                imageFiles: nextImageFiles,
                imageUrls: nextImageUrls,
                mediaType: nextMediaType,
                imageSlideSeconds: imageSlideSeconds ?? item.imageSlideSeconds,
                updatedAt,
              }
            : item
        )
      )

      const updatedAt = Date.now()

      await db.exercises.update(id, {
        name,
        videoFile: nextVideoFile,
        imageFiles: nextImageFiles,
        videoUrl: nextVideoUploaded ? nextVideoUrl ?? '' : '',
        imageUrls: nextImageUploaded ? nextImageUrls ?? [] : [],
        mediaType: nextMediaType,
        imageSlideSeconds: imageSlideSeconds ?? current.imageSlideSeconds,
        updatedAt,
      })
    },
    [exercises]
  )

  const normalize = useCallback((value: string) => {
    return value
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .trim()
  }, [])

  const filtered = useMemo(() => {
    const needle = normalize(query)
    if (!needle) return exercises
    return exercises.filter((exercise) => normalize(exercise.name).includes(needle))
  }, [exercises, normalize, query])

  return {
    exercises: filtered,
    loading,
    query,
    setQuery,
    addExercise,
    updateExercise,
    removeExercise,
    refresh: loadExercises,
  }
}
