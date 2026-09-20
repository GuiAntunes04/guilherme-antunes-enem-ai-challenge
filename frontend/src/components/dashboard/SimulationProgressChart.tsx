import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { SimulationTrendPoint } from '../../lib/api'

type SimulationProgressChartProps = {
  data: SimulationTrendPoint[]
}

export function SimulationProgressChart({ data }: SimulationProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-6 text-center text-sm text-slate-400">
        Seu histórico de simulados aparecerá aqui conforme você for praticando.
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#1e293b" strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            interval="preserveStartEnd"
            angle={-20}
            textAnchor="end"
            height={56}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickFormatter={(value) => `${value}%`}
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
              const point = payload?.payload as SimulationTrendPoint | undefined
              if (!point) return [`${numeric}%`, 'Desempenho']
              return [`${point.score}/${point.total} (${numeric}%)`, 'Desempenho']
            }}
          />
          <Line
            type="monotone"
            dataKey="accuracy"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ fill: '#38bdf8', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
