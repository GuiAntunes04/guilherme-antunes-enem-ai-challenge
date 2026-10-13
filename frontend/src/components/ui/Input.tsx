import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type InputTone = 'dark' | 'light'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: ReactNode
  tone?: InputTone
}

export const inputToneClass: Record<InputTone, { label: string; input: string; hint: string }> = {
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
  const styles = inputToneClass[tone]

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

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string
  hint?: ReactNode
  tone?: InputTone
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

export function PasswordInput({
  label,
  hint,
  tone = 'dark',
  className,
  id,
  ...props
}: PasswordInputProps) {
  const generatedId = useId()
  const inputId = id ?? props.name ?? generatedId
  const styles = inputToneClass[tone]
  const [visible, setVisible] = useState(false)

  return (
    <div className="block">
      <label className={cn('mb-1.5 block text-sm', styles.label)} htmlFor={inputId}>
        {label}
      </label>
      <div className="relative">
        <input
          id={inputId}
          type={visible ? 'text' : 'password'}
          className={cn(
            'w-full rounded-lg border py-2.5 pl-3 pr-11 text-base outline-none transition focus:ring-2 sm:text-sm',
            styles.input,
            className,
          )}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className={cn(
            'absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg transition',
            tone === 'light'
              ? 'text-neutral-500 hover:text-neutral-800'
              : 'text-muted hover:text-foreground',
          )}
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {hint && <span className={cn('mt-1 block text-xs', styles.hint)}>{hint}</span>}
    </div>
  )
}
