import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BackgroundVideo } from './BackgroundVideo'
import { BrandMark } from './ui/BrandMark'
import { cn } from '../lib/cn'

export type AuthMarketing = {
  eyebrow: string
  headline: string
  subheadline?: string
  body: ReactNode
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
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-surface text-foreground">
      <BackgroundVideo overlayClassName="bg-black/45 bg-gradient-to-br from-black/55 via-black/45 to-black/65" />

      <div
        className={cn(
          'relative z-10 mx-auto flex min-h-dvh max-w-7xl flex-col',
          'px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))]',
          'sm:px-6 md:px-8 lg:px-10 lg:py-6',
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 sm:gap-4">
          <BrandMark to="/login" compact className="sm:hidden" />
          <BrandMark to="/login" className="hidden sm:inline-flex" />
          <Link
            to={navLink.to}
            className="shrink-0 rounded-lg px-2.5 py-2 text-xs font-medium text-white/90 transition hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
          >
            {navLink.label}
          </Link>
        </header>

        <div
          className={cn(
            'flex min-h-0 flex-1 flex-col justify-center gap-8 py-6',
            'md:gap-10 md:py-8',
            'lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-12 lg:py-10 xl:gap-14',
          )}
        >
          <section
            className={cn(
              'order-1 w-full min-w-0 max-w-md justify-self-center',
              'rounded-2xl bg-white p-5 shadow-2xl shadow-black/35 sm:max-w-lg sm:p-8',
              'lg:order-2 lg:max-w-none lg:justify-self-end',
            )}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{title}</p>
            <h2 className="mt-2 text-lg font-bold text-neutral-900 sm:text-xl">{subtitle}</h2>
            <div className="mt-5 sm:mt-6">{children}</div>
            <p className="mt-5 text-center text-sm text-neutral-600 sm:mt-6">{footer}</p>
          </section>

          <aside className="order-2 min-w-0 max-w-xl lg:order-1">
            <p className="text-[0.65rem] font-bold uppercase tracking-[0.18em] text-accent-soft sm:text-xs sm:tracking-[0.2em]">
              {marketing.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-2xl font-bold leading-tight text-white sm:mt-4 sm:text-3xl md:text-4xl lg:text-[2.5rem] lg:leading-[1.15] xl:text-[2.65rem]">
              {marketing.headline}
            </h1>
            {marketing.subheadline && (
              <p className="mt-3 text-base font-semibold text-white/95 sm:mt-4 sm:text-lg">
                {marketing.subheadline}
              </p>
            )}
            <div className="mt-3 text-sm leading-relaxed text-white/85 sm:mt-4 sm:text-base">
              {marketing.body}
            </div>
            {marketing.bullets && marketing.bullets.length > 0 && (
              <ul className="mt-4 space-y-2 sm:mt-6 sm:space-y-2.5">
                {marketing.bullets.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-white/90 sm:gap-2.5 sm:text-base">
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
