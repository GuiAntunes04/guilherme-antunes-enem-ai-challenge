import { useCallback, useEffect, useRef, useState } from 'react'
import {
  beginEssayQuiz,
  evaluateEssay,
  fetchEssay,
  importEssayFile,
  saveEssayDraft,
} from '../../lib/essays-api'
import type { Essay } from '../../types/essay'
import { MIN_ESSAY_CHARS } from '../../types/essay'
import { formatTime, getElapsedSeconds, SimulationTimer } from '../simulation/SimulationTimer'
import { EssayEditor } from './EssayEditor'
import { EssayFeedbackPanel } from './EssayFeedbackPanel'
import { EssayImportPanel } from './EssayImportPanel'
import { EssayThemePanel } from './EssayThemePanel'

type EssayWorkbenchProps = {
  token: string
  essayId: string
  timed?: boolean
  onEvaluated?: (essay: Essay) => void
}

export function EssayWorkbench({
  token,
  essayId,
  timed = false,
  onEvaluated,
}: EssayWorkbenchProps) {
  const [essay, setEssay] = useState<Essay | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [evaluating, setEvaluating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quizStartedAt, setQuizStartedAt] = useState<string | null>(null)
  const saveTimeoutRef = useRef<number | null>(null)
  const quizStartedAtRef = useRef<string | null>(null)

  useEffect(() => {
    quizStartedAtRef.current = quizStartedAt
  }, [quizStartedAt])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)

      try {
        const { essay: loaded } = await fetchEssay(token, essayId)
        if (cancelled) return

        setEssay(loaded)
        setContent(loaded.content)
        setQuizStartedAt(loaded.quizStartedAt)

        if (timed && loaded.status === 'draft' && !loaded.quizStartedAt) {
          const { essay: begun } = await beginEssayQuiz(token, essayId)
          if (cancelled) return
          setEssay(begun)
          setQuizStartedAt(begun.quizStartedAt)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar redação')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [token, essayId, timed])

  const scheduleSave = useCallback(
    (nextContent: string) => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current)
      }

      saveTimeoutRef.current = window.setTimeout(() => {
        setSaving(true)
        void saveEssayDraft(token, essayId, nextContent)
          .then(({ essay: saved }) => setEssay(saved))
          .catch(() => {
            /* autosave failures are non-blocking */
          })
          .finally(() => setSaving(false))
      }, 800)
    },
    [token, essayId],
  )

  function handleContentChange(nextContent: string) {
    setContent(nextContent)
    if (essay?.status === 'draft') {
      scheduleSave(nextContent)
    }
  }

  async function handleEvaluate() {
    if (!essay || essay.status === 'done') return

    if (content.trim().length < MIN_ESSAY_CHARS) {
      setError(`Escreva pelo menos ${MIN_ESSAY_CHARS} caracteres antes de enviar.`)
      return
    }

    setEvaluating(true)
    setError(null)

    try {
      const elapsed = quizStartedAtRef.current
        ? getElapsedSeconds(quizStartedAtRef.current)
        : 0

      const { essay: evaluated } = await evaluateEssay(token, essayId, content, elapsed)
      setEssay(evaluated)
      onEvaluated?.(evaluated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao corrigir redação')
    } finally {
      setEvaluating(false)
    }
  }

  if (loading) {
    return <p className="text-slate-400">Carregando redação...</p>
  }

  if (error && !essay) {
    return <p className="text-red-300">{error}</p>
  }

  if (!essay) return null

  if (essay.status === 'done' && essay.aiFeedback) {
    return (
      <div className="space-y-6">
        <EssayThemePanel theme={essay.theme} motivators={essay.motivators} />
        <EssayFeedbackPanel feedback={essay.aiFeedback} />
        <details className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <summary className="cursor-pointer text-sm text-slate-300">Ver redação enviada</summary>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-400">
            {essay.content}
          </p>
        </details>
      </div>
    )
  }

  const timerPanel =
    timed && essay.timeLimitSeconds && quizStartedAt ? (
      <SimulationTimer
        startedAt={quizStartedAt}
        timeLimitSeconds={essay.timeLimitSeconds}
        onExpire={() => void handleEvaluate()}
      />
    ) : timed && essay.timeLimitSeconds ? (
      <div className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm font-mono tabular-nums text-slate-400">
        {formatTime(essay.timeLimitSeconds)}
      </div>
    ) : null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-slate-400">{saving ? 'Salvando rascunho...' : 'Rascunho salvo automaticamente'}</p>
        {timerPanel}
      </div>

      <EssayThemePanel theme={essay.theme} motivators={essay.motivators} />

      <EssayImportPanel
        disabled={evaluating}
        onImport={(file) => importEssayFile(token, essayId, file).then((r) => r.extractedText)}
        onApply={(text) => handleContentChange(text)}
      />

      <EssayEditor value={content} onChange={handleContentChange} disabled={evaluating} />

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={evaluating || content.trim().length < MIN_ESSAY_CHARS}
        onClick={() => void handleEvaluate()}
        className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
      >
        {evaluating ? 'Corrigindo com IA...' : 'Enviar para correção'}
      </button>
    </div>
  )
}
