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
      <div className="rounded-xl border border-accent/30 bg-accent/10 p-5">
        <p className="text-xs uppercase tracking-wider text-accent-soft">Nota total</p>
        <p className="mt-1 text-3xl font-bold text-white">{feedback.nota_total}/1000</p>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feedback.comentario_geral}</p>
      </div>

      <div className="space-y-3">
        {competencies.map(([key, item]) => (
          <article key={key} className="rounded-xl border border-border-subtle bg-surface-raised/90 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-white">{ESSAY_COMPETENCY_LABELS[key]}</h3>
              <span className="text-sm font-semibold text-accent-soft">{item.nota}/200</span>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-overlay">
              <div
                className="h-full bg-accent"
                style={{ width: `${Math.min(100, (item.nota / 200) * 100)}%` }}
              />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{item.feedback}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
