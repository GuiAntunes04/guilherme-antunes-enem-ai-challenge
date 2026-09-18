import { useEffect, useState } from 'react'

type SimulationTimerProps = {
  startedAt: string
  timeLimitSeconds: number
  onExpire: () => void
}

function formatTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  }

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function computeRemaining(startedAt: string, timeLimitSeconds: number): number {
  const elapsed = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
  return Math.max(timeLimitSeconds - elapsed, 0)
}

export function SimulationTimer({
  startedAt,
  timeLimitSeconds,
  onExpire,
}: SimulationTimerProps) {
  const [remaining, setRemaining] = useState(() =>
    computeRemaining(startedAt, timeLimitSeconds),
  )

  useEffect(() => {
    const interval = setInterval(() => {
      const next = computeRemaining(startedAt, timeLimitSeconds)
      setRemaining(next)
      if (next <= 0) {
        clearInterval(interval)
        onExpire()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startedAt, timeLimitSeconds, onExpire])

  const isLow = remaining <= 300

  return (
    <div
      className={`rounded-lg border px-3 py-1.5 text-sm font-mono tabular-nums ${
        isLow
          ? 'border-red-500/50 bg-red-500/10 text-red-300'
          : 'border-slate-700 bg-slate-800 text-slate-200'
      }`}
    >
      {formatTime(remaining)}
    </div>
  )
}

export function getElapsedSeconds(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)
}
