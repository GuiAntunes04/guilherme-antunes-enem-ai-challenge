import type { ReactNode } from 'react'
import { BrandMark } from './ui/BrandMark'
import { Card } from './ui/Card'

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-surface text-foreground">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--color-accent-glow),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 top-1/3 h-64 w-64 rounded-full bg-indigo-soft/5 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <BrandMark to="/login" className="mb-10" />

        <Card padding="lg" className="border-border/80 bg-surface-raised/95 backdrop-blur-sm">
          <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </Card>

        <p className="mt-6 text-center text-sm text-muted">{footer}</p>
      </div>
    </div>
  )
}
