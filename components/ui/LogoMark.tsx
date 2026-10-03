// Groundwork "GW" monogram — same artwork as app/icon.svg (favicon).
export function LogoMark({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} role="img" aria-label="Groundwork">
      <rect width="64" height="64" rx="12" fill="#060d1a" />
      <rect x="3" y="3" width="58" height="58" rx="10" fill="none" stroke="#00d4f5" strokeWidth="3" />
      <text x="32" y="38" textAnchor="middle" fontFamily="Arial Black, Helvetica, Arial, sans-serif" fontWeight={900} fontSize="24" letterSpacing="-1" fill="#00d4f5">GW</text>
      <rect x="14" y="46" width="36" height="4" rx="2" fill="#00d4f5" />
    </svg>
  )
}
