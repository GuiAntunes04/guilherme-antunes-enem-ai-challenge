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
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">Importar redação</p>
          <p className="text-xs text-slate-500">Foto, PDF, DOCX ou TXT</p>
        </div>
        <button
          type="button"
          disabled={disabled || loading}
          onClick={() => inputRef.current?.click()}
          className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-slate-500 disabled:opacity-60"
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
          <p className="text-xs text-slate-500">Prévia do texto extraído</p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
            {preview}
          </div>
          <button
            type="button"
            onClick={() => {
              onApply(preview)
              setPreview(null)
            }}
            className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Usar no editor
          </button>
        </div>
      )}
    </section>
  )
}
