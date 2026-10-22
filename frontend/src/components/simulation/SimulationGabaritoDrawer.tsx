import { X } from 'lucide-react'
import type { SimulationQuizSidebarState } from '../../contexts/SimulationQuizContext'
import { Button } from '../ui/Button'
import { SimulationAnswerSheet } from './SimulationAnswerSheet'

type SimulationGabaritoDrawerProps = Pick<
  SimulationQuizSidebarState,
  'total' | 'currentIndex' | 'answers' | 'questionIds' | 'goToQuestion'
> & {
  open: boolean
  onClose: () => void
}

export function SimulationGabaritoDrawer({
  open,
  onClose,
  total,
  currentIndex,
  answers,
  questionIds,
  goToQuestion,
}: SimulationGabaritoDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Fechar gabarito"
        onClick={onClose}
      />
      <aside
        className="relative flex h-full w-full max-w-sm flex-col border-l border-border-subtle bg-surface-raised shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-label="Gabarito do simulado"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border-subtle px-4 py-3">
          <h2 className="text-sm font-semibold text-foreground">Gabarito</h2>
          <Button variant="ghost" size="sm" className="px-2" onClick={onClose} aria-label="Fechar">
            <X className="h-5 w-5" strokeWidth={2} aria-hidden />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden p-4">
          <SimulationAnswerSheet
            compact
            total={total}
            currentIndex={currentIndex}
            answers={answers}
            questionIds={questionIds}
            goToQuestion={(index) => {
              goToQuestion(index)
              onClose()
            }}
          />
        </div>
      </aside>
    </div>
  )
}
