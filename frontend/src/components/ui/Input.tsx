import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type InputTone = 'dark' | 'light'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: ReactNode
  tone?: InputTone
}

const toneClass: Record<InputTone, { label: string; input: string; hint: string }> = {
  dark: {
    label: 'text-muted-foreground',
    input:
      'border-border bg-surface text-foreground placeholder:text-muted/70 focus:border-accent focus:ring-accent/20',
    hint: 'text-muted',
  },
  light: {
    label: 'text-neutral-700',
    input:
      'border-neutral-200 bg-neutral-100 text-neutral-900 placeholder:text-neutral-400 focus:border-accent-strong focus:ring-accent/25',
    hint: 'text-neutral-500',
  },
}

export function Input({ label, hint, tone = 'dark', className, id, ...props }: InputProps) {
  const inputId = id ?? props.name
  const styles = toneClass[tone]

  return (
    <label className="block" htmlFor={inputId}>
      <span className={cn('mb-1.5 block text-sm', styles.label)}>{label}</span>
      <input
        id={inputId}
        className={cn(
          'w-full rounded-lg border px-3 py-2.5 text-base outline-none transition focus:ring-2 sm:text-sm',
          styles.input,
          className,
        )}
        {...props}
      />
      {hint && <span className={cn('mt-1 block text-xs', styles.hint)}>{hint}</span>}
    </label>
  )
}
