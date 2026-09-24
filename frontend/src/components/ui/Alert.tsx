import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type AlertVariant = 'error' | 'success' | 'info'

type AlertProps = {
  variant?: AlertVariant
  children: ReactNode
  className?: string
}

const variantClass: Record<AlertVariant, string> = {
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
  success: 'border-accent/30 bg-accent/10 text-accent-soft',
  info: 'border-indigo-soft/30 bg-indigo-soft/10 text-indigo-soft',
}

export function Alert({ variant = 'error', children, className }: AlertProps) {
  return (
    <p
      className={cn(
        'rounded-lg border px-3 py-2 text-sm',
        variantClass[variant],
        className,
      )}
      role="alert"
    >
      {children}
    </p>
  )
}
