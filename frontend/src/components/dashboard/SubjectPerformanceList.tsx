import type { SubjectPerformance } from '../../lib/api'

type SubjectPerformanceListProps = {
  data: SubjectPerformance[]
}

export function SubjectPerformanceList({ data }: SubjectPerformanceListProps) {
  if (data.length === 0) return null

  return (
    <div className="mt-4 space-y-2">
      {data.slice(0, 6).map((item) => (
        <div key={item.subject} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-300">{item.subject}</span>
            <span className="font-medium text-emerald-400">{item.accuracy}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${item.accuracy}%` }}
            />
          </div>
          <p className="text-xs text-slate-500">
            {item.correct}/{item.total} acertos · {item.area}
          </p>
        </div>
      ))}
    </div>
  )
}
