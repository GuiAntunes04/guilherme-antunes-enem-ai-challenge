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

const CHART = {
  grid: '#243047',
  tick: '#94a3b8',
  tickMuted: '#64748b',
  line: '#2dd4bf',
  tooltipBg: '#0f1623',
  tooltipBorder: '#243047',
  tooltipText: '#eef2f9',
} as const

type SimulationProgressChartProps = {
  data: SimulationTrendPoint[]
}

export function SimulationProgressChart({ data }: SimulationProgressChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface/40 px-6 text-center text-sm text-muted">
        Seu histórico de simulados aparecerá aqui conforme você for praticando.
      </div>
    )
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART.tick, fontSize: 11 }}
            interval="preserveStartEnd"
            angle={-20}
            textAnchor="end"
            height={56}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: CHART.tickMuted, fontSize: 11 }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: CHART.tooltipBg,
              border: `1px solid ${CHART.tooltipBorder}`,
              borderRadius: '0.5rem',
              color: CHART.tooltipText,
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
            stroke={CHART.line}
            strokeWidth={2}
            dot={{ fill: CHART.line, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
