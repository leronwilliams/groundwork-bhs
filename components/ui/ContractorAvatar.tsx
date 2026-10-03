// Contractor photo, or an initials placeholder when there's no real photo.
// Stock-library URLs (e.g. the old Pexels sunflower) are treated as "no photo" — code-side only, no DB writes.
const STOCK_HOSTS = ['images.pexels.com', 'images.unsplash.com', 'cdn.pixabay.com']

function isRealPhoto(url?: string | null): url is string {
  if (!url) return false
  try {
    return !STOCK_HOSTS.includes(new URL(url).hostname)
  } catch {
    return false
  }
}

function initials(name: string) {
  const words = name.replace(/[^A-Za-z0-9 &]/g, ' ').split(/\s+/).filter(w => w && w !== '&')
  return (words.slice(0, 2).map(w => w[0]).join('') || '?').toUpperCase()
}

export function ContractorAvatar({ name, imageUrl, size = 64 }: { name: string; imageUrl?: string | null; size?: number }) {
  if (isRealPhoto(imageUrl)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={name} width={size} height={size} className="rounded-sm object-cover flex-shrink-0" style={{ width: size, height: size }} />
    )
  }
  return (
    <div
      aria-hidden
      className="rounded-sm flex-shrink-0 flex items-center justify-center font-black"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        fontFamily: 'Syne, sans-serif',
        letterSpacing: '0.02em',
        color: 'var(--cyan)',
        background: 'rgba(0,212,245,0.08)',
        border: '1px solid var(--cyan-border)',
      }}
    >
      {initials(name)}
    </div>
  )
}
