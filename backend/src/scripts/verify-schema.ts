import { supabaseAdmin } from '../lib/supabase.js'

type Check = {
  name: string
  ok: boolean
  detail?: string
}

async function columnExists(table: string, column: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from(table as 'simulation_attempts')
    .select(column)
    .limit(1)

  if (error) {
    return false
  }

  return Array.isArray(data)
}

async function main() {
  const checks: Check[] = []

  checks.push({
    name: 'simulation_attempts.quiz_started_at',
    ok: await columnExists('simulation_attempts', 'quiz_started_at'),
  })

  checks.push({
    name: 'simulation_attempts.essay_id',
    ok: await columnExists('simulation_attempts', 'essay_id'),
  })

  checks.push({
    name: 'essays.source',
    ok: await columnExists('essays', 'source'),
  })

  checks.push({
    name: 'essays.status',
    ok: await columnExists('essays', 'status'),
  })

  checks.push({
    name: 'tutor_sessions.simulation_attempt_id',
    ok: await columnExists('tutor_sessions', 'simulation_attempt_id'),
  })

  checks.push({
    name: 'tutor_sessions.question_context',
    ok: await columnExists('tutor_sessions', 'question_context'),
  })

  checks.push({
    name: 'enem_questions_index.correct_alternative',
    ok: await columnExists('enem_questions_index', 'correct_alternative'),
  })

  checks.push({
    name: 'enem_questions_index.content',
    ok: await columnExists('enem_questions_index', 'content'),
  })

  const { count, error: indexError } = await supabaseAdmin
    .from('enem_questions_index')
    .select('*', { count: 'exact', head: true })

  checks.push({
    name: 'enem_questions_index populated',
    ok: !indexError && (count ?? 0) > 0,
    detail: indexError?.message ?? `${count ?? 0} rows`,
  })

  console.log('Schema verification:')
  for (const check of checks) {
    console.log(`${check.ok ? 'OK' : 'MISSING'}  ${check.name}${check.detail ? ` (${check.detail})` : ''}`)
  }

  const missing = checks.filter((check) => !check.ok)
  if (missing.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
