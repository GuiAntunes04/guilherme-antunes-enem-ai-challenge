import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

const LOGO_WORDMARK_SRC = '/brand/logo-wordmark.png'
const LOGO_MARK_SRC = '/brand/logo-mark.png'

type BrandMarkProps = {
  className?: string
  to?: string
  compact?: boolean
}

function LogoWordmark({ className }: { className?: string }) {
  return (
    <img
      src={LOGO_WORDMARK_SRC}
      alt="ENEM Prep"
      className={cn(
        'h-7 w-auto max-w-[min(100%,11rem)] shrink-0 object-contain sm:h-8 md:h-9 md:max-w-[min(100%,13.5rem)]',
        className,
      )}
      width={965}
      height={190}
      decoding="async"
    />
  )
}

function LogoMark({ className }: { className?: string }) {
  return (
    <img
      src={LOGO_MARK_SRC}
      alt=""
      className={cn('shrink-0 object-contain', className)}
      width={145}
      height={131}
      decoding="async"
    />
  )
}

export function BrandMark({ className, to = '/', compact = false }: BrandMarkProps) {
  const content = compact ? (
    <LogoMark className="h-9 w-auto max-w-[2.5rem] sm:h-10 sm:max-w-[2.75rem]" />
  ) : (
    <LogoWordmark />
  )

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
