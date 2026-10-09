'use client'
export function CheckboxGroup({ name, options, value, onChange }: { name: string; options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(o => {
        const on = value.includes(o)
        return (
          <label key={o} className="cursor-pointer text-xs px-3 py-1.5 rounded-sm font-medium select-none"
            style={{ background: on ? 'var(--cyan)' : 'var(--navy-surface)', color: on ? 'var(--navy)' : 'var(--text-secondary)', border: '1px solid var(--cyan-border)' }}>
            <input type="checkbox" name={name} value={o} checked={on} className="sr-only"
              onChange={() => onChange(on ? value.filter(x => x !== o) : [...value, o])} />
            {o}
          </label>
        )
      })}
    </div>
  )
}
