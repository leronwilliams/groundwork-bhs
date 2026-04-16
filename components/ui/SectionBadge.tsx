interface SectionBadgeProps {
  label: string
  className?: string
}

const COLORS: Record<string, string> = {
  legal: '#7c3aed',
  finance: '#059669',
  design: '#2563eb',
  permits: '#dc2626',
  contractors: '#f59e0b',
  insurance: '#0891b2',
  'property-tax': '#c2410c',
  default: '#06b6d4',
}

export function SectionBadge({ label, className = '' }: SectionBadgeProps) {
  const color = COLORS[label.toLowerCase()] || COLORS.default
  return (
    <span
      className={`inline-flex items-center text-xs uppercase tracking-wider px-2 py-0.5 rounded-sm font-mono ${className}`}
      style={{
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {label}
    </span>
  )
}
