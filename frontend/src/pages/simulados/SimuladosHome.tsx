import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { TopicCascadeSelects } from '../../components/simulation/TopicCascadeSelects'
import { PageHeader } from '../../components/ui/PageHeader'
import { useAuth } from '../../contexts/AuthContext'
import {
  deleteSimulation,
  fetchEnemPracticeMeta,
  fetchSimulationHistoryAll,
  startSimulation,
} from '../../lib/simulations-api'
import type {
  EnemPracticeSubject,
  EnemSubjectArea,
  SimulationHistoryItem,
  SimulationMode,
  SubjectPracticeFilter,
} from '../../types/simulation'
import {
  ENEM_FOREIGN_LANGUAGE_OPTIONS,
  SIMULATION_MODES,
  SIMULATION_TIMER_OPTIONS,
  SUBJECT_PRACTICE_MAX_QUESTIONS,
  SUBJECT_PRACTICE_QUESTION_PRESETS,
  TIME_DAY_SECONDS,
  TIME_ESSAY_SECONDS,
  type EnemForeignLanguage,
} from '../../types/simulation'

function loadableQuestionCount(available: number): number {
  return Math.min(available, SUBJECT_PRACTICE_MAX_QUESTIONS)
}

function defaultQuestionSelection(available: number): number | 'all' {
  const loadable = loadableQuestionCount(available)
  if (loadable <= 0) return 10
  if (loadable < 5) return 'all'

  const preset = SUBJECT_PRACTICE_QUESTION_PRESETS.find((count) => count <= loadable)
  return preset ?? 'all'
}

function defaultTimerForMode(mode: SimulationMode): number | null {
  if (mode === 'day_one' || mode === 'day_two') {
    return TIME_DAY_SECONDS
  }
  if (mode === 'essay') {
    return TIME_ESSAY_SECONDS
  }
  return null
}

