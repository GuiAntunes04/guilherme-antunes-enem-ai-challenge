import { useEffect, useState } from 'react'
import { cn } from '../lib/cn'

type BackgroundVideoProps = {
  className?: string
  overlayClassName?: string
  src?: string
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function prefersMobileLayout(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 768px)').matches
}

export function BackgroundVideo({
  className,
  overlayClassName,
  src = '/videos/background.mp4',
}: BackgroundVideoProps) {
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    setShowVideo(!prefersReducedMotion() && !prefersMobileLayout())
  }, [])

  if (!showVideo) {
    return (
      <div
        className={cn(
          'pointer-events-none absolute inset-0 bg-surface',
          'bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,var(--color-accent-glow),transparent_55%)]',
          className,
        )}
        aria-hidden
      />
    )
  }

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)} aria-hidden>
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        src={src}
      />
      <div
        className={cn(
          'absolute inset-0 bg-surface/75 bg-gradient-to-b from-surface/60 via-surface/80 to-surface/95',
          overlayClassName,
        )}
      />
    </div>
  )
}
