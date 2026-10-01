import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

const LOGO_MARK_SRC = '/brand/logo-mark.png'

type BrandMarkProps = {
  className?: string
  to?: string
  compact?: boolean
}

function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={LOGO_MARK_SRC}
      alt=""
      className={cn('shrink-0 object-contain', className)}
      width={222}
      height={154}
      decoding="async"
    />
  )
}

function LogoWordmark() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-sans text-xl font-bold leading-none tracking-tight text-foreground">
        ENE
      </span>
      <LogoMark className="h-9 w-auto" />
      <span className="font-sans text-sm font-normal leading-none text-foreground/95">Prep</span>
    </span>
  )
}

export function BrandMark({ className, to = '/', compact = false }: BrandMarkProps) {
  const content = compact ? <LogoMark className="h-10 w-auto max-w-[2.75rem]" /> : <LogoWordmark />

  const wrapperClass = cn('inline-flex items-center', className)

  if (to) {
    return (
      <Link
        to={to}
        className={cn(
          wrapperClass,
          'transition opacity-95 hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        )}
        aria-label="ENEM Prep — início"
      >
        {content}
      </Link>
    )
  }

  return <div className={wrapperClass}>{content}</div>
}
