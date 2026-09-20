import type { EssayRow } from '../types/essay.js'

export function mapEssay(row: EssayRow) {
  return {
    id: row.id,
    theme: row.theme,
    motivators: row.motivators ?? [],
    content: row.content ?? '',
    source: row.source,
    status: row.status,
    aiFeedback: row.ai_feedback,
    timeLimitSeconds: row.time_limit_seconds,
    elapsedSeconds: row.elapsed_seconds,
    quizStartedAt: row.quiz_started_at,
    finishedAt: row.finished_at,
    createdAt: row.created_at,
  }
}

export function computeEssayElapsedSeconds(
  essay: Pick<EssayRow, 'quiz_started_at' | 'time_limit_seconds'>,
  clientElapsedSeconds: number,
): number | null {
  if (!essay.quiz_started_at) {
    return clientElapsedSeconds > 0 ? clientElapsedSeconds : null
  }

  const serverElapsed = Math.max(
    0,
    Math.floor((Date.now() - new Date(essay.quiz_started_at).getTime()) / 1000),
  )

  if (essay.time_limit_seconds && serverElapsed > 0) {
    return Math.min(serverElapsed, essay.time_limit_seconds + 30)
  }

  return serverElapsed || null
}
