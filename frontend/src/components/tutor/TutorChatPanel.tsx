import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import {
  fetchTutorMessages,
  getOrCreateSimulationTutorSession,
  sendTutorMessage,
} from '../../lib/tutor-api'
import type { SimulationQuestion } from '../../types/simulation'
import type { TutorMessage } from '../../types/tutor'
import { TutorComposer } from './TutorComposer'
import { TutorMessageList } from './TutorMessageList'

type TutorChatPanelProps = {
  mode: 'simulation' | 'general'
  sessionId?: string
  attemptId?: string
  question?: SimulationQuestion
  title?: string
  compact?: boolean
}

export function TutorChatPanel({
  mode,
  sessionId: externalSessionId,
  attemptId,
  question,
  title,
  compact = false,
}: TutorChatPanelProps) {
  const { session } = useAuth()
  const token = session?.access_token ?? ''

  const [sessionId, setSessionId] = useState<string | null>(externalSessionId ?? null)
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setSessionId(externalSessionId ?? null)
  }, [externalSessionId])

  useEffect(() => {
    if (!token) return

    let cancelled = false

    async function bootstrap() {
      setLoading(true)
      setError(null)
      setMessages([])

      try {
        let activeSessionId = externalSessionId ?? null

        if (mode === 'simulation') {
          if (!attemptId || !question?.id) {
            throw new Error('Simulado ou questão indisponível para o tutor')
          }

          const simulationSession = await getOrCreateSimulationTutorSession(
            token,
            attemptId,
            question.id,
          )
          activeSessionId = simulationSession.id
        }

        if (!activeSessionId) {
          setSessionId(null)
          return
        }

        if (cancelled) return

        setSessionId(activeSessionId)

        const data = await fetchTutorMessages(token, activeSessionId)
        if (cancelled) return

        setMessages(data.messages)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erro ao carregar tutor')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [token, mode, externalSessionId, attemptId, question?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  async function handleSend(content: string) {
    if (!token || !sessionId) return

    setSending(true)
    setError(null)

    const optimisticUserMessage: TutorMessage = {
      id: `temp-user-${Date.now()}`,
      sessionId,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, optimisticUserMessage])

    try {
      const response = await sendTutorMessage(token, sessionId, content)
      setMessages((prev) => {
        const withoutOptimistic = prev.filter((message) => message.id !== optimisticUserMessage.id)
        const newMessages = response.messages.filter(
          (message) => !withoutOptimistic.some((existing) => existing.id === message.id),
        )
        return [...withoutOptimistic, ...newMessages]
      })
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.id !== optimisticUserMessage.id))
      setError(err instanceof Error ? err.message : 'Erro ao enviar mensagem')
    } finally {
      setSending(false)
    }
  }

  const panelTitle =
    title ??
    (mode === 'simulation' ? 'Tutor IA — questão atual' : 'Tutor IA')

  return (
    <aside
      className={`flex flex-col rounded-xl border border-slate-800 bg-slate-900/50 ${
        compact ? 'p-4' : 'p-5'
      } ${mode === 'simulation' ? 'lg:sticky lg:top-6 lg:max-h-[calc(100vh-6rem)]' : 'h-full min-h-[420px]'}`}
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold text-white">{panelTitle}</h2>
        {mode === 'simulation' && question && (
          <p className="mt-1 text-xs text-slate-500">
            {question.subjectName ?? 'Questão'} — ENEM {question.year}
          </p>
        )}
      </div>

      <div className="mb-4 flex-1 overflow-y-auto pr-1">
        {loading ? (
          <p className="text-sm text-slate-400">Carregando conversa...</p>
        ) : (
          <TutorMessageList messages={messages} sending={sending} />
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      <TutorComposer
        disabled={loading || !sessionId}
        placeholder={
          mode === 'simulation'
            ? 'Ex.: Explique o enunciado ou o conceito...'
            : 'Digite sua dúvida sobre ENEM...'
        }
        onSend={handleSend}
      />
    </aside>
  )
}
