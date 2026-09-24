import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: ReactNode
}

export function Input({ label, hint, className, id, ...props }: InputProps) {
  const inputId = id ?? props.name

  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-1.5 block text-sm text-muted-foreground">{label}</span>
      <input
        id={inputId}
        className={cn(
          'w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-foreground outline-none transition placeholder:text-muted/70 focus:border-accent focus:ring-2 focus:ring-accent/20',
          className,
        )}
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}
