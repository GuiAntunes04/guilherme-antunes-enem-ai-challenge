import type { SimulationQuizSidebarState } from '../../contexts/SimulationQuizContext'

type SimulationAnswerSheetProps = Pick<
  SimulationQuizSidebarState,
  'total' | 'currentIndex' | 'answers' | 'questionIds' | 'goToQuestion'
> & {
  compact?: boolean
}

function cellClass(isCurrent: boolean, isAnswered: boolean): string {
  const base =
    'flex flex-col items-center justify-center rounded-md border text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400'

  if (isCurrent) {
    return `${base} border-emerald-400 bg-emerald-500/20 text-white ring-1 ring-emerald-400/60`
  }

  if (isAnswered) {
    return `${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:border-emerald-400/60`
  }

  return `${base} border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-500 hover:text-slate-200`
}

export function SimulationAnswerSheet({
  total,
  currentIndex,
  answers,
  questionIds,
  goToQuestion,
  compact = false,
}: SimulationAnswerSheetProps) {
  const answeredCount = questionIds.filter((id) => answers[id]).length

  return (
    <div className={compact ? 'space-y-3' : 'flex min-h-0 flex-1 flex-col overflow-hidden'}>
      <div className={compact ? '' : 'shrink-0 border-t border-slate-800 px-4 py-3'}>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Gabarito
          </h2>
          <p className="text-xs tabular-nums text-slate-500">
            {answeredCount}/{total}
          </p>
        </div>
      </div>

      <div
        className={
          compact
            ? 'max-h-80 overflow-y-auto pr-1'
            : 'min-h-0 flex-1 overflow-y-auto px-4 pb-3'
        }
      >
        <div className="grid grid-cols-5 gap-1.5 content-start">
          {Array.from({ length: total }, (_, index) => {
            const questionId = questionIds[index]
            const selected = questionId ? answers[questionId] : undefined
            const isAnswered = Boolean(selected)
            const isCurrent = index === currentIndex

            return (
              <button
                key={questionId ?? index}
                type="button"
                onClick={() => goToQuestion(index)}
                className={`${cellClass(isCurrent, isAnswered)} h-9 px-0.5 py-0.5`}
                aria-label={
                  isAnswered
                    ? `Questão ${index + 1}, alternativa ${selected}`
                    : `Questão ${index + 1}, em branco`
                }
                aria-current={isCurrent ? 'true' : undefined}
              >
                <span className="text-[11px] font-medium leading-none">{index + 1}</span>
                <span
                  className={`mt-0.5 text-[10px] font-semibold leading-none ${
                    isAnswered ? 'text-emerald-300' : 'text-transparent'
                  }`}
                >
                  {selected ?? '·'}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
