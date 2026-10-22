import type { ReactNode } from 'react'
import { Button } from './Button'
import { Card } from './Card'

type ConfirmButtonVariant = 'primary' | 'secondary' | 'danger'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  cancelLabel?: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
  /** When true, the cancel button uses the primary style (e.g. “stay” flows). */
  cancelIsPrimary?: boolean
  confirmVariant?: ConfirmButtonVariant
  confirmDisabled?: boolean
  titleId?: string
  descriptionId?: string
}

export function ConfirmDialog({
  open,
  title,
  description,
  cancelLabel = 'Cancelar',
  confirmLabel,
  onCancel,
  onConfirm,
  cancelIsPrimary = false,
  confirmVariant = 'danger',
  confirmDisabled = false,
  titleId = 'confirm-dialog-title',
  descriptionId = 'confirm-dialog-desc',
}: ConfirmDialogProps) {
  if (!open) return null

  const cancelVariant: ConfirmButtonVariant = cancelIsPrimary ? 'primary' : 'secondary'
  const actionVariant: ConfirmButtonVariant = cancelIsPrimary ? 'secondary' : confirmVariant

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Fechar"
        onClick={onCancel}
      />
      <Card
        as="section"
        padding="lg"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="relative z-10 w-full max-w-md shadow-xl shadow-black/40"
      >
        <h2 id={titleId} className="text-lg font-semibold text-foreground">
          {title}
        </h2>
        <p id={descriptionId} className="mt-2 text-sm text-muted">
          {description}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant={actionVariant} disabled={confirmDisabled} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant={cancelVariant} onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </Card>
    </div>
  )
}
