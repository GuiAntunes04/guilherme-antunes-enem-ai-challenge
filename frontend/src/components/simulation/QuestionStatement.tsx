import DOMPurify from 'dompurify'
import { useMemo } from 'react'

type QuestionStatementProps = {
  html: string
}

const INLINE_FORMULA_MAX_WIDTH = 140
const INLINE_FORMULA_MAX_HEIGHT = 64

function hasTextBesidesImages(element: Element): boolean {
  return [...element.childNodes].some(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent?.trim() ?? '') !== '',
  )
}

function readImageDimension(img: Element, attr: 'width' | 'height'): number | null {
  const raw = img.getAttribute(attr)
  if (!raw) return null

  const value = Number.parseInt(raw, 10)
  return Number.isFinite(value) && value > 0 ? value : null
}

/** Small PNG/SVG formulas from EnemHub — keep inline with invert filter for dark theme. */
function isLikelyInlineFormula(img: Element): boolean {
  const width = readImageDimension(img, 'width')
  const height = readImageDimension(img, 'height')

  if (width !== null && height !== null) {
    return width <= INLINE_FORMULA_MAX_WIDTH && height <= INLINE_FORMULA_MAX_HEIGHT
  }

  if (width !== null) return width <= INLINE_FORMULA_MAX_WIDTH
  if (height !== null) return height <= INLINE_FORMULA_MAX_HEIGHT

  const parent = img.parentElement
  if (parent?.tagName === 'P' && hasTextBesidesImages(parent)) {
    if (width === null && height === null) return false
    return (
      (width === null || width <= INLINE_FORMULA_MAX_WIDTH) &&
      (height === null || height <= INLINE_FORMULA_MAX_HEIGHT)
    )
  }

  return false
}

function prepareDiagramImage(img: HTMLImageElement): void {
  img.removeAttribute('width')
  img.removeAttribute('height')
}

/** Wrap diagram images in <figure> so they are not styled as inline math. */
function normalizeStatementHtml(html: string): string {
  if (typeof DOMParser === 'undefined') return html

  const doc = new DOMParser().parseFromString(`<div id="root">${html}</div>`, 'text/html')
  const root = doc.getElementById('root')
  if (!root) return html

  for (const img of [...root.querySelectorAll('img')]) {
    if (img.closest('figure')) continue
    if (isLikelyInlineFormula(img)) continue

    const parent = img.parentElement
    if (!parent) continue

    const figure = doc.createElement('figure')

    if (parent.tagName === 'P') {
      if (!hasTextBesidesImages(parent) && parent.querySelectorAll('img').length === 1) {
        parent.replaceWith(figure)
        prepareDiagramImage(img)
        figure.appendChild(img)
        continue
      }

      parent.removeChild(img)
      parent.insertAdjacentElement('afterend', figure)
      prepareDiagramImage(img)
      figure.appendChild(img)
      continue
    }

    parent.insertBefore(figure, img)
    prepareDiagramImage(img)
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
    ADD_ATTR: ['src', 'alt', 'width', 'height'],
    FORBID_ATTR: ['style', 'class', 'color', 'bgcolor', 'background'],
  })
}

function prepareStatement(html: string): string {
  return sanitizeStatement(normalizeStatementHtml(html))
}

const inlineFormulaStyles =
  '[&_p_img]:mx-0.5 [&_p_img]:inline [&_p_img]:max-h-[1.25em] [&_p_img]:align-middle [&_p_img]:rounded-none [&_p_img]:border-0 [&_p_img]:invert [&_p_img]:hue-rotate-180'

const diagramFigureStyles =
  '[&_figure]:my-4 [&_figure_img]:mx-auto [&_figure_img]:block [&_figure_img]:h-auto [&_figure_img]:max-h-[28rem] [&_figure_img]:w-full [&_figure_img]:max-w-xl [&_figure_img]:rounded-lg [&_figure_img]:border [&_figure_img]:border-border'

export function QuestionStatement({ html }: QuestionStatementProps) {
  const sanitized = useMemo(() => prepareStatement(html), [html])

  return (
    <div
      className={`question-statement mb-6 text-sm leading-relaxed text-muted-foreground [&_p]:mb-3 [&_p:last-child]:mb-0 [&_sub]:text-[0.75em] [&_sup]:text-[0.75em] ${inlineFormulaStyles} ${diagramFigureStyles}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}
