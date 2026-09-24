import { useRef, useState } from 'react'

type EssayImportPanelProps = {
  disabled?: boolean
  onImport: (file: File) => Promise<string>
  onApply: (text: string) => void
}

export function EssayImportPanel({ disabled = false, onImport, onApply }: EssayImportPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setPreview(null)

    try {
      const extractedText = await onImport(file)
      setPreview(extractedText)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao importar arquivo')
    } finally {
      setLoading(false)
      event.target.value = ''
    }
  }

  return (
    <section className="rounded-xl border border-border-subtle bg-surface-raised/90 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Importar redação</p>
          <p className="text-xs text-muted">Foto, PDF, DOCX ou TXT</p>
        </div>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:border-muted disabled:opacity-60"
        >
          {loading ? 'Importando...' : 'Escolher arquivo'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,.pdf,.docx,image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => void handleFileChange(event)}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </p>
      )}

      {preview && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted">Prévia do texto extraído</p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-surface p-3 text-xs leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {preview}
          </div>
          <button
            type="button"
            onClick={() => {
              onApply(preview)
              setPreview(null)
            }}
            className="rounded-lg bg-accent-strong px-3 py-2 text-sm font-medium text-white hover:bg-accent"
          >
            Usar no editor
          </button>
        </div>
      )}
    </section>
  )
}
