import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
  children: ReactNode
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'bg-accent-strong text-white shadow-sm shadow-accent/20 hover:bg-accent disabled:opacity-60',
  secondary:
    'border border-border bg-surface-overlay text-muted-foreground hover:border-muted hover:text-foreground disabled:opacity-60',
  ghost: 'text-muted hover:text-foreground disabled:opacity-60',
  danger:
    'border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 disabled:opacity-60',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-sm font-medium',
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
