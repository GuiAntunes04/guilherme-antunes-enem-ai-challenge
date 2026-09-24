import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type CardPadding = 'none' | 'sm' | 'md' | 'lg'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article'
  padding?: CardPadding
  children: ReactNode
}

const paddingClass: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  as: Component = 'div',
  padding = 'md',
  className,
  children,
  ...props
}: CardProps) {
  return (
    <Component
      className={cn(
        'rounded-[var(--radius-card)] border border-border-subtle bg-surface-raised/90 shadow-sm shadow-black/20',
        paddingClass[padding],
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  )
}
