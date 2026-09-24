import type { SubjectPerformance } from '../../lib/api'

type SubjectPerformanceListProps = {
  data: SubjectPerformance[]
}

export function SubjectPerformanceList({ data }: SubjectPerformanceListProps) {
  if (data.length === 0) return null

  return (
    <div className="mt-6 space-y-3 border-t border-border-subtle pt-6">
      {data.slice(0, 8).map((item) => (
        <div key={item.subject} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">{item.subject}</span>
            <span className="shrink-0 text-muted">
              {item.correct}/{item.total} acertos ·{' '}
              <span className="font-medium text-accent">{item.accuracy}%</span>
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-overlay">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${item.accuracy}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
