import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type AlertVariant = 'error' | 'success' | 'info'

type AlertProps = {
  variant?: AlertVariant
  tone?: 'dark' | 'light'
  children: ReactNode
  className?: string
}

const variantClassDark: Record<AlertVariant, string> = {
  error: 'border-red-500/30 bg-red-500/10 text-red-200',
  success: 'border-accent/30 bg-accent/10 text-accent-soft',
  info: 'border-indigo-soft/30 bg-indigo-soft/10 text-indigo-soft',
}

const variantClassLight: Record<AlertVariant, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-teal-200 bg-teal-50 text-teal-900',
  info: 'border-blue-200 bg-blue-50 text-blue-900',
}

export function Alert({
  variant = 'error',
  tone = 'dark',
  children,
  className,
}: AlertProps) {
  const variantClass = tone === 'light' ? variantClassLight : variantClassDark

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
