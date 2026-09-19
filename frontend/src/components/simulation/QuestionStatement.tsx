import DOMPurify from 'dompurify'

type QuestionStatementProps = {
  html: string
}

function sanitizeStatement(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['figure', 'img', 'sup', 'sub'],
    ADD_ATTR: ['src', 'alt'],
    FORBID_ATTR: ['style', 'class', 'color', 'bgcolor', 'background'],
  })
}

export function QuestionStatement({ html }: QuestionStatementProps) {
  const sanitized = sanitizeStatement(html)

  return (
    <div
      className="question-statement mb-6 text-sm leading-relaxed text-slate-200 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_sup]:text-[0.75em] [&_sub]:text-[0.75em] [&_figure]:my-4 [&_figure_img]:mx-auto [&_figure_img]:block [&_figure_img]:max-h-64 [&_figure_img]:rounded-lg [&_figure_img]:border [&_figure_img]:border-slate-700 [&_p_img]:mx-0.5 [&_p_img]:inline [&_p_img]:max-h-[1.25em] [&_p_img]:align-middle [&_p_img]:rounded-none [&_p_img]:border-0 [&_p_img]:invert [&_p_img]:hue-rotate-180"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
