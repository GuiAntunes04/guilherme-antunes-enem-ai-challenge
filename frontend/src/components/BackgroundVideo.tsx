import { useEffect, useState } from 'react'
import { cn } from '../lib/cn'

type BackgroundVideoProps = {
  className?: string
  overlayClassName?: string
  src?: string
}

export function BackgroundVideo({
  className,
  overlayClassName,
  src = '/videos/background.mp4',
}: BackgroundVideoProps) {
  const [showVideo, setShowVideo] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')

    function sync() {
      setShowVideo(!media.matches)
    }

    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
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