export function SimuladosHome() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [subjectAreas, setSubjectAreas] = useState<EnemSubjectArea[]>([])
  const [practiceSubjects, setPracticeSubjects] = useState<EnemPracticeSubject[]>([])
  const [history, setHistory] = useState<SimulationHistoryItem[]>([])
  const [inProgress, setInProgress] = useState<SimulationHistoryItem[]>([])
  const [mode, setMode] = useState<SimulationMode>('subject_practice')
  const [practiceFilter, setPracticeFilter] = useState<SubjectPracticeFilter>('subject')
  const [subjectArea, setSubjectArea] = useState('')
  const [subjectName, setSubjectName] = useState('')
  const [questionCount, setQuestionCount] = useState<number | 'all'>(10)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number | null>(null)
  const [foreignLanguage, setForeignLanguage] = useState<EnemForeignLanguage>('Inglês')
  const [loading, setLoading] = useState(true)
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [starting, setStarting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isSubjectPractice = mode === 'subject_practice'
  const isDaySimulation = mode === 'day_one' || mode === 'day_two'
  const isEssaySimulation = mode === 'essay'

  const selectedSubjectArea = subjectAreas.find((item) => item.area === subjectArea)
  const selectedPracticeSubject = practiceSubjects.find((item) => item.name === subjectName)
  const availableCount =
    practiceFilter === 'subject'
      ? (selectedPracticeSubject?.count ?? 0)
      : (selectedSubjectArea?.count ?? 0)
  const loadableCount = loadableQuestionCount(availableCount)

  const practiceSubjectsByArea = useMemo(() => {
    const groups = new Map<string, EnemPracticeSubject[]>()

    for (const subject of practiceSubjects) {
      const area = subject.knowledgeArea ?? 'Outras'
      const list = groups.get(area) ?? []
      list.push(subject)
      groups.set(area, list)
    }

    return [...groups.entries()]
  }, [practiceSubjects])

  const questionOptions = useMemo(() => {
    const presets = SUBJECT_PRACTICE_QUESTION_PRESETS.filter((count) => count <= loadableCount)
    return { presets, showAll: loadableCount > 0, loadableCount }
  }, [loadableCount])

  useEffect(() => {
    if (!token) return

    fetchSimulationHistoryAll(token)
      .then(({ finished, inProgress }) => {
        setHistory(finished)
        setInProgress(inProgress)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false))
  }, [token])

  function getContinuePath(item: SimulationHistoryItem): string {
    if (item.mode === 'essay') {
      return `/simulados/${item.id}/redacao`
    }
    return `/simulados/${item.id}`
  }

  useEffect(() => {
    if (!token || !isSubjectPractice) return

    setLoadingMeta(true)

    const topicFromUrl = searchParams.get('topico')?.trim() ?? ''
    const practiceFromUrl = searchParams.get('pratica')

    fetchEnemPracticeMeta(token)
      .then(({ subjects: subjectsData, areas: areasData }) => {
        setPracticeSubjects(subjectsData)
        setSubjectAreas(areasData)

        if (practiceFromUrl === 'topic') {
          setPracticeFilter('topic')
        }

        const matchedTopic = areasData.find((item) => item.area === topicFromUrl)

        if (subjectsData.length > 0) {
          setSubjectName(subjectsData[0].name)
          if (practiceFromUrl !== 'topic') {
            setQuestionCount(defaultQuestionSelection(subjectsData[0].count))
          }
        }

        if (matchedTopic) {
          setSubjectArea(matchedTopic.area)
          setQuestionCount(defaultQuestionSelection(matchedTopic.count))
        } else if (areasData.length > 0 && practiceFromUrl === 'topic') {
          const firstRoot = areasData.find((item) => item.depth === 0) ?? areasData[0]
          setSubjectArea(firstRoot.area)
          setQuestionCount(defaultQuestionSelection(firstRoot.count))
        } else if (areasData.length > 0) {
          const firstRoot = areasData.find((item) => item.depth === 0) ?? areasData[0]
          setSubjectArea(firstRoot.area)
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar opções'))
      .finally(() => setLoadingMeta(false))
  }, [token, isSubjectPractice, searchParams])

  useEffect(() => {
    setTimeLimitSeconds(defaultTimerForMode(mode))
  }, [mode])

  useEffect(() => {
    if (!isSubjectPractice || loadableCount === 0) return

    if (questionCount === 'all') return

    if (questionCount > loadableCount) {
      setQuestionCount(defaultQuestionSelection(availableCount))
    }
  }, [isSubjectPractice, availableCount, loadableCount, questionCount])

  function handlePracticeFilterChange(nextFilter: SubjectPracticeFilter) {
    setPracticeFilter(nextFilter)

    if (nextFilter === 'subject') {
      const next = practiceSubjects.find((item) => item.name === subjectName) ?? practiceSubjects[0]
      if (next) {
        setSubjectName(next.name)
        setQuestionCount(defaultQuestionSelection(next.count))
      }
      return
    }

    const next = subjectAreas.find((item) => item.area === subjectArea) ?? subjectAreas[0]
    if (next) {
      setSubjectArea(next.area)
      setQuestionCount(defaultQuestionSelection(next.count))
    }
  }

  function handleSubjectNameChange(nextName: string) {
    setSubjectName(nextName)
    const next = practiceSubjects.find((item) => item.name === nextName)
    if (next) {
      setQuestionCount(defaultQuestionSelection(next.count))
    }
  }

  function handleSubjectAreaChange(nextArea: string) {
    setSubjectArea(nextArea)
    const next = subjectAreas.find((item) => item.area === nextArea)
    if (next) {
      setQuestionCount(defaultQuestionSelection(next.count))
    }
  }

  async function handleDeleteInProgress(attemptId: string) {
    if (!token || deletingId) return

    const confirmed = window.confirm(
      'Excluir este simulado em andamento? O progresso será perdido.',
    )
    if (!confirmed) return

    setDeletingId(attemptId)
    setError(null)

    try {
      await deleteSimulation(token, attemptId)
      setInProgress((prev) => prev.filter((item) => item.id !== attemptId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir simulado')
    } finally {
      setDeletingId(null)
    }
  }

  async function handleStart() {
    setError(null)
    setStarting(true)

    try {
      const payload = isSubjectPractice
        ? {
            mode,
            ...(practiceFilter === 'subject' ? { subjectName } : { subjectArea }),
            questionCount: questionCount === 'all' ? null : questionCount,
            timeLimitSeconds,
          }
        : mode === 'day_one'
          ? {
              mode,
              foreignLanguage,
              timeLimitSeconds,
            }
          : {
              mode,
              timeLimitSeconds,
            }

      const { attempt } = await startSimulation(token, payload)
      const destination =
        mode === 'essay' ? `/simulados/${attempt.id}/redacao` : `/simulados/${attempt.id}`
      navigate(destination, {
        state: { attempt },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao iniciar simulado')
    } finally {
      setStarting(false)
    }
  }

  const canStart = isSubjectPractice
    ? !starting &&
      !loadingMeta &&
      availableCount > 0 &&
      (practiceFilter === 'subject' ? Boolean(subjectName) : Boolean(subjectArea))
    : !starting

  if (loading) {
    return <p className="text-muted">Carregando simulados...</p>
  }

  const selectedMode = SIMULATION_MODES.find((m) => m.value === mode)

  return (
    <div className="max-w-5xl space-y-10">
      <PageHeader
        eyebrow="Simulados"
        title="Pratique com questões reais do ENEM"
        description="Pratique por matéria ou tópico, ou simule o 1º ou 2º dia completo com questões aleatórias de vários anos."
      />

      <section className="rounded-[var(--radius-card)] border border-border-subtle bg-surface-raised/90 p-6">
        <h2 className="font-display text-lg font-semibold text-foreground">Novo simulado</h2>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm text-muted-foreground">Tipo de simulado</span>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as SimulationMode)}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-white outline-none focus:border-accent"
            >
              {SIMULATION_MODES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} — {item.description}
                </option>
              ))}
            </select>
          </label>

          {selectedMode && (
            <p className="text-sm text-muted">{selectedMode.description}</p>
          )}

          {mode === 'day_one' && (
            <>
              <label className="block">
                <span className="mb-1.5 block text-sm text-muted-foreground">
                  Língua estrangeira
                </span>
                <select
                  value={foreignLanguage}
                  onChange={(e) => setForeignLanguage(e.target.value as EnemForeignLanguage)}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-white outline-none focus:border-accent"
                >
                  {ENEM_FOREIGN_LANGUAGE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {mode === 'day_two' && (
            <p className="text-sm text-muted">
              90 questões distribuídas por disciplina (padrão ENEM), sorteadas entre todos os
              anos disponíveis. Cada simulado é único em relação aos seus anteriores.
            </p>
          )}

          {isEssaySimulation && (
            <p className="text-sm text-muted">
              Tema gerado aleatoriamente pela IA. Escreva sua dissertação no tempo configurado e
              receba correção nas 5 competências do ENEM.
            </p>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isSubjectPractice && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-sm text-muted-foreground">Praticar por</span>
                  <select
                    value={practiceFilter}
                    onChange={(e) =>
                      handlePracticeFilterChange(e.target.value as SubjectPracticeFilter)
                    }
                    disabled={loadingMeta}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-white outline-none focus:border-accent disabled:opacity-60"
                  >
                    <option value="subject">Matéria ENEM</option>
                    <option value="topic">Tópico específico</option>
                  </select>
                </label>

                {practiceFilter === 'subject' ? (
                  <label className="block sm:col-span-2">
                    <span className="mb-1.5 block text-sm text-muted-foreground">Matéria</span>
                    <select
                      value={subjectName}
                      onChange={(e) => handleSubjectNameChange(e.target.value)}
                      disabled={loadingMeta || practiceSubjects.length === 0}
                      className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-white outline-none focus:border-accent disabled:opacity-60"
                    >
                      {loadingMeta ? (
                        <option value="">Carregando...</option>
                      ) : (
                        practiceSubjectsByArea.map(([area, subjects]) => (
                          <optgroup key={area} label={area}>
                            {subjects.map((item) => (
                              <option key={item.name} value={item.name}>
                                {item.name} ({item.count})
                              </option>
                            ))}
                          </optgroup>
                        ))
                      )}
                    </select>
                  </label>
                ) : (
                  <div className="space-y-3 sm:col-span-2 lg:col-span-3">
                    <TopicCascadeSelects
                      areas={subjectAreas}
                      value={subjectArea}
                      onChange={handleSubjectAreaChange}
                      disabled={loadingMeta || subjectAreas.length === 0}
                    />
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      <Link
                        to="/simulados/topicos"
                        className="font-medium text-accent hover:underline"
                      >
                        Explorar tópicos visualmente
                      </Link>
                      {selectedSubjectArea && (
                        <span className="text-muted">
                          {selectedSubjectArea.count} questões (inclui subtópicos)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {practiceFilter === 'subject' && (
                  <p className="text-sm text-muted sm:col-span-3">
                    Questões sorteadas entre vários tópicos e anos da matéria selecionada.
                  </p>
                )}

                <label className="block">
                  <span className="mb-1.5 block text-sm text-muted-foreground">Questões</span>
                  <select
                    value={questionCount === 'all' ? 'all' : String(questionCount)}
                    onChange={(e) => {
                      const value = e.target.value
                      setQuestionCount(value === 'all' ? 'all' : Number(value))
                    }}
                    disabled={loadingMeta || availableCount === 0}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-white outline-none focus:border-accent disabled:opacity-60"
                  >
                    {questionOptions.presets.map((count) => (
                      <option key={count} value={count}>
                        {count} questões
                      </option>
                    ))}
                    {questionOptions.showAll && (
                      <option value="all">
                        Todas ({questionOptions.loadableCount}
                        {availableCount > SUBJECT_PRACTICE_MAX_QUESTIONS
                          ? ` de ${availableCount}`
                          : ''}
                        )
                      </option>
                    )}
                  </select>
                </label>
              </>
            )}

            {(isSubjectPractice || isDaySimulation || isEssaySimulation) && (
              <label className="block">
                <span className="mb-1.5 block text-sm text-muted-foreground">Cronômetro</span>
                <select
                  value={timeLimitSeconds === null ? 'unlimited' : String(timeLimitSeconds)}
                  onChange={(e) => {
                    const value = e.target.value
                    setTimeLimitSeconds(value === 'unlimited' ? null : Number(value))
                  }}
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-white outline-none focus:border-accent"
                >
                  {SIMULATION_TIMER_OPTIONS.map((option) => (
                    <option
                      key={option.label}
                      value={option.value === null ? 'unlimited' : String(option.value)}
                    >
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={!canStart}
          className="mt-6 rounded-lg bg-accent-strong px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
        >
          {starting
            ? isDaySimulation
              ? 'Montando simulado de 90 questões...'
              : `Buscando ${questionCount === 'all' ? questionOptions.loadableCount : questionCount} questões...`
            : 'Iniciar simulado'}
        </button>
      </section>

      {inProgress.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-white">Em andamento</h2>
          <div className="mt-4 space-y-3">
            {inProgress.map((item) => (
              <div
                key={item.id}
                className="flex items-stretch overflow-hidden rounded-xl border border-amber-500/30 bg-amber-500/5 transition hover:border-amber-400/50"
              >
                <Link
                  to={getContinuePath(item)}
                  className="flex min-w-0 flex-1 items-center justify-between px-5 py-4"
                >
                  <div>
                    <p className="font-medium text-white">
                      {item.attemptTitle ??
                        (item.exam_year ? `ENEM ${item.exam_year}` : 'Simulado')}{' '}
                      — {item.disciplineLabel ?? item.discipline}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      Iniciado em {new Date(item.started_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <span className="ml-4 shrink-0 text-sm font-medium text-amber-300">
                    Continuar
                  </span>
                </Link>
                <button
                  type="button"
                  aria-label="Excluir simulado em andamento"
                  disabled={deletingId === item.id}
                  onClick={() => void handleDeleteInProgress(item.id)}
                  className="shrink-0 border-l border-amber-500/20 px-4 text-sm text-muted transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-60"
                >
                  {deletingId === item.id ? '...' : 'Excluir'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold text-white">Histórico</h2>

        {history.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Nenhum simulado realizado ainda.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {history.map((item) => (
              <Link
                key={item.id}
                to={`/simulados/${item.id}/resultado`}
                className="flex items-center justify-between rounded-xl border border-border-subtle bg-surface-raised/90 px-5 py-4 transition hover:border-accent/35"
              >
                <div>
                  <p className="font-medium text-white">
                    {item.attemptTitle ?? (item.exam_year ? `ENEM ${item.exam_year}` : 'Simulado')}{' '}
                    — {item.disciplineLabel ?? item.discipline}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {new Date(item.finished_at!).toLocaleDateString('pt-BR')}
                    {item.elapsed_seconds
                      ? ` · ${Math.floor(item.elapsed_seconds / 60)} min`
                      : ''}
                  </p>
                </div>
                <p className="text-lg font-bold text-accent">
                  {item.score}/{item.total}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
