import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

type BrandMarkProps = {
  className?: string
  to?: string
  compact?: boolean
}

export function BrandMark({ className, to = '/', compact = false }: BrandMarkProps) {
  const content = (
    <>
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-sm font-bold text-accent ring-1 ring-accent/25"
        aria-hidden
      >
        EP
      </span>
      {!compact && (
        <span className="font-display text-lg font-semibold tracking-tight text-foreground">
          ENEM Prep
        </span>
      )}
    </>
  )

  const wrapperClass = cn('inline-flex items-center gap-2.5', className)

  if (to) {
    return (
      <Link to={to} className={cn(wrapperClass, 'transition opacity-95 hover:opacity-100')}>
        {content}
      </Link>
    )
  }

  return <div className={wrapperClass}>{content}</div>
}
