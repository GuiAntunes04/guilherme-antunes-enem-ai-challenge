import type { EssayFeedback } from '../../types/essay'
import { ESSAY_COMPETENCY_LABELS } from '../../types/essay'

type EssayFeedbackPanelProps = {
  feedback: EssayFeedback
}

export function EssayFeedbackPanel({ feedback }: EssayFeedbackPanelProps) {
  const competencies = Object.entries(feedback.competencias) as [
    keyof EssayFeedback['competencias'],
    { nota: number; feedback: string },
  ][]

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5">
        <p className="text-xs uppercase tracking-wider text-emerald-300">Nota total</p>
        <p className="mt-1 text-3xl font-bold text-white">{feedback.nota_total}/1000</p>
        <p className="mt-3 text-sm leading-relaxed text-slate-200">{feedback.comentario_geral}</p>
      </div>

      <div className="space-y-3">
        {competencies.map(([key, item]) => (
          <article key={key} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-white">{ESSAY_COMPETENCY_LABELS[key]}</h3>
              <span className="text-sm font-semibold text-emerald-300">{item.nota}/200</span>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${Math.min(100, (item.nota / 200) * 100)}%` }}
              />
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{item.feedback}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
