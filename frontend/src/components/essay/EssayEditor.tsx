type EssayEditorProps = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function EssayEditor({ value, onChange, disabled = false }: EssayEditorProps) {
  const lineCount = value.split('\n').length
  const charCount = value.length

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">Sua redação</p>
        <p className="text-xs text-slate-500">
          {lineCount} linha{lineCount !== 1 ? 's' : ''} · {charCount} caracteres
        </p>
      </div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder="Escreva sua redação dissertativo-argumentativa aqui..."
        className="min-h-[320px] w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-slate-200 outline-none focus:border-emerald-500 disabled:opacity-60"
      />
    </div>
  )
}
