import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { BackgroundVideo } from './BackgroundVideo'
import { BrandMark } from './ui/BrandMark'
import { ThemeToggle } from './ui/ThemeToggle'
import { cn } from '../lib/cn'

export type AuthMarketing = {
  eyebrow?: string
  headline: string
  subheadline?: string
  body?: ReactNode
  bullets?: string[]
}

type AuthLayoutProps = {
  title: string
  subtitle: string
  marketing: AuthMarketing
  navLink: { to: string; label: string }
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({
  title,
  subtitle,
  marketing,
  navLink,
  children,
  footer,
}: AuthLayoutProps) {
  const { resolved } = useTheme()
  const isLight = resolved === 'light'

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-surface text-foreground">
      <BackgroundVideo
        overlayClassName={
          isLight
            ? 'bg-surface/75 bg-gradient-to-br from-surface/85 via-surface/70 to-surface/80'
            : 'bg-black/45 bg-gradient-to-br from-black/55 via-black/45 to-black/65'
        }
      />

      <div
        className={cn(
          'relative z-10 mx-auto flex min-h-dvh max-w-7xl flex-col',
          'px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]',
          'sm:px-6 md:px-8 lg:px-10 lg:py-6',
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 sm:gap-4">
          <BrandMark to="/login" className="max-w-[9rem] sm:max-w-none" />
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <ThemeToggle
              compact
              className={
                isLight
                  ? 'text-muted hover:bg-surface-overlay hover:text-foreground'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }
            />
            <Link
              to={navLink.to}
              className={cn(
                'rounded-lg px-2.5 py-2 text-xs font-medium transition sm:px-3 sm:text-sm',
                isLight
                  ? 'text-foreground hover:bg-surface-overlay'
                  : 'text-white/90 hover:bg-white/10 hover:text-white',
              )}
            >
              {navLink.label}
            </Link>
          </div>
        </header>

        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col justify-center gap-8 py-6',
            'max-md:mx-auto max-md:w-full max-md:max-w-xl',
            'md:grid md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-10 md:py-8',
            'lg:gap-12 lg:py-10 xl:gap-14',
          )}
        >
          <section
            className={cn(
              'order-2 w-full min-w-0 max-w-lg',
              'rounded-2xl bg-white p-5 text-neutral-900 shadow-2xl sm:p-8',
              isLight ? 'shadow-black/10' : 'shadow-black/35',
              'md:order-2 md:max-w-none md:justify-self-end',
            )}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{title}</p>
            <h2 className="mt-2 text-lg font-bold sm:text-xl">{subtitle}</h2>
            <div className="mt-5 text-neutral-900 sm:mt-6">{children}</div>
            <p className="mt-5 text-center text-sm text-neutral-600 sm:mt-6">{footer}</p>
          </section>

          <aside className="order-1 min-w-0 w-full md:order-1 md:max-w-none">
            {marketing.eyebrow && (
              <p
                className={cn(
                  'text-[0.65rem] font-bold uppercase tracking-[0.18em] sm:text-xs sm:tracking-[0.2em]',
                  isLight ? 'text-accent-strong' : 'text-accent-soft',
                )}
              >
                {marketing.eyebrow}
              </p>
            )}
            <h1
              className={cn(
                'font-display text-2xl font-bold leading-tight sm:text-3xl md:text-[2rem] md:leading-[1.15] lg:text-[2.5rem] xl:text-[2.65rem]',
                marketing.eyebrow ? 'mt-3 sm:mt-4' : 'mt-0',
                isLight ? 'text-foreground' : 'text-white',
              )}
            >
              {marketing.headline}
            </h1>
            {marketing.subheadline && (
              <p
                className={cn(
                  'mt-3 text-base font-semibold sm:mt-4 sm:text-lg',
                  isLight ? 'text-foreground' : 'text-white/95',
                )}
              >
                {marketing.subheadline}
              </p>
            )}
            {marketing.body && (
              <div
                className={cn(
                  'mt-3 text-sm leading-relaxed sm:mt-4 sm:text-base',
                  isLight ? 'text-muted-foreground' : 'text-white/85',
                )}
              >
                {marketing.body}
              </div>
            )}
            {marketing.bullets && marketing.bullets.length > 0 && (
              <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-2.5">
                {marketing.bullets.map((item) => (
                  <li
                    key={item}
                    className={cn(
                      'flex gap-2 text-sm sm:gap-2.5 sm:text-base',
                      isLight ? 'text-foreground' : 'text-white/90',
                    )}
                  >
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden
                    />
                    <span className="min-w-0">{item}</span>
                  </li>
                ))}
              </ul>
            )}
          </aside>
        </div>
      </div>
    </div>
  )
}
