type EssayThemePanelProps = {
  theme: string
  motivators: string[]
}

export function EssayThemePanel({ theme, motivators }: EssayThemePanelProps) {
  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-emerald-400">Tema</p>
      <h2 className="mt-2 text-lg font-semibold text-white">{theme}</h2>
      {motivators.length > 0 && (
        <div className="mt-4 space-y-3">
          <p className="text-xs text-slate-500">Textos motivadores</p>
          {motivators.map((motivator, index) => (
            <p key={index} className="text-sm leading-relaxed text-slate-300">
              {motivator}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
