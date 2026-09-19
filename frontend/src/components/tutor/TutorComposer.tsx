import { useState, type FormEvent } from 'react'

type TutorComposerProps = {
  disabled?: boolean
  placeholder?: string
  onSend: (content: string) => Promise<void>
}

export function TutorComposer({
  disabled = false,
  placeholder = 'Digite sua dúvida...',
  onSend,
}: TutorComposerProps) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const trimmed = content.trim()
    if (!trimmed || disabled || sending) return

    setSending(true)
    try {
      await onSend(trimmed)
      setContent('')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="flex gap-2">
      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={placeholder}
        disabled={disabled || sending}
        rows={2}
        className="min-h-[44px] flex-1 resize-none rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || sending || !content.trim()}
        className="self-end rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {sending ? '...' : 'Enviar'}
      </button>
    </form>
  )
}
