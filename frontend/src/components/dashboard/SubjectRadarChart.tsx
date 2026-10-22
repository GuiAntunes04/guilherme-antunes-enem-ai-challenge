import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useChartPalette } from '../../contexts/ThemeContext'
import type { SubjectPerformance } from '../../lib/api'

type SubjectRadarChartProps = {
  data: SubjectPerformance[]
}

export function SubjectRadarChart({ data }: SubjectRadarChartProps) {
  const chart = useChartPalette()

  if (data.length < 2) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[var(--radius-card)] border border-dashed border-border bg-surface/40 px-6 text-center text-sm text-muted">
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
          <PolarGrid stroke={chart.grid} />
          <PolarAngleAxis dataKey="subject" tick={{ fill: chart.tick, fontSize: 11 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: chart.tickMuted, fontSize: 10 }}
            tickCount={5}
          />
          <Radar
            name="Taxa de acerto"
            dataKey="accuracy"
            stroke={chart.fill}
            fill={chart.fill}
            fillOpacity={0.35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: chart.tooltipBg,
              border: `1px solid ${chart.tooltipBorder}`,
              borderRadius: '0.5rem',
              color: chart.tooltipText,
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
