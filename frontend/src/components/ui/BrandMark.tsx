import { Link } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import type { ResolvedTheme } from '../../lib/theme'
import { cn } from '../../lib/cn'

const LOGO = {
  wordmark: {
    dark: '/brand/logo-wordmark.png',
    light: '/brand/logo-wordmark-light.png',
  },
  mark: {
    dark: '/brand/logo-mark.png',
    light: '/brand/logo-mark-light.png',
  },
} as const

type BrandMarkProps = {
  className?: string
  to?: string
  compact?: boolean
}

function logoSources(resolved: ResolvedTheme) {
  const variant = resolved === 'light' ? 'light' : 'dark'
  return { wordmark: LOGO.wordmark[variant], mark: LOGO.mark[variant] }
}

function LogoWordmark({ src, className }: { src: string; className?: string }) {
  return (
    <img
      src={src}
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

function LogoMark({ src, className }: { src: string; className?: string }) {
  return (
    <img
      src={src}
      alt=""
      className={cn('shrink-0 object-contain', className)}
      width={145}
      height={131}
      decoding="async"
    />
  )
}

export function BrandMark({ className, to = '/', compact = false }: BrandMarkProps) {
  const { resolved } = useTheme()
  const sources = logoSources(resolved)

  const content = compact ? (
    <LogoMark
      src={sources.mark}
      className="h-9 w-auto max-w-[2.5rem] sm:h-10 sm:max-w-[2.75rem]"
    />
  ) : (
    <LogoWordmark src={sources.wordmark} />
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
