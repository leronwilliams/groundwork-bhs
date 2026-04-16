'use client'

const STAGES = ['Plan', 'Legal', 'Finance', 'Design', 'Permits', 'Build']

interface StageTrackerProps {
  currentStage: number // 1-6
  className?: string
}

export function StageTracker({ currentStage, className = '' }: StageTrackerProps) {
  return (
    <div className={`flex items-center w-full ${className}`}>
      {STAGES.map((stage, i) => {
        const stageNum = i + 1
        const completed = stageNum < currentStage
        const active = stageNum === currentStage

        return (
          <div key={stage} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              {/* Dot */}
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all"
                style={{
                  background: completed ? 'var(--cyan)' : active ? 'var(--navy-surface)' : 'var(--navy)',
                  border: completed
                    ? '2px solid var(--cyan)'
                    : active
                    ? '2px solid var(--cyan)'
                    : '2px solid var(--muted)',
                  color: completed ? 'var(--navy)' : active ? 'var(--cyan)' : 'var(--muted)',
                  boxShadow: active ? '0 0 12px rgba(6,182,212,0.4)' : 'none',
                  position: 'relative',
                }}
              >
                {completed ? '✓' : stageNum}
                {active && (
                  <span
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: 'var(--amber)', border: '1px solid var(--navy)' }}
                  />
                )}
              </div>
              {/* Label */}
              <span
                className="text-xs mt-1 uppercase tracking-wider"
                style={{
                  color: completed || active ? 'var(--text)' : 'var(--muted)',
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              >
                {stage}
              </span>
            </div>
            {/* Connector line */}
            {i < STAGES.length - 1 && (
              <div
                className="h-px flex-1 max-w-8 mx-1"
                style={{
                  background: completed ? 'var(--cyan)' : 'var(--cyan-border)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
