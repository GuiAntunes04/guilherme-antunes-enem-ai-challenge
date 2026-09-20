import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import type { SubjectPerformance } from '../../lib/api'

type SubjectRadarChartProps = {
  data: SubjectPerformance[]
}

export function SubjectRadarChart({ data }: SubjectRadarChartProps) {
  if (data.length < 2) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 text-center text-sm text-slate-400">
        Faça simulados com questões objetivas para ver seu desempenho por matéria.
      </div>
    )
  }

  const chartData = data.slice(0, 10).map((item) => ({
    subject: item.subject,
    accuracy: item.accuracy,
    correct: item.correct,
    total: item.total,
  }))

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 16, right: 24, bottom: 8, left: 24 }}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Taxa de acerto"
            dataKey="accuracy"
            stroke="#34d399"
            fill="#34d399"
            fillOpacity={0.35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#0f172a',
              border: '1px solid #334155',
              borderRadius: '0.5rem',
              color: '#e2e8f0',
            }}
            formatter={(value, _name, payload) => {
              const numeric = typeof value === 'number' ? value : Number(value ?? 0)
              const correct = payload?.payload?.correct as number | undefined
              const total = payload?.payload?.total as number | undefined
              const hits =
                correct !== undefined && total !== undefined
                  ? `${correct}/${total} acertos`
                  : null
              return [hits ? `${numeric}% · ${hits}` : `${numeric}%`, 'Desempenho']
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
