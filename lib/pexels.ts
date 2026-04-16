/**
 * Pexels API client with database caching.
 * All responses cached in PexelsCache table to avoid repeat API calls.
 */

const PEXELS_API_KEY = process.env.PEXELS_API_KEY!
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export interface PexelsPhoto {
  id: number
  url: string
  photographer: string
  src: {
    original: string
    large2x: string
    large: string
    medium: string
    small: string
    portrait: string
    landscape: string
    tiny: string
  }
  alt: string
}

export interface PexelsVideo {
  id: number
  url: string
  duration: number
  video_files: Array<{
    id: number
    quality: string
    file_type: string
    link: string
    width?: number
    height?: number
  }>
  image: string
}

async function fetchWithCache<T>(query: string, type: 'photo' | 'video', fetcher: () => Promise<T>): Promise<T> {
  // Try to import prisma — gracefully degrade if not available
  try {
    const { prisma } = await import('@/lib/db')
    const cacheKey = `${type}:${query}`

    // Check cache
    const cached = await prisma.pexelsCache.findUnique({ where: { query: cacheKey } })
    if (cached) {
      const age = Date.now() - cached.createdAt.getTime()
      if (age < CACHE_TTL_MS) {
        return cached.data as T
      }
    }

    // Fetch from API
    const data = await fetcher()

    // Store in cache
    await prisma.pexelsCache.upsert({
      where: { query: cacheKey },
      update: { data: data as object, createdAt: new Date() },
      create: { query: cacheKey, resourceType: type, data: data as object },
    })

    return data
  } catch {
    // Fallback: call API directly without caching
    return fetcher()
  }
}

export async function searchPhotos(query: string, perPage = 10): Promise<PexelsPhoto[]> {
  return fetchWithCache(query, 'photo', async () => {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.photos || []
  })
}

export async function searchVideos(query: string, perPage = 5): Promise<PexelsVideo[]> {
  return fetchWithCache(query, 'video', async () => {
    const res = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape&size=large`,
      { headers: { Authorization: PEXELS_API_KEY }, next: { revalidate: 3600 } }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.videos || []
  })
}

export function getBestVideoUrl(video: PexelsVideo): string {
  const files = video.video_files
  // Prefer HD (1920x1080) then any large
  const hd = files.find(f => f.quality === 'hd' && f.width === 1920)
  const large = files.find(f => f.quality === 'hd')
  const sd = files.find(f => f.quality === 'sd')
  return (hd || large || sd || files[0])?.link || ''
}

export function getPhotoUrl(photo: PexelsPhoto, size: keyof PexelsPhoto['src'] = 'large'): string {
  return photo?.src?.[size] || photo?.src?.large || ''
}

// Static fallback URLs (used when Pexels API is unavailable)
export const FALLBACKS = {
  hero: 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1920',
  construction: 'https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=1200',
  legal: 'https://images.pexels.com/photos/8962487/pexels-photo-8962487.jpeg?auto=compress&cs=tinysrgb&w=800',
  finance: 'https://images.pexels.com/photos/7731337/pexels-photo-7731337.jpeg?auto=compress&cs=tinysrgb&w=800',
  design: 'https://images.pexels.com/photos/5668473/pexels-photo-5668473.jpeg?auto=compress&cs=tinysrgb&w=800',
  permits: 'https://images.pexels.com/photos/1546168/pexels-photo-1546168.jpeg?auto=compress&cs=tinysrgb&w=800',
  contractors: 'https://images.pexels.com/photos/8961458/pexels-photo-8961458.jpeg?auto=compress&cs=tinysrgb&w=800',
  insurance: 'https://images.pexels.com/photos/3760067/pexels-photo-3760067.jpeg?auto=compress&cs=tinysrgb&w=800',
  propertyTax: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=800',
}
