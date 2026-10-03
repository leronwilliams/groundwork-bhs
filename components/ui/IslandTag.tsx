import { Anchor, Building2 } from 'lucide-react'

interface IslandTagProps {
  island: string
  className?: string
}

export function IslandTag({ island, className = '' }: IslandTagProps) {
  const isFamily = !['new providence', 'nassau'].includes(island.toLowerCase())
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-wider px-2 py-0.5 rounded-sm font-mono ${className}`}
      style={{
        background: isFamily ? 'rgba(245,158,11,0.1)' : 'rgba(6,182,212,0.08)',
        color: isFamily ? '#f59e0b' : '#06b6d4',
        border: `1px solid ${isFamily ? 'rgba(245,158,11,0.3)' : 'rgba(6,182,212,0.2)'}`,
      }}
    >
      {isFamily ? <Anchor size={12} strokeWidth={2.25} aria-hidden /> : <Building2 size={12} strokeWidth={2.25} aria-hidden />}
      {island}
    </span>
  )
}
