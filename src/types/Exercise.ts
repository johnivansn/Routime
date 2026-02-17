export type Exercise = {
  id: string
  name: string
  videoFile?: File
  videoUrl?: string
  imageFiles?: File[]
  imageUrls?: string[]
  mediaType?: 'none' | 'video' | 'image' | 'gallery'
  imageSlideSeconds?: number
  thumbnailUrl?: string
  createdAt: number
  updatedAt?: number
}
