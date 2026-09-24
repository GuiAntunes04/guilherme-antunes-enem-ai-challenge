import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type PageHeaderProps = {
  eyebrow?: string
  title: string
  description?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, className }: PageHeaderProps) {
  return (
    <header className={cn('max-w-2xl', className)}>
      {eyebrow && (
        <p className="mb-3 flex items-center gap-2 text-sm font-medium text-accent">
          <span className="h-px w-6 bg-accent/60" aria-hidden />
          {eyebrow}
        </p>
      )}
      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      {description && (
        <div className="mt-4 text-lg leading-relaxed text-muted">{description}</div>
      )}
    </header>
  )
}
