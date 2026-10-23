import type { PointerEvent } from 'react'

/** Stops mobile browsers from scrolling the page when a control receives focus after tap. */
export function preventTouchFocus(event: PointerEvent<HTMLElement>): void {
  if (event.pointerType === 'touch') {
    event.preventDefault()
  }
}
