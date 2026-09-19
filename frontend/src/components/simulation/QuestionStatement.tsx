import DOMPurify from 'dompurify'
import { useMemo } from 'react'

type QuestionStatementProps = {
  html: string
}

function hasTextBesidesImages(element: Element): boolean {
  return [...element.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent?.trim() ?? '') !== '',
  )
}

/** Wrap diagram images in <figure> so they are not styled as inline math. */
function normalizeStatementHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html')
  const root = doc.getElementById('root')
  if (!root) return html

  for (const img of [...root.querySelectorAll('img')]) {
    if (img.closest('figure')) continue

    const parent = img.parentElement
    if (!parent) continue

    const figure = doc.createElement('figure')

    if (parent.tagName === 'P') {
      if (!hasTextBesidesImages(parent) && parent.querySelectorAll('img').length === 1) {
        parent.replaceWith(figure)
        figure.appendChild(img)
        continue
      }

      parent.removeChild(img)
      parent.insertAdjacentElement('afterend', figure)
      figure.appendChild(img)
      continue
    }

    parent.insertBefore(figure, img)
    figure.appendChild(img)
  }

  root.querySelectorAll('p').forEach((paragraph) => {
    if (!paragraph.textContent?.trim() && !paragraph.querySelector('img')) {
      paragraph.remove()
    }
  })

  return root.innerHTML
}

function sanitizeStatement(html: string): string {
  return DOMPurify.sanitize(html, {
    ADD_TAGS: ['figure', 'img', 'sup', 'sub'],
    ADD_ATTR: ['src', 'alt'],
    FORBID_ATTR: ['style', 'class', 'color', 'bgcolor', 'background'],
  })
}

function prepareStatement(html: string): string {
  return sanitizeStatement(normalizeStatementHtml(html))
}

export function QuestionStatement({ html }: QuestionStatementProps) {
  const sanitized = useMemo(() => prepareStatement(html), [html])

  return (
    <div
      className="question-statement mb-6 text-sm leading-relaxed text-slate-200 [&_figure]:my-4 [&_figure_img]:mx-auto [&_figure_img]:block [&_figure_img]:h-auto [&_figure_img]:max-h-80 [&_figure_img]:w-auto [&_figure_img]:max-w-full [&_figure_img]:rounded-lg [&_figure_img]:border [&_figure_img]:border-slate-700 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_p_img]:mx-0.5 [&_p_img]:inline [&_p_img]:max-h-[1.25em] [&_p_img]:align-middle [&_p_img]:rounded-none [&_p_img]:border-0 [&_p_img]:invert [&_p_img]:hue-rotate-180 [&_sub]:text-[0.75em] [&_sup]:text-[0.75em]"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
