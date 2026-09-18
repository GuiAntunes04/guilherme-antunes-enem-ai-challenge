import DOMPurify from 'dompurify'
import type { SimulationQuestion } from '../../types/simulation'

type QuestionCardProps = {
  question: SimulationQuestion
  selectedOption: string | null
  onSelect: (option: string) => void
  showResult?: boolean
  correctOption?: string | null
}

export function QuestionCard({
  question,
  selectedOption,
  onSelect,
  showResult = false,
  correctOption,
}: QuestionCardProps) {
  const sanitizedStatement = DOMPurify.sanitize(question.statement, {
    ADD_TAGS: ['figure', 'img'],
    ADD_ATTR: ['src', 'alt', 'class'],
  })

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {question.subjectName ?? 'Questão'} — ENEM {question.year}
          </h2>
          {question.difficulty && (
            <p className="mt-1 text-xs text-slate-500">{question.difficulty}</p>
          )}
        </div>
      </div>

      <div
        className="prose prose-invert prose-sm mb-6 max-w-none text-slate-300 [&_figure]:my-4 [&_img]:max-h-64 [&_img]:rounded-lg [&_img]:border [&_img]:border-slate-700"
        dangerouslySetInnerHTML={{ __html: sanitizedStatement }}
      />

      <div className="space-y-2">
        {question.alternatives.map((alternative) => {
          const isSelected = selectedOption === alternative.letter
          const isCorrect = showResult && correctOption === alternative.letter
          const isWrong =
            showResult && isSelected && correctOption !== alternative.letter

          let optionClass =
            'flex w-full cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-left transition'

          if (showResult) {
            if (isCorrect) {
              optionClass += ' border-emerald-500/50 bg-emerald-500/10'
            } else if (isWrong) {
              optionClass += ' border-red-500/50 bg-red-500/10'
            } else {
              optionClass += ' border-slate-800 opacity-60'
            }
          } else if (isSelected) {
            optionClass += ' border-emerald-500 bg-emerald-500/10'
          } else {
            optionClass += ' border-slate-700 hover:border-slate-500'
          }

          return (
            <button
              key={alternative.id}
              type="button"
              disabled={showResult}
              onClick={() => onSelect(alternative.letter)}
              className={optionClass}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-sm font-medium text-white">
                {alternative.letter}
              </span>
              <span className="flex-1 text-sm text-slate-200">{alternative.text}</span>
            </button>
          )
        })}
      </div>
    </article>
  )
}
